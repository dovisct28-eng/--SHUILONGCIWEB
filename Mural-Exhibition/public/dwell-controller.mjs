import {INTERACTION_CONFIG} from './interaction-config.mjs';
import {hitTarget} from './gesture-pointer.mjs';

export class DwellController {
 constructor(config={}) {this.config={...INTERACTION_CONFIG,...config};this.reset();}
 reset() {this.mode='NAVIGATION';this.state='NO_OPERATOR';this.target=null;this.elapsed=0;this.lastAt=null;this.gapAt=null;this.handKey=null;this.operatorId=null;this.releaseRequired=false;this.releaseSince=null;this.releaseTarget=null;this.reason='NO_PERSON';this.lastAction=null;this.transitionUntil=0;}
 cancel() {this.target=null;this.elapsed=0;this.duration=this.config.dwellMs;this.lastAt=null;this.gapAt=null;}
 setReading(value,now) {this.mode=value?'READING':'NAVIGATION';this.transitionUntil=now+this.config.readingTransitionMs;this.cancel();this.releaseRequired=true;this.releaseSince=null;this.releaseTarget='view';this.state='ACTION_TRANSITION';this.reason='ACTION_LOCKED';}
 lock() {this.cancel();this.state='ACTION_TRANSITION';this.reason='ACTION_LOCKED';}
 tick(now,{blocked=false,locked=false}={}) {
  if(blocked){this.cancel();this.releaseSince=null;this.state='BLOCKED';this.reason='ACTION_LOCKED';}
  else if(locked||now<this.transitionUntil){this.cancel();this.releaseSince=null;this.state='ACTION_TRANSITION';this.reason='ACTION_LOCKED';}
  else if((this.gapAt!==null&&now-this.gapAt>this.config.trackingPauseMs)||(this.lastAt!==null&&now-this.lastAt>this.config.trackingPauseMs)){this.cancel();this.releaseSince=null;this.state='TRACKING_PAUSED';this.reason='HAND_NOT_DETECTED';}
 }
 update({now,operatorId,pointer,targets=[],mode=this.mode,blocked=false,locked=false}) {
  const c=this.config;
  this.mode=mode;
  if(operatorId!==this.operatorId){const had=!!this.operatorId;this.cancel();this.handKey=null;this.releaseSince=null;this.operatorId=operatorId;if(had){this.releaseRequired=true;this.releaseTarget=null;}}
  if(!operatorId){this.cancel();this.releaseSince=null;this.state='NO_OPERATOR';this.reason=pointer?.reason||'NO_PERSON';return null;}
  if(blocked||locked||now<this.transitionUntil){this.cancel();this.releaseSince=null;this.state=blocked?'BLOCKED':'ACTION_TRANSITION';this.reason='ACTION_LOCKED';return null;}
  if(!pointer?.valid){
   this.releaseSince=null;
   const safePause=pointer?.paused&&['HAND_LOCKED_PAUSED','POSE_STALE','HAND_NOT_DETECTED'].includes(pointer.reason)&&pointer.key===this.handKey;
   this.cancel();
   this.state=safePause?'TRACKING_PAUSED':'BLOCKED';this.reason=pointer?.reason||'HAND_NOT_DETECTED';return null;
  }
  if(pointer.key!==this.handKey||pointer.changed){this.cancel();this.handKey=pointer.key;this.releaseSince=null;}
  const target=hitTarget(pointer.point,targets),eligible=target&&((mode==='NAVIGATION'&&(target==='view'||target==='next'))||(mode==='READING'&&target==='view'));
  if(this.releaseRequired){
   this.cancel();this.state='WAIT_RELEASE';this.reason='WAIT_RELEASE';
   // Release requires fresh, stable observations outside ALL live action regions.
   if(!target&&pointer.stable){this.releaseSince??=now;if(now-this.releaseSince>=c.dwellReleaseMs){this.releaseRequired=false;this.releaseSince=null;this.releaseTarget=null;this.state='READY';this.reason='READY';}}
   else this.releaseSince=null;
   return null;
  }
  if(!pointer.stable){this.cancel();this.state='TRACKING_PAUSED';this.reason='HAND_UNSTABLE';return null;}
  if(!eligible){this.cancel();this.state='READY';this.reason=target?'ACTION_LOCKED':'TARGET_OUTSIDE';return null;}
  if(this.target!==target||(this.lastAt!==null&&now-this.lastAt>c.trackingPauseMs)){this.cancel();this.target=target;this.duration=targets.find(t=>t.id===target)?.dwellMs??c.dwellMs;this.lastAt=now;this.state='TARGET_HOVER';this.reason='DWELLING';return null;}
  if(this.gapAt!==null&&now-this.gapAt>c.trackingPauseMs){this.cancel();return null;}
  this.gapAt=null;
  if(this.lastAt!==null)this.elapsed+=Math.min(c.dwellMaxStepMs,Math.max(0,now-this.lastAt));
  this.lastAt=now;this.state='DWELLING';this.reason='DWELLING';
  const dwell=targets.find(t=>t.id===target)?.dwellMs??c.dwellMs;
  if(this.elapsed<dwell)return null;
  const action=target==='next'?'NEXT':mode==='READING'?'CLOSE':'OPEN';
  this.elapsed=dwell;this.state='TRIGGERED';this.reason='WAIT_RELEASE';this.releaseRequired=true;this.releaseSince=null;this.releaseTarget=target;this.lastAction={action,at:now,operatorId,hand:this.handKey};
  return action;
 }
 snapshot() {return {state:this.state,mode:this.state==='ACTION_TRANSITION'?'TRANSITION':this.mode,target:this.target,progress:Math.min(1,this.elapsed/(this.duration||this.config.dwellMs)),releaseRequired:this.releaseRequired,blockedReason:this.reason,lastAction:this.lastAction,handKey:this.handKey};}
}

export function readingVelocity(point,region,config=INTERACTION_CONFIG) {
 if(!point||!region||point.x<region.x||point.x>region.x+region.width||point.y<region.y||point.y>region.y+region.height)return 0;
 const offset=(point.y-region.y)/region.height-.5,dead=config.readingDeadzone;
 return Math.abs(offset)<=dead?0:Math.sign(offset)*Math.min(1,(Math.abs(offset)-dead)/(.5-dead))*config.readingMaxSpeed;
}
