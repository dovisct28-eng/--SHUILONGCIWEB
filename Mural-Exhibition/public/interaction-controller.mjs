import {INTERACTION_CONFIG} from './interaction-config.mjs';

export class InteractionController {
 constructor(nextGesture,config={}) {this.next=nextGesture;this.config={...INTERACTION_CONFIG,...config};this.events=[];this.reset();}
 reset() {
  this.mode='NAVIGATION';this.phase='WAIT_NEUTRAL';this.neutralSince=null;this.actionSince=null;
  this.startDistance=null;this.lastDistance=null;this.holdSince=null;this.releaseSince=null;
  this.releaseKind=null;this.twoSince=null;this.lastTwoAt=-Infinity;this.distance=null;this.next.resetGestureState();
 }
 change(mode,now,reason) {
  if(this.mode!==mode){this.events.push({from:this.mode,to:mode,at:now,reason});if(this.events.length>24)this.events.shift();}
  this.mode=mode;this.next.resetGestureState();this.clearAction();
 }
 clearAction() {this.phase='WAIT_NEUTRAL';this.neutralSince=null;this.actionSince=null;this.startDistance=null;this.lastDistance=null;this.holdSince=null;}
 setReading(value,now) {
  if(value){this.change('READING_ENTER',now,'manual-enter');this.phase='WAIT_CLOSE';}
  else if(['READING','READING_ENTER'].includes(this.mode)){this.change('READING_EXIT',now,'manual-exit');this.releaseSince=null;}
 }
 tick(now,{blocked=false,locked=false}={}) {
  this.next.tick(now,{blocked:blocked||this.mode!=='NAVIGATION',locked});
 }
 inGestureZone(hand) {const p=hand.landmarks[9],z=this.config.gestureZone;return p.x>=z.left&&p.x<=z.right&&p.y>=z.top&&p.y<=z.bottom;}
 update({ownership,now,blocked=false,locked=false,isOpen}) {
  let reveal=null,fired=false;const c=this.config;
  if(ownership.released){
   reveal=['READING','READING_ENTER'].includes(this.mode)?false:null;this.reset();
   return {reveal,fired,hands:[]};
  }
  if(this.mode==='READING_ENTER')this.mode='READING';
  if(this.mode==='READING_EXIT'){this.mode='POST_READING_LOCK';this.releaseSince=null;this.releaseKind=null;}
  const hands=ownership.assignedHands;
  if(blocked||locked||ownership.operatorState!=='PERSON_LOCKED'||!ownership.diagnostics.poseFresh){
   this.clearAction();this.twoSince=null;this.releaseSince=null;this.releaseKind=null;
   this.next.tick(now,{blocked:blocked||ownership.operatorState!=='PERSON_LOCKED',locked});
   // A disappeared person cannot leave ARMED intent usable during the grace interval.
   if(!locked)this.next.resetGestureState('IDLE','ownership-unavailable');
   return {reveal,fired,hands:[]};
  }
  if(hands.length===2)this.lastTwoAt=now;
  if(this.mode==='POST_READING_LOCK'){
   const valid=hands.every(h=>h.fresh);
   const kind=hands.length===0?'absent':valid&&hands.every(h=>!this.inGestureZone(h))?'outside':
    valid&&hands.length===1&&!this.next.inActivationZone(hands[0])?'single':null;
   if(kind!==this.releaseKind){this.releaseKind=kind;this.releaseSince=kind?now:null;}
   const ms=kind==='absent'?c.releaseAbsentMs:kind==='outside'?c.releaseOutsideMs:c.releaseSingleMs;
   if(kind&&now-this.releaseSince>=ms){this.change('NAVIGATION',now,'post-reading-release');this.lastTwoAt=now;this.releaseSince=null;}
   this.next.tick(now,{blocked:true});return {reveal,fired,hands:[]};
  }
  // A reserved but missing hand freezes all gestures; stale samples do not advance holds.
  if(hands.some(h=>!h.fresh)){
   this.clearAction();
   this.next.updateGestureState({hands:[],now,blocked:this.mode==='READING'});
   return {reveal,fired,hands:[]};
  }
  if(hands.length===2){
   const points=hands.map(h=>h.landmarks[9]);this.distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
  }else this.distance=null;
  if(this.mode==='READING'){
   this.next.tick(now,{blocked:true});
   if(hands.length!==2){this.clearAction();this.phase='WAIT_CLOSE';return {reveal,fired,hands};}
   const d=this.distance;
   if(this.phase==='WAIT_CLOSE'||this.phase==='WAIT_NEUTRAL'){
    if(d>=c.twoHandOpenThreshold){this.phase='CLOSING';this.startDistance=d;this.lastDistance=d;this.actionSince=now;}
   }else if(now-this.actionSince>c.twoHandActionMaxMs||d>this.lastDistance+c.twoHandTrendTolerance){
    this.clearAction();this.phase='WAIT_CLOSE';
   }else {
    this.lastDistance=d;
    if(d<=c.twoHandCloseThreshold&&this.startDistance-d>=c.twoHandMinTravel){
     this.holdSince ??= now;
     if(now-this.holdSince>=c.twoHandCloseHoldMs){this.change('READING_EXIT',now,'close-action');reveal=false;}
    }else this.holdSince=null;
   }
   return {reveal,fired,hands};
  }
  if(hands.length===2){
   // ARMED/HOVER intent keeps priority while a same-person second hand is confirmed.
   this.twoSince ??= now;
   if(['ARMED','HOVER'].includes(this.next.state)){
    this.clearAction();
    if(now-this.twoSince>=c.nextTwoHandConfirmMs)this.next.resetGestureState('IDLE','two-hands');
    return {reveal,fired,hands:[]};
   }
   this.next.tick(now,{blocked:true});const d=this.distance;
   if(this.phase==='WAIT_NEUTRAL'){
    if(d<=c.twoHandNeutralMax){this.neutralSince ??= now;if(now-this.neutralSince>=c.twoHandNeutralHoldMs){this.phase='OPENING';this.startDistance=d;this.lastDistance=d;this.actionSince=now;}}
    else this.neutralSince=null;
   }else if(now-this.actionSince>c.twoHandActionMaxMs||d<this.lastDistance-c.twoHandTrendTolerance){this.clearAction();}
   else {
    this.lastDistance=d;
    if(d>=c.twoHandOpenThreshold&&d-this.startDistance>=c.twoHandMinTravel){
     this.holdSince ??= now;
     if(now-this.holdSince>=c.twoHandOpenHoldMs){this.change('READING_ENTER',now,'open-action');this.phase='WAIT_CLOSE';reveal=true;}
    }else this.holdSince=null;
   }
   return {reveal,fired,hands};
  }
  if(this.twoSince!==null){
   // Short same-person second-hand evidence pauses intent; it cannot add a swipe segment.
   if(this.next.hoverStartedAt!==null)this.next.hoverStartedAt+=now-this.twoSince;
   this.next.trajectory=[];this.twoSince=null;
  }
  this.clearAction();
  if(now-this.lastTwoAt<c.recentTwoHandMs){this.next.tick(now,{blocked:true});return {reveal,fired,hands:[]};}
  fired=this.next.updateGestureState({hands:hands.map(h=>({...h,open:isOpen(h.landmarks)})),now});
  return {reveal,fired,hands};
 }
 snapshot(now) {return {mode:this.mode,twoHandPhase:this.phase,twoHandDistance:this.distance,
  postReadingReleaseMs:this.releaseSince===null?0:now-this.releaseSince,releaseKind:this.releaseKind};}
}
