import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIRST_FRONT_DOCK} from '../../src/mural-front.mjs';
import {REAR_DOCKS} from './route-v3.3.mjs';
import {FIFTH_DOCK} from './route-v3.4.mjs';
import {applyRouteCase} from './route-cases-v3.5.mjs';
import {EXIT_DURATION,EXTERIOR_POSE,exitRail,onwardRail,wallSweep} from './route-v3.6.mjs';

const murals=applyRouteCase(JSON.parse(readFileSync(new URL('./murals.json',import.meta.url),'utf8')));
const docks=[FIRST_FRONT_DOCK.discoveryCamera,...REAR_DOCKS.slice(0,3),FIFTH_DOCK];
const aspects=[2880/990,6000/1357,2400/1850,2,6000/1617];
const difference=(a,b)=>a.map((value,index)=>value-b[index]);
const norm=vector=>Math.hypot(...vector);
const assertPose=(a,b)=>{
 assert.ok(norm(difference(a.position,b.position))<1e-9);
 assert.ok(norm(difference(a.target,b.target))<1e-9);
 assert.equal(a.fov,b.fov);
};

for(const [index,mural] of murals.entries())test(`${mural.id} follows the image's right-to-left axis and joins the onward rail`,()=>{
 const sweep=wallSweep(mural,index,docks[index],aspects[index]);
 const begin=sweep.scan.sample(0),end=sweep.scan.sample(1);
 const travel=index===4?exitRail(end):onwardRail(index,end);
 const right=[Math.cos(mural.rotation),0,-Math.sin(mural.rotation)];
 const wallDistance=position=>difference(position,mural.position).reduce((sum,value,i)=>sum+value*[Math.sin(mural.rotation),0,Math.cos(mural.rotation)][i],0);
 assertPose(sweep.approach.sample(0),docks[index]);
 assertPose(sweep.approach.sample(1),begin);
 assertPose(end,travel.sample(0));
 if(index===1||index===4){
  const sweepFov=index===1?39:42;
  for(const progress of [0,.5,1])assert.equal(sweep.scan.sample(progress).fov,sweepFov);
  assert.ok(sweep.approach.sample(.5).fov>sweepFov&&sweep.approach.sample(.5).fov<48);
  assert.equal(travel.sample(1).fov,48);
 }
 assert.ok(difference(begin.position,end.position).reduce((sum,value,i)=>sum+value*right[i],0)>1.5);
 assert.ok(Math.abs(wallDistance(begin.position)-wallDistance(end.position))<1e-9);
 for(let i=0;i<=500;i++){
  const sample=travel.sample(i/500);
  assert.ok(norm(difference(sample.target,sample.position))>.8);
 }
 if(index<4)assertPose(travel.sample(1),docks[index+1]);
 else{
  assert.deepEqual(travel.sample(1).position,EXTERIOR_POSE.position);
  assertPose(travel.sampleExit(0),end);
  assertPose(travel.sampleExit(1),EXTERIOR_POSE);
  const samples=Array.from({length:401},(_,i)=>travel.sample(i/400));
  assert.ok(samples.filter(({position:[,,z]})=>z>=-9.4&&z<11.35).every(({position:[x]})=>x<0));
  const gallery=samples.filter(({position:[,,z]})=>z>=0&&z<=9.5);
  assert.ok(gallery.length>0&&gallery.every(({position:[x]})=>x<-3.3));
  const threshold=samples.find(sample=>sample.position[2]>11.93);
  assert.ok(Math.abs(threshold.position[0])<.5);
  assert.ok(threshold.position[1]<1.615);
  assert.ok(threshold.target[2]>threshold.position[2]);
 }
});

test('the exit keeps advancing after the central doorway while the camera turns',()=>{
 const sweep=wallSweep(murals[4],4,FIFTH_DOCK,aspects[4]);
 const {sampleExit}=exitRail(sweep.end);
 const yaw=({position,target})=>Math.atan2(target[0]-position[0],target[2]-position[2]);
 const frames=Array.from({length:EXIT_DURATION/10+1},(_,i)=>sampleExit(i*10/EXIT_DURATION));
 const door=frames.findIndex(({position:[,,z]})=>z>11.93);
 const turn=frames.findIndex(pose=>pose.position[2]>12.25&&yaw(pose)<-.03);
 assert.ok(turn>door);
 assert.ok(frames[turn].position[2]>=14.1);
 for(let i=door;i<frames.length-50;i++){
  const [a,b]=frames.slice(i,i+2);
  assert.ok(b.position[2]-a.position[2]>.006,'no stop during the walking-to-turn handoff');
  assert.ok(Math.abs(a.position[0])<.5,'stay on the central axis outside');
  assert.ok(Math.abs(a.position[1]-b.position[1])<.004);
  assert.ok(Math.abs(a.fov-b.fov)<.04);
 }
 for(let i=turn;i<frames.length-1;i++){
  const [a,b]=frames.slice(i,i+2),delta=yaw(b)-yaw(a);
  assert.ok(Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<.017);
  assert.ok(Math.sin(delta)<=1e-9,'keep turning in the same direction across ±π');
 }
});
