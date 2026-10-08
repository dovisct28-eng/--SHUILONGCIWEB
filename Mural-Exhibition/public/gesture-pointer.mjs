import {INTERACTION_CONFIG} from './interaction-config.mjs';

const contains=(p,r)=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height;
export const hitTarget=(p,targets=[])=>p&&targets.find(t=>!t.disabled&&contains(p,t))?.id||null;
// OperatorTracker has already mirrored palm x. Never infer semantic side here.
export function mapHandPoint(h,width,height,input=INTERACTION_CONFIG.pointerInput) {
 return {x:Math.max(0,Math.min(1,(h.x-input.left)/(input.right-input.left)))*width,y:Math.max(0,Math.min(1,(h.y-input.top)/(input.bottom-input.top)))*height};
}
export function ownershipBlockReason(ownership) {
 const d=ownership.diagnostics||{};
 if(!ownership.activeOperator)return ownership.operatorState==='CANDIDATE'?'PERSON_ACQUIRING':'NO_PERSON';
 if(!d.poseFresh)return 'POSE_STALE';
 if(!d.operatorObservable||d.assignmentBlocked)return !d.operatorObservable||d.assignmentRejections?.some(r=>r.reason==='AMBIGUOUS_PERSON')?'AMBIGUOUS_PERSON':'AMBIGUOUS_HAND';
 return null;
}

// Coordinate history belongs to the selected control hand; this class never selects.
export class GesturePointer {
 constructor(config={}) {this.config={...INTERACTION_CONFIG,...config};this.reset();}
 reset() {this.key=null;this.point=null;this.raw=null;this.lastAt=null;this.missingAt=null;this.unstableUntil=0;}
 update({handOwnership,now,width,height}) {
  const c=this.config,lock=handOwnership;
  const selected=lock?.selectedHand;
  const key=selected?`${selected.operatorId}:${selected.side}`:null;
  if(!lock?.valid||!lock.lockedHandKey||key!==lock.lockedHandKey||!selected?.fresh||selected.operatorId!==lock.operatorId) {
   this.missingAt??=now;
   const gap=this.lastAt===null?Infinity:now-this.lastAt;
   const paused=lock?.state==='HAND_PAUSED';
   if(!paused||gap>c.trackingPauseMs)this.reset();
   return {valid:false,visible:!!this.point,point:this.point,key:this.key,stable:false,reason:lock?.reason||'WAIT_HAND',gapMs:gap,paused};
  }
  const raw=mapHandPoint(selected,width,height,c.pointerInput);
  const changed=lock.changed||key!==this.key||this.lastAt===null||this.missingAt!==null||now-this.lastAt>c.trackingPauseMs;
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
