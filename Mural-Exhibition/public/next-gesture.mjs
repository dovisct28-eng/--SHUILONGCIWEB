// Coordinates are mirrored preview coordinates (x = 1 - landmark[9].x).
// Initial exhibition values; physical camera calibration is still required.
export const GESTURE_CONFIG = Object.freeze({
 activationZone: Object.freeze({left:.58,right:.88,top:.28,bottom:.72}),
 activationHoldMs:600, armedTimeoutMs:2000, handLossGraceMs:200,
 openEnterMs:60, openExitMs:100, twoHandConfirmMs:120, hoverRadius:.06,
 swipeWindowMs:350, minSwipeDistance:.11, minSwipePath:.16,
 minNetDistance:.08, minAverageVelocity:.35, minPeakVelocity:.55,
 minEfficiency:.65, minTrajectoryMs:80, minTrajectoryPoints:4,
 maxSampleJump:.24, maxSampleVelocity:3.5, cooldownMs:1000
});

export class GestureController {
 constructor(config={}) {
  this.config={...GESTURE_CONFIG,...config};
  this.lastTrigger=-Infinity;this.events=[];this.now=0;this.lastFrameAt=null;this.frameMs=0;this.rejection='';
  this.resetGestureState();
 }
 resetGestureState(state='IDLE',reason='reset') {
  if(reason==='reset'){this.needsActivationExit=false;this.releaseMissingSince=null;}
  this.changeState(state,reason);this.hoverStartedAt=null;this.armedAt=null;
  this.lastSeenAt=null;this.missingSince=null;this.twoHandsSince=null;this.anchor=null;
  this.trajectory=[];this.open=false;this.openSince=null;this.closedSince=null;
  this.metrics={distance:0,path:0,average:0,peak:0,efficiency:0};
 }
 lock() { if(this.state!=='LOCKED')this.resetGestureState('LOCKED','switch-lock'); }
 changeState(state,reason) {
  if(this.state!==state&&this.state){
   this.events.push({at:Math.round(this.now),from:this.state,to:state,reason,points:this.trajectory.length,...this.metrics});
   if(this.events.length>16)this.events.shift();
  }
  if(this.state!==state)this.reason=reason;
  this.state=state;
 }
 inActivationZone(p) {
  const z=this.config.activationZone;
  return p.x>=z.left&&p.x<=z.right&&p.y>=z.top&&p.y<=z.bottom;
 }
 updateHandPresence(hand,now) {
  if(!hand) {
   this.missingSince ??= now;
   if(now-this.missingSince>=this.config.handLossGraceMs)this.resetGestureState('IDLE','hand-loss');
   return false;
  }
  if(this.missingSince!==null) {
   const gap=now-this.missingSince;
   if(gap>=this.config.handLossGraceMs)this.resetGestureState('IDLE','hand-loss');
   else {
    // A brief missed detection preserves intent, but cannot advance its hold.
    if(this.hoverStartedAt!==null)this.hoverStartedAt+=gap;
    this.openSince=null;this.closedSince=null;
   }
  }
  this.missingSince=null;this.lastSeenAt=now;
  return true;
 }
 updateOpenEvidence(rawOpen,now) {
  if(rawOpen) {
   this.closedSince=null;this.openSince ??= now;
   if(now-this.openSince>=this.config.openEnterMs)this.open=true;
  } else {
   this.openSince=null;this.closedSince ??= now;
   if(now-this.closedSince>=this.config.openExitMs)this.open=false;
  }
 }
 updateHoverIntent(p,now) {
  if(!this.inActivationZone(p)) { this.resetGestureState('IDLE','outside-zone');return; }
  if(this.state==='IDLE') {
   this.changeState('HOVER','hold-start');this.anchor={x:p.x,y:p.y};this.hoverStartedAt=now;
  } else if(Math.hypot(p.x-this.anchor.x,p.y-this.anchor.y)>this.config.hoverRadius) {
   this.resetGestureState('IDLE','hover-moved');return;
  }
  if(now-this.hoverStartedAt>=this.config.activationHoldMs) {
   this.changeState('ARMED','hold-complete');this.rejection='';this.armedAt=now;this.trajectory=[{x:p.x,y:p.y,t:now}];
  }
 }
 updateSwipeTrajectory(p,now) {
  const c=this.config,last=this.trajectory.at(-1);
  if(last) {
   const dt=now-last.t,jump=Math.hypot(p.x-last.x,p.y-last.y);
   if(dt<=0)return false;
   // Tracking discontinuities must establish a fresh trajectory, never fire.
   if(dt>=c.handLossGraceMs||jump>c.maxSampleJump||jump/(dt/1000)>c.maxSampleVelocity) {
    this.rejection=dt>=c.handLossGraceMs?'sample-gap':jump>c.maxSampleJump?'landmark-jump':'sample-speed';
    this.trajectory=[{x:p.x,y:p.y,t:now}];return false;
   }
  }
  this.trajectory.push({x:p.x,y:p.y,t:now});
  this.trajectory=this.trajectory.filter(sample=>now-sample.t<=c.swipeWindowMs);
  // Bounded even when an unusually high-rate producer supplies landmarks.
  if(this.trajectory.length>64)this.trajectory.shift();
  const first=this.trajectory[0],dt=(now-first.t)/1000;
  let path=0,peak=0;
  for(let i=1;i<this.trajectory.length;i++) {
   const a=this.trajectory[i-1],b=this.trajectory[i];
   const step=Math.hypot(b.x-a.x,b.y-a.y);path+=step;
   peak=Math.max(peak,step/((b.t-a.t)/1000));
  }
  const distance=Math.hypot(p.x-first.x,p.y-first.y);
  this.metrics={distance,path,average:dt?path/dt:0,peak,efficiency:path?distance/path:0};
  return this.trajectory.length>=c.minTrajectoryPoints&&dt*1000>=c.minTrajectoryMs
   &&(distance>=c.minSwipeDistance||path>=c.minSwipePath)&&distance>=c.minNetDistance
   &&this.metrics.average>=c.minAverageVelocity&&peak>=c.minPeakVelocity
   &&this.metrics.efficiency>=c.minEfficiency;
 }
 updateActivationRelease(hands,now) {
  if(!this.needsActivationExit)return;
  if(hands.length===0) {
   this.releaseMissingSince ??= now;
   if(now-this.releaseMissingSince>=this.config.handLossGraceMs)this.needsActivationExit=false;
  } else {
   this.releaseMissingSince=null;
   if(hands.length===1&&!this.inActivationZone(hands[0]))this.needsActivationExit=false;
  }
 }
 tryTriggerNextGesture(now) {
  if(this.state!=='ARMED'||now-this.lastTrigger<this.config.cooldownMs)return false;
  this.needsActivationExit=true;this.releaseMissingSince=null;
  this.lastTrigger=now;this.changeState('FIRED','swipe-accepted');this.trajectory=[];return true;
 }
 tick(now,{blocked=false,locked=false}={}) {
  this.now=now;
  if(blocked) {
   if(this.state!=='IDLE'||this.lastSeenAt!==null||this.openSince!==null)this.resetGestureState('IDLE','reading-or-inactive');
   return;
  }
  if(locked||this.state==='FIRED') { this.lock();return; }
  if(this.state==='LOCKED') {
   if(now-this.lastTrigger>=this.config.cooldownMs)this.resetGestureState('IDLE','switch-complete');
   return;
  }
  if(this.state==='ARMED'&&now-this.armedAt>=this.config.armedTimeoutMs) {
   this.needsActivationExit=true;this.releaseMissingSince=null;
   this.resetGestureState('IDLE','armed-timeout');return;
  }
  if(this.lastSeenAt!==null&&now-this.lastSeenAt>=this.config.handLossGraceMs)this.resetGestureState('IDLE','tracking-gap');
 }
 updateGestureState({hands=[],now,blocked=false,locked=false}) {
  this.frameMs=this.lastFrameAt===null?0:now-this.lastFrameAt;this.lastFrameAt=now;
  this.updateActivationRelease(hands,now);
  this.tick(now,{blocked,locked});
  if(blocked||locked||this.state==='LOCKED'||this.needsActivationExit)return false;
  // A transient extra detection suspends NEXT, rather than cancelling intent
  // on one frame. Sustained two hands cancel; the archive handler stays separate.
  if(hands.length>1) {
   this.twoHandsSince ??= now;this.lastSeenAt=now;this.missingSince=null;
   if(now-this.twoHandsSince>=this.config.twoHandConfirmMs)this.resetGestureState('IDLE','two-hands');
   return false;
  }
  if(this.twoHandsSince!==null) {
   if(this.hoverStartedAt!==null)this.hoverStartedAt+=now-this.twoHandsSince;
   this.twoHandsSince=null;
  }
  const p=hands[0];
  if(!this.updateHandPresence(p,now))return false;
  this.updateOpenEvidence(p.open,now);
  if(!this.open) {
   if(this.state==='HOVER'||this.state==='ARMED')this.resetGestureState('IDLE','palm-closed');
   return false;
  }
  if(this.state==='IDLE'||this.state==='HOVER') { this.updateHoverIntent(p,now);return false; }
  if(this.state==='ARMED'&&this.updateSwipeTrajectory(p,now))return this.tryTriggerNextGesture(now);
  return false;
 }
 snapshot(now) {
  return {state:this.state,releaseRequired:this.needsActivationExit,reason:this.reason,rejection:this.rejection,frameMs:this.frameMs,twoHandMs:this.twoHandsSince===null?0:now-this.twoHandsSince,progress:this.state==='ARMED'?1:this.state==='HOVER'?Math.min(1,Math.max(0,((this.missingSince??now)-this.hoverStartedAt)/this.config.activationHoldMs)):0,
   holdMs:this.hoverStartedAt===null?0:Math.max(0,(this.missingSince??now)-this.hoverStartedAt),
   missingMs:this.missingSince===null?0:now-this.missingSince,points:this.trajectory.length,...this.metrics};
 }
}
