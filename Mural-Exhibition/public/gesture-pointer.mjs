import {INTERACTION_CONFIG} from './interaction-config.mjs';

const contains=(p,r)=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height;
export const hitTarget=(p,targets=[])=>p&&targets.find(t=>!t.disabled&&contains(p,t))?.id||null;

// OperatorTracker mirrors landmark 9 once. Everything below uses screen x/y.
export class GesturePointer {
 constructor(config={}) {this.config={...INTERACTION_CONFIG,...config};this.reset();}
 reset() {this.key=null;this.point=null;this.raw=null;this.lastAt=null;this.missingAt=null;this.unstableUntil=0;}
 update({ownership,now,width,height,targets=[],controlRegions=[]}) {
  const c=this.config,d=ownership.diagnostics||{},hands=ownership.assignedHands||[];
  let reason=null;
  if(!ownership.activeOperator)reason=ownership.operatorState==='CANDIDATE'?'PERSON_ACQUIRING':'NO_PERSON';
  else if(!d.poseFresh)reason='POSE_STALE';
  else if(!d.operatorObservable||d.assignmentBlocked)reason=d.assignmentRejections?.some(r=>r.reason==='AMBIGUOUS_PERSON')||!d.operatorObservable?'AMBIGUOUS_PERSON':'AMBIGUOUS_HAND';
  const fresh=hands.filter(h=>h.fresh&&h.operatorId===ownership.activeOperator?.id);
  const input=c.pointerInput;
  const map=h=>({x:Math.max(0,Math.min(1,(h.x-input.left)/(input.right-input.left)))*width,y:Math.max(0,Math.min(1,(h.y-input.top)/(input.bottom-input.top)))*height});
  const intent=h=>hitTarget(map(h),targets)||controlRegions.find(r=>contains(map(h),r))?.id;
  const candidates=fresh.filter(h=>intent(h));
  // Visible resting hands are harmless. Two hands requesting controls are not.
  if(!reason&&candidates.length>1)reason='AMBIGUOUS_HAND';
  const prior=fresh.find(h=>`${h.operatorId}:${h.side}`===this.key);
  let selected=(prior&&intent(prior)?prior:null)||candidates[0]||prior||(fresh.length===1?fresh[0]:null);
  if(!reason&&!selected)reason=d.handsDetected?'HAND_NOT_ASSIGNED':'HAND_NOT_DETECTED';
  if(reason) {
   this.missingAt??=now;
   const gap=this.lastAt===null?Infinity:now-this.lastAt;
   const paused=reason==='HAND_NOT_DETECTED'||reason==='POSE_STALE';
   if(!paused||gap>c.trackingPauseMs){this.point=null;this.key=null;this.raw=null;this.lastAt=null;}
   return {valid:false,visible:!!this.point,point:this.point,key:this.key,stable:false,reason,gapMs:gap,paused};
  }
  const key=`${selected.operatorId}:${selected.side}`,raw=map(selected);
  const changed=key!==this.key||this.lastAt===null||now-this.lastAt>c.trackingPauseMs;
  const dt=this.lastAt===null?0:Math.max(0,now-this.lastAt);
  const delta=this.raw?Math.hypot(raw.x-this.raw.x,raw.y-this.raw.y)/Math.min(width,height):0;
  if(changed){this.point=raw;this.unstableUntil=now+c.pointerSettleMs;}
  else if(delta>c.pointerJump){this.unstableUntil=now+c.pointerSettleMs;this.raw=raw;this.lastAt=now;return {valid:false,visible:true,point:this.point,key,stable:false,reason:'HAND_UNSTABLE',gapMs:0,paused:false};}
  else {
   const speed=dt?delta*1000/dt:0;
   if(speed>c.pointerStableSpeed)this.unstableUntil=now+c.pointerSettleMs;
   const tau=speed>c.pointerFastSpeed?c.pointerFastTauMs:c.pointerTauMs;
   const alpha=1-Math.exp(-dt/tau);
   this.point={x:this.point.x+(raw.x-this.point.x)*alpha,y:this.point.y+(raw.y-this.point.y)*alpha};
  }
  this.key=key;this.raw=raw;this.lastAt=now;this.missingAt=null;
  const stable=now>=this.unstableUntil;
  return {valid:true,visible:true,point:this.point,key,changed,stable,side:selected.side,source:selected.source,reason:stable?'READY':'HAND_UNSTABLE',gapMs:0,paused:false};
 }
}
