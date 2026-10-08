import {test} from 'node:test';
import assert from 'node:assert/strict';
import {poseFreshnessBudget,GestureDiagnostics} from './public/gesture-diagnostics.mjs';
import {cameraHarness,hand,person} from './b03-dwell-harness.mjs';
import {DwellController} from './public/dwell-controller.mjs';
test('freshness is calibrated only after enough samples, never exceeds 360ms, Hands age stays separate',()=>{
 assert.equal(poseFreshnessBudget({samples:7,latencyP95Ms:200,intervalP95Ms:125}),220);
 assert.equal(poseFreshnessBudget({samples:8,latencyP95Ms:120,intervalP95Ms:125}),280);
 assert.equal(poseFreshnessBudget({samples:100,latencyP95Ms:1000,intervalP95Ms:500}),360);
 const h=cameraHarness(),a=hand(.5,.5),poses=[person({hands:[a],upper:true,missingWrists:['right']})];
 h.deliverCaptured([a],poses,1000,1200,1200);const d=h.snapshot().diagnostics;assert.equal(d.handsRaw,1);assert.equal(d.handsFresh,0);assert.equal(d.poseFresh,true);assert.equal(h.snapshot().pointer.valid,false);
});
for(const fps of [15,10,8])test(`production Hands 30 FPS, Pose ${fps} FPS with 120ms inference delay permits owned control and dwell`,()=>{
 const h=cameraHarness(),a=hand(.28,.545),poses=[person({hands:[a],upper:true,missingWrists:['right']})],interval=1000/fps;
 h.timing({samples:30,latencyP95Ms:120,intervalP95Ms:interval});
 for(let t=1000;t<=4000;t+=1000/30){const poseAt=Math.floor((t-120)/interval)*interval;h.deliverCaptured([a],poses,t,t+10,poseAt);}
 assert.equal(h.snapshot().reveals,1);assert.equal(h.snapshot().calls,0);assert.match(h.snapshot().handLock.lockedHandKey,/:left$/);
 const before=h.snapshot();for(let t=4100;t<=5300;t+=33)h.deliverCaptured([a],poses,t,t+10,3700);assert.equal(h.snapshot().lastAction.action,'OPEN');assert.equal(h.snapshot().calls,0);assert.equal(h.snapshot().handLock.lockedHandKey,null);assert.equal(h.snapshot().diagnostics.handsRaw,1);assert.equal(h.snapshot().diagnostics.poseFresh,false);
});
test('safe pause retains progress with zero lost-time credit; ambiguity, new identity, exit and transition cancel',()=>{
 const targets=[{id:'view',x:0,y:0,width:100,height:100}],p={valid:true,stable:true,key:'A:left',point:{x:50,y:50}};
 const c=new DwellController();const update=(now,pointer=p,other={})=>c.update({now,operatorId:'A',pointer,targets,...other});
 for(let now=0;now<=500;now+=50)update(now);assert.equal(c.elapsed,500);
 update(550,{valid:false,paused:true,key:'A:left',reason:'POSE_STALE'});update(650);assert.equal(c.elapsed,500);assert.equal(update(700),null);assert.equal(c.elapsed,550);
 update(750,{valid:false,paused:true,key:'A:left',reason:'AMBIGUOUS_PERSON'});assert.equal(c.elapsed,0);
 for(let now=800;now<=1200;now+=50)update(now);update(1250,{...p,key:'B:left'},{operatorId:'B'});assert.equal(c.elapsed,0);assert.equal(c.releaseRequired,true);
});
test('bounded diagnostics contain counts/times, never images or landmark arrays',()=>{
 const d=new GestureDiagnostics();for(let at=0;at<5000;at+=10){d.capture(at);d.callback([],at+1,at,true);d.transition('state'+at,at);}const s=d.snapshot(5000);assert.ok(s.states.length<=80);assert.ok(d.input.length<=120);assert.equal(s.rawHands,0);assert.equal(s.inputIntervalP95Ms,10);assert.ok(!JSON.stringify(s).includes('landmarks'));
});

test('a new capture session resets rate windows so model/permission wait is not reported as low input FPS',()=>{const d=new GestureDiagnostics();d.capture(0);d.capture(33);d.resetTiming();d.capture(10000);d.capture(10033);assert.ok(Math.abs(d.snapshot(10033).inputFps-1000/33)<1e-8);});
