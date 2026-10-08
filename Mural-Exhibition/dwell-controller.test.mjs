import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DwellController,readingVelocity} from './public/dwell-controller.mjs';
const targets=[{id:'view',x:0,y:0,width:100,height:100},{id:'next',x:200,y:0,width:100,height:100}];
const point=(x=50,key='A:left')=>({valid:true,point:{x,y:50},stable:true,key});
function rig(){const c=new DwellController({readingTransitionMs:100});let now=0;return {c,step(p=point(),dt=50,opts={}){now+=dt;return c.update({now,operatorId:'A',pointer:p,targets,...opts});},get now(){return now;},hold(p=point(),ms=1050,opts={}){let actions=[];for(let t=0;t<ms;t+=50){const a=this.step(p,50,opts);if(a)actions.push(a);}return actions;}};}
test('dwell under threshold, then exactly one action; sustained hold and stable release',()=>{
 const r=rig();assert.deepEqual(r.hold(point(),950),[]);assert.deepEqual(r.hold(point(),150),['OPEN']);assert.deepEqual(r.hold(point(),2500),[]);
 r.hold(point(150),300);assert.equal(r.c.releaseRequired,false);assert.deepEqual(r.hold(),['OPEN']);
});
test('reading open/close require release, NEXT is mutually exclusive; transition blocks',()=>{
 const r=rig();r.hold();r.c.setReading(true,r.now);assert.deepEqual(r.hold(point(),1200,{mode:'READING'}),[]);
 r.hold(point(150),300,{mode:'READING'});assert.deepEqual(r.hold(point(250),1200,{mode:'READING'}),[]);assert.deepEqual(r.hold(point(),1100,{mode:'READING'}),['CLOSE']);
 r.c.setReading(false,r.now);assert.deepEqual(r.hold(point(),1200),[]);r.hold(point(150),300);assert.deepEqual(r.hold(point(250),1100),['NEXT']);
 assert.deepEqual(r.hold(point(250),1600,{locked:true}),[]);assert.equal(r.c.state,'ACTION_TRANSITION');assert.deepEqual(r.hold(point(250),1400),[]);
});
test('short gap pauses time; long gap, instability, ambiguous ownership and new hand cancel',()=>{
 for(const invalid of [{valid:false,reason:'HAND_NOT_DETECTED',paused:true},{valid:false,reason:'POSE_STALE',paused:true}]){
  const r=rig();r.hold(point(),600);r.step(invalid,50);r.step(point(),50);assert.deepEqual(r.hold(point(),300),[]);assert.deepEqual(r.hold(point(),300),['OPEN']);
 }
 for(const p of [{valid:false,reason:'AMBIGUOUS_HAND'}, {...point(),stable:false}, point(50,'A:right')]){
  const r=rig();r.hold(point(),900);r.step(p);assert.deepEqual(r.hold(point(),200),[]);
 }
 const r=rig();r.hold(point(),900);r.step({valid:false,paused:true},50);r.step({valid:false,paused:true},300);assert.deepEqual(r.hold(point(),200),[]);
});
test('low FPS and long stalls cannot turn cached coordinates into a completed action',()=>{
 const r=rig();r.step();assert.equal(r.step(point(),10000),null);assert.ok(r.c.elapsed<=120);
 r.c.tick(r.now+1000);assert.equal(r.c.elapsed,0);assert.equal(r.c.state,'TRACKING_PAUSED');
});
test('operator replacement, hidden page and mode change do not transfer progress',()=>{
 const r=rig();r.hold(point(),900);r.step(point(50,'B:left'),50,{operatorId:'B'});assert.equal(r.c.elapsed,0);assert.equal(r.c.releaseRequired,true);
 r.step(point(),50,{blocked:true});assert.equal(r.c.state,'BLOCKED');assert.equal(r.c.elapsed,0);
});
test('reading scroll has a dead zone, correct direction and only a bounded reading region',()=>{
 const z={x:400,y:200,width:300,height:400};assert.equal(readingVelocity({x:500,y:400},z),0);assert.ok(readingVelocity({x:500,y:220},z)<0);assert.ok(readingVelocity({x:500,y:580},z)>0);assert.equal(readingVelocity({x:50,y:580},z),0);
});
test('target-specific timing drives real progress rather than the global default',()=>{
 const c=new DwellController();const regions=targets.map(t=>({...t,dwellMs:500}));c.update({now:0,operatorId:'A',pointer:point(),targets:regions});for(let now=50;now<=250;now+=50)c.update({now,operatorId:'A',pointer:point(),targets:regions});assert.equal(c.snapshot().progress,.5);for(let now=300;now<500;now+=50)assert.equal(c.update({now,operatorId:'A',pointer:point(),targets:regions}),null);assert.equal(c.update({now:500,operatorId:'A',pointer:point(),targets:regions}),'OPEN');
});
