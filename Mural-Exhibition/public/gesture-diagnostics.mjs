import {INTERACTION_CONFIG as c} from './interaction-config.mjs';
const rate=a=>a.length?1000/(a.reduce((s,v)=>s+v,0)/a.length):0;
const q=(a,p)=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*p)]:null;
export function poseFreshnessBudget(metrics={}) {
 if((metrics.samples||0)<8)return c.poseMaxAgeMs;
 return Math.min(c.poseFreshnessCapMs,Math.max(c.poseMaxAgeMs,(metrics.latencyP95Ms||0)+(metrics.intervalP95Ms||0)+c.poseTimingMarginMs));
}
export class GestureDiagnostics {
 constructor({enabled=false}={}){this.enabled=enabled;this.events=[];this.frames=[];this.previous=null;this.origin=null;this.lastTraceAt=-Infinity;this.input=[];this.hands=[];this.durations=[];this.lastInput=null;this.lastCallback=null;this.rawHands=0;this.freshHands=0;this.validLandmarks=false;this.filteredReason=null;this.poseInvalidSince=null;this.poseChecks=0;this.poseStale=0;this.states=[];}
 resetTiming(){this.input=[];this.hands=[];this.durations=[];this.lastInput=null;this.lastCallback=null;this.poseInvalidSince=null;this.poseChecks=0;this.poseStale=0;}
 capture(at){if(this.lastInput!==null)this.input.push(at-this.lastInput);this.input=this.input.slice(-120);this.lastInput=at;}
 callback(raw,at,capturedAt,fresh){if(this.lastCallback!==null)this.hands.push(at-this.lastCallback);this.hands=this.hands.slice(-120);this.lastCallback=at;this.durations.push(at-capturedAt);this.durations=this.durations.slice(-120);this.rawHands=raw.length;this.freshHands=fresh?raw.length:0;this.validLandmarks=raw.every(h=>h?.length===21&&h.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));this.filteredReason=!fresh?'HANDS_STALE':!this.validLandmarks?'INVALID_HAND':null;this.handsCapturedAt=capturedAt;}
 pose(fresh,now,observable=fresh){this.poseChecks++;if(!fresh)this.poseStale++;if(!fresh||!observable)this.poseInvalidSince??=now;else this.poseInvalidSince=null;}
 transition(state,now){if(this.states.at(-1)?.state!==state){this.states.push({state,at:now});this.states=this.states.slice(-80);}}
 track({ownership={},handLock={},pointer={},dwell={},targets=[],now,action=null}) {
  if(!this.enabled)return;
  this.origin??=now;now=Math.max(now,this.origin+(this.previous?.atMs??0));const d=ownership.diagnostics||{},h=handLock.selectedHand,a=ownership.activeOperator;
  const round=v=>Number.isFinite(v)?Math.round(v*100)/100:null;
  const before=this.previous;
  const handFresh=Number.isFinite(d.handsCapturedAt)&&now-d.handsCapturedAt<=c.handsMaxAgeMs&&(d.handsFresh||0)>0;
  const poseFresh=!!d.poseFresh&&now-(d.poseObservedAt??now)<= (d.poseThresholdMs??c.poseMaxAgeMs);
  const hit=pointer.valid&&pointer.point?targets.find(t=>!t.disabled&&pointer.point.x>=t.x&&pointer.point.x<=t.x+t.width&&pointer.point.y>=t.y&&pointer.point.y<=t.y+t.height)?.id??null:null;
  const row={atMs:Math.round(now-this.origin),operatorId:a?.id??null,handKey:handLock.lockedHandKey??handLock.candidate??null,
   handState:handLock.state??'WAIT_HAND',interactionState:dwell.state??'NO_OPERATOR',reason:handLock.valid?dwell.blockedReason:handLock.reason,
   handsFresh:handFresh,poseFresh,target:action?(action==='NEXT'?'next':'view'):dwell.target??null,hit,mode:dwell.mode??'NAVIGATION',cooldown:dwell.state==='ACTION_TRANSITION',recovering:handLock.state==='HAND_PAUSED'||!!pointer.resuming,
   releaseRequired:!!dwell.releaseRequired,progress:round(dwell.progress),lossMs:Math.round(handLock.lossDurationMs??0),poseAgeMs:Math.round(d.poseAgeMs??0),palm:h?{x:round(h.x),y:round(h.y)}:null,
   shoulderDistance:h?.wrist&&a?round(Math.hypot(h.wrist.x-(a[h.side+'Shoulder']??a.center).x,(h.wrist.y-(a[h.side+'Shoulder']??a.center).y)/c.imageAspect)/a.shoulderWidth):null,
   wristVisible:h?!!a?.[h.side+'Wrist']:null,candidates:d.handsDetected??0,assigned:d.handsAssignedFresh??0,
   source:h?.source??null,controlMatch:d.controlMatch??null,continuityCandidates:d.continuityCandidates??0,rejections:(d.assignmentRejections||[]).map(r=>({hand:r.hand,reason:r.reason,affectsControl:r.affectsControl!==false})),
   pointerValid:!!pointer.valid&&handFresh&&poseFresh,pointerStable:!!pointer.stable&&handFresh&&poseFresh,operatorChanged:!!before&&before.operatorId!==(a?.id??null)};
  const observedAt=h?.lastSeenAt??now;
  if(h&&handFresh&&pointer.valid&&Number.isFinite(h.x)&&Number.isFinite(h.y)&&(!this.motion||observedAt>this.motion.at||this.motion.key!==row.handKey)){
   const prior=this.motion,displacement=prior?.key===row.handKey?Math.hypot(h.x-prior.x,h.y-prior.y):null;
   this.motion={x:h.x,y:h.y,at:observedAt,key:row.handKey,displacement:round(displacement),speed:displacement===null?null:round(displacement*1000/(observedAt-prior.at))};
  }
  if(this.motion?.key===row.handKey){row.displacement=this.motion.displacement;row.speed=this.motion.speed;}
  const event=(name,from,to,reason=row.reason)=>{this.events.push({...row,event:name,from:from??null,to:to??null,reason});if(this.events.length>160)this.events.shift();};
  if(row.operatorId!==before?.operatorId){if(before?.operatorId)event('PERSON_LOST',before.operatorId,row.operatorId,'OPERATOR_UNOBSERVABLE_OR_RELEASED');if(row.operatorId)event('PERSON_ACQUIRED',before?.operatorId,row.operatorId,'PERSON_LOCKED');}
  if(row.handState!==before?.handState||row.handKey!==before?.handKey){
   if(before?.handState==='HAND_CANDIDATE'&&row.handState!=='HAND_LOCKED')event('HAND_CANDIDATE_RESET',before.handState,row.handState,handLock.candidateResetReason??row.reason);
   const names={HAND_CANDIDATE:'HAND_CANDIDATE_STARTED',HAND_LOCKED:before?.handState==='HAND_PAUSED'?'HAND_RECOVERED':'HAND_LOCKED',HAND_PAUSED:'HAND_PAUSED',HAND_RELEASED:'HAND_RELEASED'};
   if(names[row.handState])event(names[row.handState],before?.handState,row.handState,handLock.releaseCause??handLock.pauseCause??row.reason);
  }else if(row.handState==='HAND_CANDIDATE'&&handLock.candidateResetReason)event('HAND_CANDIDATE_RESET',row.handState,row.handState,handLock.candidateResetReason);
  if(row.rejections.length&&JSON.stringify(row.rejections)!==JSON.stringify(before?.rejections))event('HAND_ASSIGNMENT_REJECTED',before?.handState,row.handState,row.rejections.map(r=>r.reason).join(','));
  if(row.pointerStable!==before?.pointerStable)event(row.pointerStable?'POINTER_RECOVERED':'POINTER_UNSTABLE',before?.pointerStable,row.pointerStable,pointer.reason);
  if(before?.target&&before.interactionState!=='TRIGGERED'&&(!row.target||row.target!==before.target||row.progress<before.progress)&&!action)event('DWELL_CANCELLED',before.target,row.target,dwell.blockedReason);
  if(row.target&&row.target!==before?.target&&!action)event('DWELL_STARTED',before?.target,row.target,'DWELLING');
  if(action)event('DWELL_COMPLETED',before?.interactionState,'TRIGGERED',action);
  if(now-this.lastTraceAt>=100){this.frames.push(row);if(this.frames.length>240)this.frames.shift();this.lastTraceAt=now;}
  this.previous=row;
 }
 trackingSnapshot(){return {enabled:this.enabled,frameCapacity:240,eventCapacity:160,sampleIntervalMs:100,coordinatePrecision:.01,frames:this.frames,events:this.events};}
 snapshot(now){return {inputFps:this.lastInput!==null&&now-this.lastInput<500?rate(this.input):0,handsFps:this.lastCallback!==null&&now-this.lastCallback<500?rate(this.hands):0,inputCapturedAt:this.lastInput,inputIntervalP50Ms:q(this.input,.5),inputIntervalP95Ms:q(this.input,.95),handsCapturedAt:this.handsCapturedAt,handsReceivedAt:this.lastCallback,handsIntervalP95Ms:q(this.hands,.95),handsLatencyP50Ms:q(this.durations,.5),handsLatencyP95Ms:q(this.durations,.95),rawHands:this.rawHands,freshHands:this.freshHands,filteredHands:this.rawHands-this.freshHands,validLandmarks:this.validLandmarks,filteredReason:this.filteredReason,poseStaleRatio:this.poseChecks?this.poseStale/this.poseChecks:0,noValidPoseMs:this.poseInvalidSince===null?0:now-this.poseInvalidSince,states:this.states};}
}
