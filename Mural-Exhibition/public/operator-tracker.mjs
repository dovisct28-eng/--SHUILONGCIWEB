import {INTERACTION_CONFIG} from './interaction-config.mjs';

const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const inside=(p,z)=>p.x>=z.left&&p.x<=z.right&&p.y>=z.top&&p.y<=z.bottom;
export class OperatorTracker {
 constructor(config={}) {this.config={...INTERACTION_CONFIG,...config};this.serial=0;this.reset();}
 reset() {
  this.state='SEARCHING';this.tracks=[];this.active=null;this.candidate=null;
  this.assignments={};this.lastPoseAt=-Infinity;this.poses=[];this.bodies=[];this.released=false;this.rejections=[];
 }
 distance(a,b) {return Math.hypot(a.x-b.x,(a.y-b.y)/this.config.imageAspect);}
 point(lm,i) {
  const p=lm?.[i];return finite(p)&&Math.min(p.visibility??0,p.presence??1)>=this.config.landmarkConfidence?{x:p.x,y:p.y}:null;
 }
 body(lm) {
  const ls=this.point(lm,11),rs=this.point(lm,12);
  const hip=i=>{const p=this.point(lm,i);return p&&inside(p,{left:0,right:1,top:0,bottom:1})?p:null;};
  const lh=hip(23),rh=hip(24);
  if(!ls||!rs)return null;
  const shoulderWidth=this.distance(ls,rs);if(shoulderWidth<this.config.minShoulderWidth)return null;
  // Identity, central priority and motion always use the same upper-body anchor.
  const center={x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2};
  const leftWrist=this.point(lm,15),rightWrist=this.point(lm,16);
  const reliable=[11,12,...(lh?[23]:[]),...(rh?[24]:[]),...(leftWrist?[15]:[]),...(rightWrist?[16]:[])];
  const confidence=reliable.reduce((v,i)=>v+Math.min(lm[i].visibility,lm[i].presence??1),0)/reliable.length;
  const torsoComplete=!!(lh&&rh);
  return {center,shoulderWidth,leftShoulder:ls,rightShoulder:rs,leftWrist,rightWrist,
   leftHip:lh,rightHip:rh,torsoComplete,bodyMode:torsoComplete?'full':'upper',confidence,
   torsoCenter:torsoComplete?{x:(ls.x+rs.x+lh.x+rh.x)/4,y:(ls.y+rs.y+lh.y+rh.y)/4}:null};
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
  // Retain EVERY observed body for hand competition, including withheld identities.
  this.bodies=bodies.map((b,i)=>({...b,id:this.poses.find(t=>t.center===b.center)?.id??`unresolved-${i}`}));
 }
 score(t,now) {
  const c=this.config,z=c.primaryZone,w=c.candidateWeights;
  const center=1-Math.min(1,Math.abs(t.center.x-(z.left+z.right)/2)/((z.right-z.left)/2));
  const size=Math.min(1,t.shoulderWidth/c.bodySizeReference),stability=Math.min(1,(now-t.firstSeenAt)/c.operatorAcquireMs);
  return center*w.center+size*w.size+t.confidence*w.visibility+stability*w.stability;
 }
 update({poses=[],poseAt, hands=[],now}) {
  this.released=false;
  this.rejections=[];
  if(this.state==='PERSON_RELEASE'){this.state='SEARCHING';this.candidate=null;}
  const fresh=Number.isFinite(poseAt)&&poseAt<=now&&now-poseAt<=this.config.poseMaxAgeMs;
  if(fresh&&poseAt>this.lastPoseAt){
   if(poseAt-this.lastPoseAt>this.config.poseMaxAgeMs)this.candidate=null;
   this.matchBodies(poses.map(p=>this.body(p)).filter(Boolean),poseAt);this.lastPoseAt=poseAt;
  }
  const frame={left:0,right:1,top:0,bottom:1};
  const visible=fresh?this.poses.filter(p=>inside(p.center,this.config.primaryZone)&&inside(p.leftShoulder,frame)&&inside(p.rightShoulder,frame)):[];
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
  const source=side=>assignedHands.find(h=>h.side===side)?.source??null;
  return {operatorState:this.state,activeOperator:this.active,assignedHands,released:this.released,
   diagnostics:{poseFresh:fresh,operatorObservable:!!observable,poseAgeMs:Number.isFinite(poseAt)?now-poseAt:null,
    candidateHoldMs:this.candidate?now-this.candidate.since:0,
    operatorLossMs:this.active?Math.max(0,now-this.active.lastSeenAt):0,
    handsDetected:hands.length,handsAssigned:assignedHands.length,
    leftAssigned:assignedHands.some(h=>h.side==='left'),rightAssigned:assignedHands.some(h=>h.side==='right'),
    leftSource:source('left'),rightSource:source('right'),posePeople:this.bodies.length,
    bodyMode:this.active?.bodyMode??null,shoulderWidth:this.active?.shoulderWidth??null,
    hipsVisible:!!this.active?.torsoComplete,leftWristVisible:!!this.active?.leftWrist,rightWristVisible:!!this.active?.rightWrist,
    assignmentRejections:this.rejections,assignmentBlocked:this.rejections.some(r=>['AMBIGUOUS_PERSON','AMBIGUOUS_SIDE','HAND_JUMP'].includes(r.reason)),
    assignmentStatus:!fresh?'STALE':!observable?'NO_OPERATOR':this.rejections.length?'REJECTED':'OK'}};
 }
 reject(index,reason) {this.rejections.push({hand:index,reason});return null;}
 matchHandToPoseWrist(w,index,now) {
  const c=this.config;let best=null,second=null;
  for(const p of this.bodies)for(const side of ['left','right']){
   const wrist=p[side+'Wrist'];if(!wrist)continue;
   const option={id:p.id,side,d:this.distance(w,wrist)/p.shoulderWidth};
   if(!best||option.d<best.d){second=best;best=option;}else if(!second||option.d<second.d)second=option;
  }
  if(!best||best.d>c.handAssignmentMaxDistance)return {fallback:true,reason:best?'TOO_FAR':'NO_POSE_WRIST'};
  if(best.id!==this.active.id)return this.reject(index,Number.isFinite(this.envelopeScore(w,this.active))?'AMBIGUOUS_PERSON':'OTHER_PERSON');
  if(second&&second.d-best.d<c.handAssignmentAmbiguity)return this.reject(index,second.id===best.id?'AMBIGUOUS_SIDE':'AMBIGUOUS_PERSON');
  // A missing wrist must not make the surviving wrist swallow BOTH hands on close.
  const other=best.side==='left'?'right':'left',prior=this.assignments[other];
  if(!this.active[other+'Wrist']&&prior&&now-prior.lastSeenAt<c.handAssignmentGraceMs
   &&this.distance(w,prior.wrist)/this.active.shoulderWidth+c.handAssignmentAmbiguity<best.d)return {fallback:true,reason:'NO_POSE_WRIST'};
  // A nearby visitor without wrists is still competing ownership evidence.
  if(this.personCompetition(w))return this.reject(index,'AMBIGUOUS_PERSON');
  return {...best,source:'pose'};
 }
 envelopeScore(w,p) {
  const c=this.config,s=p.shoulderWidth,dx=(w.x-p.center.x)/s,dy=(w.y-p.center.y)/(s*c.imageAspect);
  if(Math.abs(dx)>c.handEnvelopeHalfWidth||dy< -c.handEnvelopeAbove||dy>c.handEnvelopeBelow)return Infinity;
  return Math.min(this.distance(w,p.leftShoulder),this.distance(w,p.rightShoulder))/s;
 }
 personCompetition(w) {
  const score=this.envelopeScore(w,this.active);
  return this.bodies.some(p=>p.id!==this.active.id&&Number.isFinite(this.envelopeScore(w,p))&&this.envelopeScore(w,p)<=score+this.config.handPersonAmbiguity);
 }
 resolveHandSide(w,now) {
  const a=this.active,c=this.config;
  const prior=Object.entries(this.assignments).filter(([,h])=>now-h.lastSeenAt<c.handAssignmentGraceMs)
   .map(([side,h])=>({side,d:this.distance(w,h.wrist)/a.shoulderWidth})).sort((x,y)=>x.d-y.d);
  const continuity=prior[0]?.d<=c.handFallbackContinuity&&(!prior[1]||prior[1].d-prior[0].d>=c.handAssignmentAmbiguity)?prior[0]:null;
  const sides=['left','right'].map(side=>({side,d:this.distance(w,a[side+'Shoulder'])/a.shoulderWidth})).sort((x,y)=>x.d-y.d);
  const spatial=sides[1].d-sides[0].d>=c.handSideAmbiguity?sides[0]:null;
  // Unmirrored coordinates: side derives from labelled shoulders, never screen halves.
  if(continuity&&(!spatial||spatial.side===continuity.side))return continuity;
  if(!continuity&&spatial)return spatial;
  return null;
 }
 matchHandToOperatorEnvelope(w,index,now,reason) {
  const d=this.envelopeScore(w,this.active);
  if(!Number.isFinite(d))return this.reject(index,'OUTSIDE_OPERATOR_ENVELOPE');
  if(this.personCompetition(w))return this.reject(index,'AMBIGUOUS_PERSON');
  const side=this.resolveHandSide(w,now);if(!side)return this.reject(index,'AMBIGUOUS_SIDE');
  return {side:side.side,d,source:'fallback',fallbackReason:reason};
 }
 assign(hands,now) {
  const c=this.config,a=this.active,choices=[];
  for(let i=0;i<hands.length;i++){
   const lm=hands[i],w=lm?.[0];if(!finite(w)||!finite(lm[9])||lm.length!==21||!lm.every(finite)){this.reject(i,'INVALID_HAND');continue;}
   let best=this.matchHandToPoseWrist(w,i,now);if(best?.fallback)best=this.matchHandToOperatorEnvelope(w,i,now,best.reason);
   if(!best)continue;
   const prior=this.assignments[best.side];
   if(prior&&this.distance(w,prior.wrist)/a.shoulderWidth>c.handMaxJump){delete this.assignments[best.side];this.reject(i,'HAND_JUMP');continue;}
   choices.push({side:best.side,d:best.d,landmarks:lm,wrist:{x:w.x,y:w.y},x:1-lm[9].x,y:lm[9].y,
    operatorId:a.id,lastSeenAt:now,fresh:true,source:best.source,fallbackReason:best.fallbackReason,index:i});
  }
  const current={};
  for(const side of ['left','right']){
   const options=choices.filter(h=>h.side===side).sort((x,y)=>(x.source==='pose'?0:1)-(y.source==='pose'?0:1)||x.d-y.d);
   // Two detections competing for one wrist are also ambiguous; never use both.
   if(options.length>1&&options[1].source===options[0].source&&Math.abs(options[1].d-options[0].d)<c.handAssignmentAmbiguity){delete this.assignments[side];this.reject(options[0].index,'AMBIGUOUS_SIDE');continue;}
   if(options[0])current[side]=options[0];
   else {
    const prior=this.assignments[side];
    if(prior&&now-prior.lastSeenAt<c.handAssignmentGraceMs&&Number.isFinite(this.envelopeScore(prior.wrist,a))){
     // Reserve the side briefly without reusing old landmarks as new motion evidence.
     current[side]={...prior,fresh:false,source:'grace'};
    }
   }
  }
  if(this.rejections.some(r=>['AMBIGUOUS_PERSON','AMBIGUOUS_SIDE','HAND_JUMP'].includes(r.reason))){this.assignments={};return [];}
  this.assignments=current;return Object.values(current);
 }
}
