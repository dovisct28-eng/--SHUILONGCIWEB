import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIRST_FRONT_DOCK} from '../../src/mural-front.mjs';
import {REAR_DOCKS} from './route-v3.3.mjs';
import {FIFTH_DOCK} from './route-v3.4.mjs';
import {applyRouteCase} from './route-cases-v3.5.mjs';
import {EXTERIOR_POSE,exitRail,exteriorTurn,onwardRail,wallSweep} from './route-v3.6.mjs';

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
 assert.ok(difference(begin.position,end.position).reduce((sum,value,i)=>sum+value*right[i],0)>1.5);
 assert.ok(Math.abs(wallDistance(begin.position)-wallDistance(end.position))<1e-9);
 for(let i=0;i<=500;i++){
  const sample=travel.sample(i/500);
  assert.ok(norm(difference(sample.target,sample.position))>.8);
 }
 if(index<4)assertPose(travel.sample(1),docks[index+1]);
 else{
  assert.deepEqual(travel.sample(1).position,EXTERIOR_POSE.position);
  assertPose(exteriorTurn(1),EXTERIOR_POSE);
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
