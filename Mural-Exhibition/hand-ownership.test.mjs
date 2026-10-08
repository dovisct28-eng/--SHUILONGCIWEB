import {test} from 'node:test';
import assert from 'node:assert/strict';
import {HandOwnership} from './public/hand-ownership.mjs';
import {GesturePointer} from './public/gesture-pointer.mjs';
import {DwellController,readingVelocity} from './public/dwell-controller.mjs';
const targets=[{id:'view',x:0,y:0,width:100,height:100},{id:'next',x:800,y:0,width:100,height:100}];
const hand=(side='left',x=.23,y=.23,id='A')=>({operatorId:id,side,x,y,fresh:true,source:'pose'});
const owned=(hands=[],extra={})=>({activeOperator:{id:'A'},operatorState:'PERSON_LOCKED',assignedHands:hands,diagnostics:{poseFresh:true,operatorObservable:true,handsDetected:hands.length},...extra});
function rig(){const owner=new HandOwnership(),pointer=new GesturePointer(),dwell=new DwellController();return {owner,pointer,dwell,frame(now,hands=[],extra={},context={}){const lock=owner.update({ownership:owned(hands,extra),now,width:1000,height:800,targets,...context});const p=pointer.update({handOwnership:lock,now,width:1000,height:800});const action=dwell.update({now,operatorId:lock.operatorId,pointer:p,targets,...context});return {lock,p,action};}};}
function acquire(r,h=hand(),at=0){let s;for(let now=at;now<=at+350;now+=50)s=r.frame(now,[h]);return s;}
test('350ms acquisition is independent of 1000ms dwell; resting hand never acquires',()=>{
 const r=rig();assert.equal(r.frame(0,[hand('left',.5,.5)]).lock.state,'WAIT_HAND');
 r.frame(50,[hand()]);assert.equal(r.frame(399,[hand()]).lock.lockedHandKey,null); // callback gap restarts evidence
 for(let now=400;now<750;now+=50)assert.equal(r.frame(now,[hand()]).lock.valid,false);
 const s=r.frame(750,[hand()]);assert.equal(s.lock.lockedHandKey,'A:left');assert.equal(s.p.valid,true);assert.equal(s.action,null);assert.equal(r.dwell.elapsed,0);
 for(let now=800;now<1900;now+=50)assert.equal(r.frame(now,[hand()]).action,null);
 assert.equal(r.frame(1900,[hand()]).action,'OPEN');
});
test('both requests block before lock; second hand and array reorder do not disturb a locked controller',()=>{
 const r=rig(),a=hand(),b=hand('right',.71);
 for(let now=0;now<500;now+=50)assert.equal(r.frame(now,[a,b]).lock.reason,'AMBIGUOUS_HAND');
 acquire(r,a,500);
 for(let now=900;now<=1800;now+=50){const s=r.frame(now,now%100?[a,b]:[b,a]);assert.equal(s.lock.lockedHandKey,'A:left');assert.equal(s.lock.valid,true);assert.equal(s.lock.diagnostic,'NON_CONTROL_HAND_IGNORED');}
});
test('left/right are semantic identities; right control ignores left VIEW and non-control scroll',()=>{
 const r=rig(),b=hand('right',.71);acquire(r,b);
 const s=r.frame(400,[hand(),b]);assert.equal(s.p.key,'A:right');assert.ok(s.p.point.x>800);
 const r2=rig(),a=hand('left',.5,.5);acquire(r2,hand());for(let now=400;now<=1000;now+=50)r2.frame(now,[a,hand('right',.71,.79)]);
 assert.equal(readingVelocity(r2.pointer.point,{x:0,y:0,width:1000,height:800}),0);
});
for(const gap of [100,300,500])test(`loss ${gap}ms preserves identity, blocks takeover and rearms for 250ms`,()=>{
 const r=rig(),a=hand(),b=hand('right',.71);acquire(r,a);const last=350;
 const paused=r.frame(last+gap,[b]);assert.equal(paused.lock.state,'HAND_PAUSED');assert.equal(paused.lock.lockedHandKey,'A:left');assert.equal(paused.p.valid,false);
 const start=last+gap+1;assert.equal(r.frame(start,[a,b]).lock.valid,false);
 for(let now=start+50;now<start+250;now+=50)assert.equal(r.frame(now,[a,b]).lock.valid,false);
 const s=r.frame(start+250,[a,b]);assert.equal(s.lock.valid,true);assert.equal(s.p.key,'A:left');assert.equal(r.dwell.elapsed,0);
});
test('loss over 650ms releases; another hand needs complete acquisition and zero old dwell',()=>{
 const r=rig();acquire(r);for(let now=400;now<=1100;now+=50)r.frame(now,[hand()]);assert.ok(r.dwell.elapsed>0);
 let s=r.frame(1751,[hand('right',.71)]);assert.equal(s.lock.state,'HAND_RELEASED');assert.equal(s.p.visible,false);assert.equal(r.dwell.elapsed,0);
 s=r.frame(1800,[hand('right',.71)]);assert.equal(s.lock.state,'HAND_CANDIDATE');assert.equal(s.lock.lockedHandKey,null);
 for(let now=1850;now<2150;now+=50)r.frame(now,[hand('right',.71)]);
 s=r.frame(2150,[hand('right',.71)]);assert.equal(s.p.key,'A:right');assert.equal(r.dwell.elapsed,0);
});
test('cached grace, wrong operator, duplicate semantic side and ambiguity are never effective input',()=>{
 for(const hands of [[{...hand(),fresh:false}],[hand('left',.23,.23,'B')],[hand(),hand()]]){const r=rig();acquire(r);assert.equal(r.frame(400,hands).lock.valid,false);assert.equal(r.owner.lockedHandKey,'A:left');}
 for(const diagnostics of [{poseFresh:false,operatorObservable:true},{poseFresh:true,operatorObservable:false},{poseFresh:true,operatorObservable:true,assignmentBlocked:true,assignmentRejections:[{reason:'AMBIGUOUS_PERSON'}]}]){const r=rig();acquire(r);assert.equal(r.frame(400,[hand()],{diagnostics}).lock.valid,false);assert.equal(r.owner.state,'HAND_PAUSED');}
});
test('person release/change clears hand identity and cannot prolong operator life',()=>{
 const r=rig();acquire(r);const s=r.frame(400,[hand()],{activeOperator:null,released:true});assert.equal(s.lock.lockedHandKey,null);assert.equal(s.p.valid,false);
 r.frame(450,[hand('left',.23,.23,'B')],{activeOperator:{id:'B'}});assert.equal(r.owner.lockedHandKey,null);assert.equal(r.dwell.elapsed,0);
});
test('OPEN/CLOSE/NEXT, reading and loading retain hand identity while cancelling action evidence',()=>{
 const r=rig();acquire(r);r.dwell.setReading(true,400);r.frame(450,[hand()],{},{mode:'READING',locked:true});assert.equal(r.owner.lockedHandKey,'A:left');
 r.dwell.setReading(false,500);r.dwell.lock();
 for(let now=550;now<2000;now+=50){const s=r.frame(now,[hand()],{},{locked:true});assert.equal(s.lock.lockedHandKey,'A:left');assert.equal(s.action,null);}
 const s=r.frame(2000,[hand()]);assert.equal(s.lock.valid,true);assert.equal(r.dwell.releaseRequired,true);
});
test('action release latch survives hand loss/change; newly acquired hand cannot trigger until fresh release',()=>{
 const r=rig();acquire(r);let actions=[];for(let now=400;now<=1900;now+=50){const s=r.frame(now,[hand()]);if(s.action)actions.push(s.action);}assert.deepEqual(actions,['OPEN']);
 r.frame(2600,[]);acquire(r,hand('right',.71),2650);
 for(let now=3050;now<4500;now+=50)assert.equal(r.frame(now,[hand('right',.71)]).action,null);
 assert.equal(r.dwell.releaseRequired,true);
 for(let now=4500;now<=5150;now+=50)r.frame(now,[hand('right',.5,.5)]);
 assert.equal(r.dwell.releaseRequired,false);
});
test('render scheduler expires stalled input without another inference loop; resets are idempotent',()=>{
 const r=rig();acquire(r);assert.equal(r.owner.tick(600).state,'HAND_PAUSED');assert.equal(r.owner.tick(1001).state,'HAND_RELEASED');
 r.owner.reset();r.owner.reset();assert.equal(r.owner.lockedHandKey,null);assert.equal(r.owner.snapshot().candidate,null);
});
