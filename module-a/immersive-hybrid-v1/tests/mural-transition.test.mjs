import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleMuralTurn,readingPhases,createMuralController} from '../src/mural-transition-controller.mjs';
import {sampleGallery,FIRST_MURAL} from '../src/corridor-path.mjs';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

test('V2.1 and V2.2 camera rail files match immutable V2.2.1 baseline',()=>{
 for(const file of ['entry-path.mjs','corridor-path.mjs']){const path='module-a/immersive-hybrid-v1/src/'+file;const before=execFileSync('git',['show','1c811b5:'+path],{encoding:'utf8'});assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),before.replaceAll('\r\n','\n'));}
});
test('independent turn is continuous, horizontal, bounded, and exactly reversible',()=>{
 assert.deepEqual(sampleMuralTurn(0),sampleGallery(2));
 let previous=sampleMuralTurn(0);for(let i=1;i<=1000;i++){const p=sampleMuralTurn(i/1000);assert.equal(p.position[1],1.38);assert.equal(p.position[2],7.65);assert.equal(p.fov,48);assert.ok(p.position[0]>=3.549&&p.position[0]<=3.85);for(const f of ['position','target'])p[f].forEach((x,k)=>{assert.ok(Number.isFinite(x));assert.ok(Math.abs(x-previous[f][k])<.03);});assert.deepEqual(p,sampleMuralTurn(i/1000));previous=p;}
 for(const t of [0,1]){const a=sampleMuralTurn(t),b=sampleMuralTurn(t?1-1e-5:1e-5);assert.ok(Math.abs(a.position[0]-b.position[0])<1e-10);}
 assert.deepEqual(FIRST_MURAL.position,[4.865,1.55,4.8]);
});
test('handoff precedes rectification and reading controls appear last',()=>{
 assert.deepEqual(readingPhases(0),{handoff:0,rectify:0,ui:0});assert.deepEqual(readingPhases(1),{handoff:1,rectify:1,ui:1});
 for(let i=0;i<=1000;i++){const p=i/1000,ph=readingPhases(p);if(p<=.35)assert.equal(ph.rectify,0);if(p>.35)assert.equal(ph.handoff,1);if(p<=.82)assert.equal(ph.ui,0);}
});
test('state transitions reject concurrent and nonadjacent navigation, reverse five times',async()=>{
 let finish;const c=createMuralController({prepare:()=>Promise.resolve(),animateTurn:()=>new Promise(r=>finish=r),animateReading:()=>Promise.resolve()});
 assert.equal(await c.go('mural-reading'),false);const first=c.go('mural-look');assert.equal(c.busy,true);assert.equal(await c.go('mural-look'),false);await Promise.resolve();finish();await first;
 assert.equal(await c.go('mural-reading'),true);assert.equal(await c.go('corridor-2_5d'),false);assert.equal(await c.go('mural-look'),true);
 for(let i=0;i<5;i++){const reverse=c.go('corridor-2_5d');finish();await reverse;const forward=c.go('mural-look');await Promise.resolve();finish();await forward;}
 assert.equal(c.state,'mural-look');assert.equal(c.busy,false);
});
test('failed prepare or animation rolls back and releases input',async()=>{
 for(const stage of ['prepare','animateTurn','animateReading']){let rolled=0;const options={prepare:async()=>{},animateTurn:async()=>{},animateReading:async()=>{},rollback:()=>rolled++};options[stage]=async()=>{throw Error('injected failure');};const c=createMuralController(options);
  if(stage==='animateReading')await c.go('mural-look');await assert.rejects(()=>c.go(stage==='animateReading'?'mural-reading':'mural-look'),/injected/);assert.equal(c.state,'corridor-2_5d');assert.equal(c.busy,false);assert.equal(rolled,1);
 }
});
