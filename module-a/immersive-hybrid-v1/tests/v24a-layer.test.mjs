import test from 'node:test';import assert from 'node:assert/strict';
import {v24aWeights} from '../src/v24a-layer.mjs';
import {sampleGallery} from '../src/corridor-path.mjs';
import {sampleMuralTurn} from '../src/mural-transition-controller.mjs';
test('generated layers begin after the gate and blend continuously along one reversible rail',()=>{
 assert.equal(v24aWeights(sampleGallery(1)).handoff,0);
 let old=v24aWeights(sampleGallery(1));for(let i=1;i<=500;i++){const now=v24aWeights(sampleGallery(1+i/500));assert.ok(now.weights.every(x=>x>=0&&x<=1));assert.ok(Math.abs(now.weights.reduce((a,b)=>a+b)-1)<1e-12);assert.ok(Math.abs(now.handoff-old.handoff)<.03);assert.deepEqual(now,v24aWeights(sampleGallery(1+i/500)));old=now;}
 const look=v24aWeights(sampleMuralTurn(1));assert.ok(look.weights[2]>.9);assert.equal(look.handoff,1);
});
