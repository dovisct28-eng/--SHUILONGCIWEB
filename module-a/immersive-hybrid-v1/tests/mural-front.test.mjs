import test from 'node:test';
import assert from 'node:assert/strict';
import {FIRST_FRONT_DOCK,frontCamera,sampleMuralFront,frontReadingPhases} from '../src/mural-front.mjs';
import {sampleMuralTurn,createMuralController} from '../src/mural-transition-controller.mjs';
import {v24aFrontConfidence} from '../src/v24a-layer.mjs';
const point=p=>{const {muralFront,...pose}=p;return pose;};
test('front dock derives from the anchor normal; discovery is preserved exactly',()=>{
 assert.deepEqual(point(sampleMuralFront(0)),sampleMuralTurn(1));
 assert.deepEqual(point(sampleMuralFront(1)),FIRST_FRONT_DOCK.frontCamera);
 assert.ok(Math.abs(FIRST_FRONT_DOCK.frontCamera.position[0]-3.3)<1e-12);
 assert.deepEqual(frontCamera({center:[2,3,4],normal:[0,0,2],standOff:3}).position,[2,3,7]);
 assert.throws(()=>frontCamera({center:[0,0,0],normal:[0,0,0],standOff:1}));
});
test('front travel is deterministic, bounded, with C2 endpoints and continuous angle/speed',()=>{
 const a=sampleMuralFront(0),b=sampleMuralFront(1),dir=p=>{const d=p.target.map((v,i)=>v-p.position[i]),n=Math.hypot(...d);return d.map(v=>v/n);};
 let previous=a;
 for(let i=0;i<=1000;i++){
  const p=sampleMuralFront(i/1000);assert.deepEqual(p,sampleMuralFront(i/1000));
  for(const f of ['position','target'])p[f].forEach((v,j)=>assert.ok(Number.isFinite(v)&&Math.abs(v-previous[f][j])<.03));
  p.position.forEach((v,j)=>assert.ok(v>=Math.min(a.position[j],b.position[j])-1e-12&&v<=Math.max(a.position[j],b.position[j])+1e-12));
  assert.ok(dir(p).reduce((n,v,j)=>n+v*dir(previous)[j],0)>.99998);
  previous=p;
 }
 for(const end of [0,1]){const p=sampleMuralFront(end),q=sampleMuralFront(end?1-1e-5:1e-5);assert.ok(Math.hypot(...p.position.map((v,i)=>v-q.position[i]))<1e-10);}
 assert.deepEqual(sampleMuralFront(-1),a);assert.deepEqual(sampleMuralFront(2),b);
});
test('projection and scene contribution are bounded, staged, and reversible',()=>{
 assert.equal(v24aFrontConfidence(sampleMuralTurn(1)),1);
 for(let i=0;i<=1000;i++){
  const p=i/1000,ph=frontReadingPhases(p),gain=v24aFrontConfidence(sampleMuralFront(p));
  assert.ok(Object.values(ph).every(x=>x>=0&&x<=1));assert.ok(gain>=0&&gain<=1);
  if(p<=.12)assert.equal(ph.rectify,0);if(p>=.12)assert.equal(ph.handoff,1);if(p<=.84)assert.equal(ph.ui,0);if(p>=.75)assert.equal(gain,0);
 }
 assert.deepEqual(frontReadingPhases(1),{handoff:1,rectify:1,ui:1});
});
test('one busy lock encloses front/hold/reading and exact reverse, five cycles',async()=>{
 const calls=[],record=field=>async p=>{calls.push([field,p]);};
 const c=createMuralController({prepare:record('prepare'),animateTurn:record('turn'),animateFront:record('front'),holdFront:record('hold'),animateReading:record('reading')});
 for(let i=0;i<5;i++){
  await c.go('mural-look');calls.length=0;const forward=c.go('mural-reading');assert.equal(c.busy,true);assert.equal(await c.go('corridor-2_5d'),false);await forward;
  assert.deepEqual(calls,[['front',1],['hold',undefined],['reading',1]]);calls.length=0;
  await c.go('mural-look');assert.deepEqual(calls,[['reading',0],['hold',undefined],['front',0]]);await c.go('corridor-2_5d');assert.equal(c.busy,false);
 }
});
test('new-stage failures roll back to a stable corridor and unlock retry',async()=>{
 for(const field of ['animateFront','holdFront']){let failed=true,rolls=0;const c=createMuralController({prepare:async()=>{},animateTurn:async()=>{},animateReading:async()=>{},[field]:async()=>{if(failed)throw Error('front failure');},rollback:()=>rolls++});
  await c.go('mural-look');await assert.rejects(()=>c.go('mural-reading'),/front failure/);assert.equal(c.state,'corridor-2_5d');assert.equal(c.busy,false);assert.equal(rolls,1);failed=false;await c.go('mural-look');assert.equal(await c.go('mural-reading'),true);
 }
});
