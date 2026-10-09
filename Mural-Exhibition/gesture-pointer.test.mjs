import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GesturePointer,hitTarget} from './public/gesture-pointer.mjs';
import {HandOwnership} from './public/hand-ownership.mjs';
import {OperatorTracker} from './public/operator-tracker.mjs';
import {person,hand} from './b03-gesture-harness.mjs';
const targets=[{id:'view',x:100,y:350,width:240,height:180},{id:'next',x:720,y:350,width:180,height:180}];
function rig({width=.3,missingWrists=[]}={}) {
 const tracker=new OperatorTracker(),pointer=new GesturePointer(),owner=new HandOwnership({controlHandAcquireMs:0});let ownership;
 for(let now=0;now<=900;now+=100)ownership=tracker.update({now,poseAt:now,poses:[person({width,upper:true,missingWrists})],hands:[]});
 return {frame(now,hands,poses,poseAt=now){if(!poses){const body=person({hands,width,upper:true,missingWrists});if(hands.length===1)body[16]={x:.25,y:.8,visibility:missingWrists.includes('right')?0:1,presence:1};poses=[body];}ownership=tracker.update({now,poseAt,poses,hands});return pointer.update({handOwnership:owner.update({ownership,now,width:1000,height:800,targets}),now,width:1000,height:800});},tracker,pointer};
}
test('Phase 1: near/middle/far upper-body and missing wrists produce one owned, once-mirrored pointer',()=>{
 for(const width of [.18,.3,.6])for(const missingWrists of [[],['left'],['right'],['left','right']]){
  const r=rig({width,missingWrists}),s=r.frame(1000,[hand(.35333333333333333,.55)]);
  assert.equal(s.valid,true);assert.ok(Math.abs(s.point.x-1000/6)<1e-8);assert.ok(Math.abs(s.point.y-800*7/12)<1e-8);assert.equal(hitTarget(s.point,targets),'view');
 }
});
test('Phase 1: resting second hand and detection reorder preserve control; locked hand ignores competing target hands',()=>{
 const r=rig(),a=hand(.3,.55),b=hand(.65,.8),poses=[person({hands:[a,b]})];
 const first=r.frame(1000,[a],poses);assert.equal(first.valid,true);
 assert.equal(r.frame(1040,[a,b],poses).key,first.key);assert.equal(r.frame(1080,[b,a],poses).key,first.key);
 const c=hand(.7,.55);assert.equal(r.frame(1100,[a,c],[person({hands:[a,c]})]).key,first.key);
 const unowned=rig();assert.equal(unowned.frame(1000,[a,c],[person({hands:[a,c]})]).reason,'AMBIGUOUS_HAND');
});
test('Phase 1: ambiguous person, stale pose, jumps and hand identity changes cannot reuse evidence',()=>{
 const r=rig(),a=hand(.2,.55);r.frame(1000,[a]);
 assert.equal(r.frame(1040,[]).valid,false);
 assert.equal(r.frame(1080,[a],[person({hands:[a]})],800).reason,'POSE_STALE');
 const overlap=person({x:.52,hands:[a]});assert.equal(r.frame(1120,[a],[person({hands:[a]}),overlap]).valid,false);
 const p=new GesturePointer(),owned=(side,x)=>({operatorId:'A',side,x,y:.5,fresh:true,source:'pose'});
 const update=(now,h)=>p.update({now,width:1000,height:800,targets,handOwnership:{valid:true,state:'HAND_LOCKED',operatorId:'A',lockedHandKey:'A:left',selectedHand:h}});
 update(0,owned('left',.2));assert.equal(update(40,owned('left',.8)).reason,'HAND_UNSTABLE');
 assert.equal(update(80,owned('right',.8)).valid,false);
});
test('Phase 1: time smoothing, jitter and coordinates remain bounded at variable FPS',()=>{
 for(const step of [16,33,100]){const p=new GesturePointer();let s;for(let now=0;now<=1200;now+=step)s=p.update({now,width:1000,height:800,targets,handOwnership:{valid:true,operatorId:'A',lockedHandKey:'A:left',selectedHand:{operatorId:'A',side:'left',x:.368+Math.sin(now)*.0014,y:.55,fresh:true}}});assert.ok(Math.abs(s.point.x-200)<4);assert.equal(s.stable,true);}
});
