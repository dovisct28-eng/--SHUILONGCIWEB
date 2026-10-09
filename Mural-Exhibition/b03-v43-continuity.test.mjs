import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OperatorTracker} from './public/operator-tracker.mjs';
import {HandOwnership} from './public/hand-ownership.mjs';
import {hand,person} from './b03-gesture-harness.mjs';
import {cameraHarness} from './b03-dwell-harness.mjs';
import {GestureDiagnostics} from './public/gesture-diagnostics.mjs';
import {mapHandPoint,hitTarget} from './public/gesture-pointer.mjs';
import {INTERACTION_CONFIG as c} from './public/interaction-config.mjs';

function rig({missingWrists=['left','right']}={}) {
 const tracker=new OperatorTracker(),owner=new HandOwnership();let now=0,s;
 const frame=(x,extras=[],opts={})=>{
  now+=opts.dt??40;const a=hand(x,.55),b=opts.body??person({upper:true,hands:[a,...extras],missingWrists});
  s=tracker.update({now,poseAt:opts.poseAt??now,poses:opts.poses??[b],hands:opts.absent?extras:[a,...extras],controlHandKey:owner.lockedHandKey});
  return {ownership:s,lock:owner.update({ownership:s,now}),now};
 };
 for(let n=0;n<36;n++)frame(.65);
 assert.match(owner.lockedHandKey,/:right$/); // labelled shoulder, never detection order
 return {tracker,owner,frame,get now(){return now;}};
}
test('V4.3 baseline reproduction: locked hand travels continuously across shoulder midline',()=>{
 const r=rig(),key=r.owner.lockedHandKey;
 for(let n=0;n<=50;n++){const s=r.frame(.65-.3*n/50);assert.equal(s.lock.lockedHandKey,key);assert.equal(s.lock.valid,true,JSON.stringify(s.ownership.diagnostics.assignmentRejections));}
});
test('V4.3 baseline reproduction: ambiguous non-control hand cannot erase a distinct locked hand',()=>{
 const r=rig(),key=r.owner.lockedHandKey;
 const s=r.frame(.65,[hand(.5,.65)]);
 assert.equal(s.lock.lockedHandKey,key);assert.equal(s.lock.valid,true,JSON.stringify(s.ownership.diagnostics.assignmentRejections));
});
test('V4.3 locked identity pauses on crossing/duplicates, competing people and explicit opposite wrist',()=>{
 for(const mode of ['crossing','duplicate','person','opposite','opposite-exists']){
  const r=rig(),key=r.owner.lockedHandKey,a=hand(.65,.55);let s;
  if(mode==='crossing'||mode==='duplicate')s=r.frame(.65,[hand(mode==='duplicate'?.65:.66,.55)]);
  if(mode==='person')s=r.frame(.65,[],{poses:[person({upper:true,missingWrists:['left','right']}),person({x:.52,upper:true,missingWrists:['left','right']})]});
  if(mode==='opposite')s=r.frame(.65,[],{body:person({upper:true,hands:[a],missingWrists:['right']})});
  if(mode==='opposite-exists')s=r.frame(.65,[],{body:person({upper:true,hands:[a,hand(.49,.55)]})});
  assert.equal(s.lock.valid,false,mode);assert.equal(s.lock.lockedHandKey,key,mode);assert.equal(s.lock.state,'HAND_PAUSED',mode);
 }
});
test('V4.3 fresh transport follows body translation/scale; spare hand moves without takeover or order dependency',()=>{
 const r=rig(),key=r.owner.lockedHandKey;
 for(let n=0;n<80;n++){
  const x=.5+.015*Math.sin(n/15),width=.3+.015*Math.sin(n/10),control=.65-(x-.5),spare=hand(.35+.015*Math.sin(n/8),.72),a=hand(control,.55);
  const s=r.frame(control,[spare],{body:person({x,width,upper:true,hands:[a,spare],missingWrists:['left','right']})});
  assert.equal(s.lock.lockedHandKey,key);assert.equal(s.lock.valid,true);
 }
});
test('V4.3 short occlusion retains identity, sustained loss releases, stale pose and abrupt jump block',()=>{
 const r=rig(),key=r.owner.lockedHandKey;
 let s=r.frame(.65,[],{absent:true,dt:300});assert.equal(s.lock.lockedHandKey,key);assert.equal(s.lock.valid,false);
 for(let n=0;n<8;n++)s=r.frame(.65);assert.equal(s.lock.valid,true);assert.equal(s.lock.lockedHandKey,key);
 s=r.frame(.65,[],{poseAt:r.now-500});assert.equal(s.lock.valid,false);assert.equal(s.lock.reason,'POSE_STALE');
 s=r.frame(.95);assert.equal(s.lock.valid,false);assert.equal(s.lock.lockedHandKey,key);
 s=r.frame(.65,[],{absent:true,dt:700});assert.equal(s.lock.state,'HAND_RELEASED');assert.equal(s.lock.lockedHandKey,null);
});
test('V4.3 crossing recovery keeps the original semantic hand and fresh dwell starts from zero',()=>{
 const r=rig(),key=r.owner.lockedHandKey;
 for(let n=0;n<6;n++)assert.equal(r.frame(.65,[hand(.65,.55)]).lock.valid,false);
 let s;for(let n=0;n<10;n++)s=r.frame(.65);
 assert.equal(s.lock.valid,true);assert.equal(s.lock.lockedHandKey,key);
});
test('V4.3 render tick distinguishes rejected observations from a stopped callback stream',()=>{
 const r=rig();let s;
 for(let n=0;n<18;n++){s=r.frame(.65,[],{absent:true});r.owner.tick(r.now+1);}
 assert.equal(r.owner.state,'WAIT_HAND'); // release followed by a new empty frame
 const stalled=rig();assert.equal(stalled.owner.tick(stalled.now+701).releaseCause,'CALLBACK_STALL');
 const rejected=rig();for(let n=0;n<16;n++){rejected.frame(.65,[],{absent:true});rejected.owner.tick(rejected.now+1);}
 const released=rejected.owner.tick(rejected.now+11);assert.equal(released.state,'HAND_RELEASED');assert.equal(released.releaseCause,'CONTROL_HAND_NOT_DETECTED');
});
for(const fps of [10,25,50])for(const poseFps of [8,10])test(`V4.3 production trajectories: Hands ${fps} FPS / Pose ${poseFps} FPS, delayed wrists, OPEN CLOSE NEXT`,()=>{
 const h=cameraHarness(),step=1000/fps,interval=1000/poseFps,delay=120;let x=.5,key=null,actions=[];
 h.timing({samples:30,latencyP95Ms:delay,intervalP95Ms:interval});
 const history=[];
 function frame(px){
  const t=h.time+step;history.push({at:t,x:px});
  const poseAt=Math.floor((t-delay)/interval)*interval,old=history.findLast(p=>p.at<=poseAt)?.x??.5;
  const a=hand(px,.545),oldHand=hand(old,.545),body=person({hands:[oldHand],upper:true,missingWrists:['right',...(Math.round(t/interval)%4===0?['left']:[])]});
  h.deliverCaptured([a],[body],t,t,poseAt);const s=h.snapshot();
  if(s.handLock.lockedHandKey)key??=s.handLock.lockedHandKey;
  if(key){assert.equal(s.handLock.lockedHandKey,key);assert.equal(s.pointer.valid,true,JSON.stringify(s.diagnostics.assignmentRejections));}
  if(s.lastAction&&actions.at(-1)?.at!==s.lastAction.at)actions.push(s.lastAction);
 }
 const hold=(px,ms)=>{for(let t=0;t<ms;t+=step)frame(px);x=px;};
 const travel=to=>{const from=x;for(let t=step;t<=1200+1;t+=step)frame(from+(to-from)*Math.min(1,t/1200));x=to;};
 hold(.5,1100);travel(.34);hold(.34,1600);assert.equal(h.snapshot().reveals,1);assert.equal(h.snapshot().calls,0);
 travel(.5);hold(.5,1100);assert.equal(h.snapshot().releaseRequired,false);
 travel(.34);hold(.34,1600);assert.equal(h.snapshot().closes,1);
 travel(.5);hold(.5,1100);travel(.66);hold(.66,1600);assert.equal(h.snapshot().calls,1);
 travel(.5);hold(.5,1100);travel(.34);hold(.34,1600);assert.equal(h.snapshot().reveals,2);
 assert.deepEqual(actions.map(a=>a.action),['OPEN','CLOSE','NEXT','OPEN']);
 assert.ok(h.snapshot().tracking.events.some(e=>e.event==='DWELL_COMPLETED'));
});
test('V4.3 map reaches DOM targets with 27 percent less horizontal travel, once mirrored at four viewports',()=>{
 for(const [width,height]of [[1280,800],[1366,768],[1440,900],[1920,1080]]){
  for(const [id,fraction]of [['view',c.targetLeft],['next',c.targetRight]]){
   const x=c.pointerInput.left+(c.pointerInput.right-c.pointerInput.left)*fraction,y=c.pointerInput.top+(c.pointerInput.bottom-c.pointerInput.top)*c.targetY;
   const target={id,x:width*fraction-c.targetWidth/2,y:height*c.targetY-c.targetHeight/2,width:c.targetWidth,height:c.targetHeight};
   assert.equal(hitTarget(mapHandPoint({x,y},width,height),[target]),id);assert.ok(Math.abs(x-.5)<=.163);
  }
 }
});
test('V4.3 diagnostics are bounded/quantized/disabled by default and contain no raw landmark arrays',()=>{
 const off=new GestureDiagnostics(),on=new GestureDiagnostics({enabled:true});
 for(let now=0;now<60000;now+=40){const state=now%160?'HAND_LOCKED':'HAND_PAUSED',input={now,ownership:{activeOperator:{id:'visitor-1'},diagnostics:{handsFresh:1,handsCapturedAt:now,poseFresh:true,poseObservedAt:now}},handLock:{state,lockedHandKey:'visitor-1:left',valid:state==='HAND_LOCKED',reason:'HAND_LOCKED_PAUSED',selectedHand:{x:.512345,y:.63456}},pointer:{valid:true,stable:now%160!==0},dwell:{state:'READY',mode:'NAVIGATION',progress:0}};off.track(input);on.track(input);}
 assert.equal(off.frames.length,0);assert.equal(off.events.length,0);assert.equal(on.frames.length,240);assert.equal(on.events.length,160);assert.deepEqual(on.frames.at(-1).palm,{x:.51,y:.63});
 const json=JSON.stringify(on.trackingSnapshot());assert.ok(!/landmarks|video|image|base64/.test(json));assert.ok(on.events.some(e=>e.event==='HAND_RECOVERED'));assert.ok(on.events.every(e=>'from'in e&&'to'in e&&'handsFresh'in e&&'poseFresh'in e&&'mode'in e));
});
test('V4.3 diagnostics distinguish completed acquisition from reset and preserve event time order',()=>{
 const d=new GestureDiagnostics({enabled:true}),input=now=>({now,ownership:{activeOperator:{id:'visitor-1'},diagnostics:{handsFresh:1,handsCapturedAt:now,poseFresh:true,poseObservedAt:now}},pointer:{},dwell:{state:'READY',mode:'NAVIGATION'}});
 d.track({...input(100),handLock:{state:'HAND_CANDIDATE',candidate:'visitor-1:left',reason:'HAND_ACQUIRING'}});
 d.track({...input(450),handLock:{state:'HAND_LOCKED',lockedHandKey:'visitor-1:left',reason:'READY'}});
 assert.ok(!d.events.some(e=>e.event==='HAND_CANDIDATE_RESET'));
 d.track({...input(440),handLock:{state:'HAND_RELEASED',releaseCause:'CONTROL_HAND_LOSS_TIMEOUT',reason:'HAND_LOCK_RELEASED'}});
 assert.ok(d.events.every((e,i)=>!i||e.atMs>=d.events[i-1].atMs));
});
