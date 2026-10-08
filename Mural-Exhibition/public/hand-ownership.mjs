import {INTERACTION_CONFIG} from './interaction-config.mjs';
import {ownershipBlockReason} from './gesture-pointer.mjs';

// The only source of control-hand identity. Person assignment remains upstream.
export class HandOwnership {
 constructor(config={}) {this.config={...INTERACTION_CONFIG,...config};this.reset();}
 reset() {
  this.operatorId=null;this.lockedHandKey=null;this.candidate=null;this.lockedAt=null;
  this.lastSeenAt=null;this.rearmSince=null;this.state='WAIT_HAND';this.reason='WAIT_HAND';
  this.selectedHand=null;this.valid=false;this.changed=false;this.ignoredHands=0;
 }
 clearEvidence() {this.candidate=null;this.rearmSince=null;this.selectedHand=null;this.valid=false;this.changed=false;}
 release(reason='HAND_LOCK_RELEASED') {
  this.clearEvidence();this.lockedHandKey=null;this.lockedAt=null;this.lastSeenAt=null;
  this.state='HAND_RELEASED';this.reason=reason;
 }
 pause(now,reason='HAND_LOCKED_PAUSED') {
  this.clearEvidence();
  if(now-this.lastSeenAt>this.config.controlHandLossGraceMs)this.release();
  else {this.state='HAND_PAUSED';this.reason=reason;}
 }
 // Called by the existing render scheduler only when callbacks have stopped.
 tick(now) {
  if(this.lockedHandKey&&now-this.lastSeenAt>this.config.trackingPauseMs)this.pause(now);
  else if(this.candidate&&now-this.candidate.lastAt>this.config.trackingPauseMs){this.clearEvidence();this.state='WAIT_HAND';this.reason='WAIT_HAND';}
  return this.snapshot(now);
 }
 update({ownership,now,width,height,targets=[],controlRegions=[],blocked=false,locked=false}) {
  const id=ownership.activeOperator?.id??null,c=this.config,d=ownership.diagnostics||{};
  this.changed=false;this.valid=false;this.selectedHand=null;
  if(id!==this.operatorId||ownership.released){const had=!!this.lockedHandKey;this.reset();this.operatorId=id;if(had)this.release();}
  const safety=ownershipBlockReason(ownership);
  const hands=(ownership.assignedHands||[]).filter(h=>h.fresh&&h.operatorId===id&&['left','right'].includes(h.side)&&Number.isFinite(h.x)&&Number.isFinite(h.y));
  this.ignoredHands=this.lockedHandKey?hands.filter(h=>`${h.operatorId}:${h.side}`!==this.lockedHandKey).length:0;
  if(!id){this.reason=safety||'NO_PERSON';return this.snapshot(now);}
  if(this.lockedHandKey) {
   // A long callback stall must expire ownership before a returned hand can revive it.
   if(now-this.lastSeenAt>c.controlHandLossGraceMs){this.release();return this.snapshot(now);}
   const selected=hands.filter(h=>`${h.operatorId}:${h.side}`===this.lockedHandKey);
   if(safety||selected.length!==1){this.pause(now,safety||'HAND_LOCKED_PAUSED');return this.snapshot(now);}
   const gap=now-this.lastSeenAt,recovering=(this.state==='HAND_PAUSED'&&gap>c.trackingPauseMs)||this.rearmSince!==null||gap>c.trackingPauseMs;
   this.lastSeenAt=now;
   if(recovering){
    this.rearmSince??=now;this.state='HAND_PAUSED';this.reason='HAND_LOCKED_PAUSED';
    if(now-this.rearmSince<c.controlHandRearmMs)return this.snapshot(now);
    this.changed=true;
   }
   this.rearmSince=null;this.state='HAND_LOCKED';this.reason=blocked||locked?'ACTION_LOCKED':'READY';
   this.selectedHand=selected[0];this.valid=!blocked&&!locked;
   return this.snapshot(now);
  }
  this.state='WAIT_HAND';
  if(safety||blocked||locked){this.clearEvidence();this.reason=safety||'ACTION_LOCKED';return this.snapshot(now);}
  const requests=hands.filter(h=>{const z=c.gestureZone;return h.x>=z.left&&h.x<=z.right&&h.y>=z.top&&h.y<=z.bottom;});
  if(requests.length!==1){
   this.clearEvidence();this.reason=requests.length>1?'AMBIGUOUS_HAND':hands.length?'WAIT_HAND':d.handsDetected?'HAND_NOT_ASSIGNED':'HAND_NOT_DETECTED';
   return this.snapshot(now);
  }
  const selected=requests[0],key=`${selected.operatorId}:${selected.side}`;
  if(this.candidate?.key!==key||now-this.candidate.lastAt>c.trackingPauseMs||Math.hypot(selected.x-this.candidate.x,selected.y-this.candidate.y)>c.controlHandCandidateJump||Math.hypot(selected.x-this.candidate.startX,selected.y-this.candidate.startY)>c.controlHandCandidateDrift)this.candidate={key,since:now,lastAt:now,startX:selected.x,startY:selected.y};
  this.candidate.x=selected.x;this.candidate.y=selected.y;this.selectedHand=selected;
  this.candidate.lastAt=now;this.state='HAND_CANDIDATE';this.reason='HAND_ACQUIRING';
  if(now-this.candidate.since>=c.controlHandAcquireMs){
   this.lockedHandKey=key;this.lockedAt=now;this.lastSeenAt=now;this.candidate=null;
   this.state='HAND_LOCKED';this.reason='READY';this.selectedHand=selected;this.valid=true;this.changed=true;
  }
  return this.snapshot(now);
 }
 snapshot(now=0) {
  return {state:this.state,lockedHandKey:this.lockedHandKey,operatorId:this.operatorId,selectedHand:this.selectedHand,
   valid:this.valid,reason:this.reason,changed:this.changed,candidate:this.candidate?.key??null,
   candidateDurationMs:this.candidate?Math.max(0,now-this.candidate.since):0,
   lockDurationMs:this.lockedAt===null?0:Math.max(0,now-this.lockedAt),
   lossDurationMs:this.state==='HAND_PAUSED'&&this.lastSeenAt!==null?Math.max(0,now-this.lastSeenAt):0,
   ignoredHands:this.ignoredHands,diagnostic:this.ignoredHands?'NON_CONTROL_HAND_IGNORED':null};
 }
}
const contains=(p,r)=>p.x>=r.x&&p.x<=r.x+r.width&&p.y>=r.y&&p.y<=r.y+r.height;
