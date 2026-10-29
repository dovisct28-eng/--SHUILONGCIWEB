import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,statSync} from 'node:fs';
import {b2Weights,b2MuralVisibility} from '../src/v24b2-layer.mjs';import {sampleGallery} from '../src/corridor-path.mjs';import {sampleMuralTurn} from '../src/mural-transition-controller.mjs';import {sampleMuralFront} from '../src/mural-front.mjs';
const assets=new URL('../assets/combined-b-transition/',import.meta.url);
test('Combined B projection clocks are continuous and reversible on the rail',()=>{
 assert.equal(b2Weights(sampleGallery(1)).gain,0);let previous=b2Weights(sampleGallery(1));
 for(let i=1;i<=1000;i++){const pose=sampleGallery(1+i/1000),w=b2Weights(pose);assert.ok(w.gain>=0&&w.gain<=1);assert.ok(w.weights.every(v=>v>=0&&v<=1));assert.ok(Math.abs(w.weights.reduce((a,b)=>a+b)-1)<1e-9);assert.ok(Math.abs(w.gain-previous.gain)<.01);assert.ok(w.weights.every((v,j)=>Math.abs(v-previous.weights[j])<.01));assert.deepEqual(w,b2Weights(pose));previous=w;}
 assert.ok(b2Weights(sampleGallery(1.8)).gain>.99);assert.ok(b2Weights(sampleMuralTurn(1)).gain<.04);assert.equal(b2Weights(sampleMuralFront(1)).gain,0);
});
test('authentic mural discovery fades in smoothly and reverses on the same rail',()=>{assert.equal(b2MuralVisibility(1.59),0);assert.equal(b2MuralVisibility(1.75),1);let last=0;for(let i=0;i<=1000;i++){const t=1.59+.16*i/1000,x=b2MuralVisibility(t);assert.ok(x>=last&&x<=1);assert.ok(x-last<.01);assert.equal(x,b2MuralVisibility(t));last=x;}});
test('all four projection images, masks and camera matrices match the Combined B rail',()=>{
 const manifest=JSON.parse(readFileSync(new URL('references/camera-manifest.json',assets)));const names=['gate-interior','stage-turn','corridor-advance','mural-approach'],times=[1,1.43,1.8,2];
 names.forEach((name,i)=>{const c=manifest.results.find(v=>v.name===name);assert.deepEqual(c.pose,sampleGallery(times[i]));assert.deepEqual(c.viewport,[1920,1080]);assert.equal(c.projection.length,16);assert.equal(c.cameraMatrix.length,16);assert.ok(c.projection.every(Number.isFinite)&&c.cameraMatrix.every(Number.isFinite));for(const file of [`prepared/${name}.webp`,`prepared/${name}-valid-rg.png`,`references/${name}-foreground-depth-2.8.png`,`references/${name}-regions.png`])assert.ok(statSync(new URL(file,assets)).size>100);});
});
