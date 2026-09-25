import test from 'node:test';
import assert from 'node:assert/strict';
import {chapter,cameras,route,sampleTour,handoff,duration} from './path.mjs';
const overview={position:[-32,37,-12],target:[0,-2.3,-1.75]};
test('A03 boundary and A04 entry stay fixed; guide preparation is reversible',()=>{
  assert.equal(chapter(13.2).active,false);assert.equal(chapter(14).entry,1);
  assert.equal(chapter(16).guideStart,0);assert.equal(chapter(18).guideStart,1);
  for(const p of [16,16.5,17,17.5,18])assert.ok(Math.abs(chapter(p).guideStart+chapter(34-p).guideStart-1)<1e-12);
  assert.equal('handoff' in cameras,false);
  assert.deepEqual(sampleTour(duration,overview).camera,overview);
});
test('each mural has a stable independent camera before withdrawal',()=>{
  for(const [a,b,key] of [[8,11,'fifth'],[23,26,'first'],[36,39,'second']]){
    assert.deepEqual(sampleTour(a,overview).camera,cameras[key]);
    assert.deepEqual(sampleTour(b,overview).camera,cameras[key]);
  }
  assert.deepEqual(sampleTour(duration,overview).camera,overview);
});
test('route grows cumulatively only after withdrawal; completed state stays complete',()=>{
  assert.deepEqual(sampleTour(44,overview).growth,[0,0,0]);
  assert.deepEqual(sampleTour(47,overview).growth,[1,0,0]);
  assert.deepEqual(sampleTour(53,overview).growth,[1,1,0]);
  assert.deepEqual(sampleTour(100,overview).growth,[1,1,1]);
});
test('walking lines clear model columns and remain inside perimeter walls',()=>{
  const columns=[...[-3.6,0,3.6].map(x=>[x,-8.35])];
  for(const side of [-1,1])for(const z of [-7.2,-2.4,2.4,7.2,9.5])columns.push([side*3.25,z]);
  for(const path of route)for(let i=1;i<path.length;i++)for(let step=0;step<=100;step++){
    const t=step/100,p=path[i].map((v,j)=>path[i-1][j]+(v-path[i-1][j])*t);
    assert.ok(Math.abs(p[0])<4.4&&p[2]<6.4&&p[2]>-14.8);
    for(const [x,z] of columns)assert.ok(Math.hypot(p[0]-x,p[2]-z)>.25,'column clearance');
  }
});
test('camera samples stay continuous; first mural stop passes below the gallery beam',()=>{
  let previous=sampleTour(0,overview).camera.position;
  for(let time=.01;time<=duration;time+=.01){const current=sampleTour(time,overview).camera.position;
    assert.ok(current[1]>=2.29);assert.ok(Math.hypot(...current.map((v,i)=>v-previous[i]))<.4);previous=current;
  }
  assert.ok(cameras.first.position[1]<2.66);
});
test('handoff is reversible from overview through fifth approach to close view',()=>{
  assert.deepEqual(handoff(16,overview).camera,overview);
  assert.deepEqual(handoff(17,overview).camera,cameras.fifthApproach);
  assert.deepEqual(handoff(18,overview).camera,cameras.fifthClose);
  assert.ok(handoff(16,overview).routeOpacity>handoff(17,overview).routeOpacity);
  assert.equal(handoff(18,overview).modelOpacity,0);
});
