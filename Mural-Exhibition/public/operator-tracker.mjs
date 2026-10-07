import {INTERACTION_CONFIG} from './interaction-config.mjs';

const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const inside=(p,z)=>p.x>=z.left&&p.x<=z.right&&p.y>=z.top&&p.y<=z.bottom;
export class OperatorTracker {
 constructor(config={}) {this.config={...INTERACTION_CONFIG,...config};this.serial=0;this.reset();}
 reset() {
  this.state='SEARCHING';this.tracks=[];this.active=null;this.candidate=null;
  this.assignments={};this.lastPoseAt=-Infinity;this.poses=[];this.released=false;
 }
 distance(a,b) {return Math.hypot(a.x-b.x,(a.y-b.y)/this.config.imageAspect);}
 point(lm,i) {
  const p=lm?.[i];return finite(p)&&Math.min(p.visibility??0,p.presence??1)>=this.config.landmarkConfidence?{x:p.x,y:p.y}:null;
 }
 body(lm) {
  const ls=this.point(lm,11),rs=this.point(lm,12),lh=this.point(lm,23),rh=this.point(lm,24);
  if(!ls||!rs||!lh||!rh)return null;
  const shoulderWidth=this.distance(ls,rs);if(shoulderWidth<this.config.minShoulderWidth)return null;
  const center={x:(ls.x+rs.x+lh.x+rh.x)/4,y:(ls.y+rs.y+lh.y+rh.y)/4};
  const leftWrist=this.point(lm,15),rightWrist=this.point(lm,16);
  const confidence=[11,12,23,24,15,16].reduce((v,i)=>v+Math.min(lm[i]?.visibility??0,lm[i]?.presence??1),0)/6;
  return {center,shoulderWidth,leftWrist,rightWrist,confidence};
 }
 matchBodies(bodies,at) {
  const c=this.config,old=this.tracks.filter(t=>at-t.lastSeenAt<=c.operatorLossGraceMs);
  const costs=(t,b)=>{
   const ratio=b.shoulderWidth/t.shoulderWidth;
   if(ratio<c.personMinScaleRatio||ratio>c.personMaxScaleRatio)return Infinity;
   const movement=this.distance(t.center,b.center)/t.shoulderWidth;
   return movement>c.personMatchDistance?Infinity:movement+Math.abs(Math.log(ratio))*c.personScaleCostWeight;
  };
  const pairs=[];
  for(const t of old)for(let i=0;i<bodies.length;i++){
   const cost=costs(t,bodies[i]);if(!Number.isFinite(cost))continue;
   // Overlapping/competing body tracks are not an identity proof. Withhold them.
   const alternatives=old.filter(q=>q!==t).map(q=>costs(q,bodies[i]));
   const otherBodies=bodies.filter((_,j)=>j!==i).map(b=>costs(t,b));
   if([...alternatives,...otherBodies].some(v=>Number.isFinite(v)&&Math.abs(v-cost)<c.personMatchAmbiguity))continue;
   pairs.push({t,i,cost});
  }
  pairs.sort((a,b)=>a.cost-b.cost);const usedTracks=new Set(),usedBodies=new Set();
  for(const {t,i}of pairs)if(!usedTracks.has(t.id)&&!usedBodies.has(i)){
   Object.assign(t,bodies[i],{lastSeenAt:at});usedTracks.add(t.id);usedBodies.add(i);
  }
  // Ambiguous observations must not create a fresh competing controller.
  for(let i=0;i<bodies.length;i++)if(!usedBodies.has(i)&&!old.some(t=>Number.isFinite(costs(t,bodies[i])))){
   old.push({...bodies[i],id:`visitor-${++this.serial}`,firstSeenAt:at,lastSeenAt:at});
  }
  this.tracks=old;this.poses=old.filter(t=>t.lastSeenAt===at);
 }
 score(t,now) {
  const c=this.config,z=c.primaryZone,w=c.candidateWeights;
  const center=1-Math.min(1,Math.abs(t.center.x-(z.left+z.right)/2)/((z.right-z.left)/2));
  const size=Math.min(1,t.shoulderWidth/c.bodySizeReference),stability=Math.min(1,(now-t.firstSeenAt)/c.operatorAcquireMs);
  return center*w.center+size*w.size+t.confidence*w.visibility+stability*w.stability;
 }
 update({poses=[],poseAt, hands=[],now}) {
  this.released=false;
  if(this.state==='PERSON_RELEASE'){this.state='SEARCHING';this.candidate=null;}
  const fresh=Number.isFinite(poseAt)&&poseAt<=now&&now-poseAt<=this.config.poseMaxAgeMs;
  if(fresh&&poseAt>this.lastPoseAt){
   if(poseAt-this.lastPoseAt>this.config.poseMaxAgeMs)this.candidate=null;
   this.matchBodies(poses.map(p=>this.body(p)).filter(Boolean),poseAt);this.lastPoseAt=poseAt;
  }
  const visible=fresh?this.poses.filter(p=>inside(p.center,this.config.primaryZone)):[];
  if(this.active){
   const observed=visible.find(t=>t.id===this.active.id);
   if(observed)this.active={...observed,lockedSince:this.active.lockedSince};
   // lastSeenAt is only advanced by a NEW pose observation, never by a cached result.
   if(!observed&&now-this.active.lastSeenAt>=this.config.operatorLossGraceMs){
    this.active=null;this.candidate=null;this.assignments={};this.state='PERSON_RELEASE';this.released=true;
   }
  }else if(this.state!=='PERSON_RELEASE'){
   const best=visible.sort((a,b)=>this.score(b,now)-this.score(a,now))[0];
   if(!best){this.state='SEARCHING';this.candidate=null;}
   else {
    if(this.candidate?.id!==best.id)this.candidate={id:best.id,since:now};
    this.state='CANDIDATE';
    if(now-this.candidate.since>=this.config.operatorAcquireMs){
     this.active={...best,lockedSince:now};this.state='PERSON_LOCKED';this.candidate=null;
    }
   }
  }
  const observable=this.active&&visible.some(t=>t.id===this.active.id);
  const assignedHands=observable?this.assign(hands,now):[];
  if(!observable)this.assignments={};
  return {operatorState:this.state,activeOperator:this.active,assignedHands,released:this.released,
   diagnostics:{poseFresh:fresh,poseAgeMs:Number.isFinite(poseAt)?now-poseAt:null,
    candidateHoldMs:this.candidate?now-this.candidate.since:0,
    operatorLossMs:this.active?Math.max(0,now-this.active.lastSeenAt):0,
    handsDetected:hands.length,handsAssigned:assignedHands.length,
    leftAssigned:assignedHands.some(h=>h.side==='left'),rightAssigned:assignedHands.some(h=>h.side==='right')}};
 }
 assign(hands,now) {
  const c=this.config,a=this.active,choices=[];
  for(let i=0;i<hands.length;i++){
   const lm=hands[i],w=lm?.[0];if(!finite(w)||!finite(lm[9])||lm.length!==21)continue;
   const options=[];
   for(const p of this.poses)for(const side of ['left','right']){
    const wrist=p[side+'Wrist'];if(wrist)options.push({id:p.id,side,d:this.distance(w,wrist)/p.shoulderWidth});
   }
   options.sort((x,y)=>x.d-y.d);const best=options[0];
   if(!best||best.id!==a.id||best.d>c.handAssignmentMaxDistance)continue;
   if(options[1]&&options[1].d-best.d<c.handAssignmentAmbiguity)continue;
   const prior=this.assignments[best.side];
   if(prior&&this.distance(w,prior.wrist)/a.shoulderWidth>c.handMaxJump){delete this.assignments[best.side];continue;}
   choices.push({side:best.side,d:best.d,landmarks:lm,wrist:{x:w.x,y:w.y},x:1-lm[9].x,y:lm[9].y,
    operatorId:a.id,lastSeenAt:now,fresh:true});
  }
  const current={};
  for(const side of ['left','right']){
   const options=choices.filter(h=>h.side===side).sort((x,y)=>x.d-y.d);
   // Two detections competing for one wrist are also ambiguous; never use both.
   if(options.length>1&&options[1].d-options[0].d<c.handAssignmentAmbiguity){delete this.assignments[side];continue;}
   if(options[0])current[side]=options[0];
   else {
    const prior=this.assignments[side],w=a[side+'Wrist'];
    if(prior&&w&&now-prior.lastSeenAt<c.handAssignmentGraceMs&&this.distance(prior.wrist,w)/a.shoulderWidth<=c.handAssignmentMaxDistance){
     // Reserve the side briefly without reusing old landmarks as new motion evidence.
     current[side]={...prior,fresh:false};
    }
   }
  }
  this.assignments=current;return Object.values(current);
 }
}
