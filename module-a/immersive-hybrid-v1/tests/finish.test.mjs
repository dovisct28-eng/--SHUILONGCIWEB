import test from 'node:test';
import assert from 'node:assert/strict';
import {finishWeights,FINISH_DEFAULTS} from '../src/corridor-finish.mjs';
test('finish never leaks through loading, old mode or pre-corridor manual blend',()=>{
 for(const t of [0,1,1.43,1.6])assert.equal(finishWeights(t,1,'hybrid'),0);
 for(const mode of ['original','legacy'])for(const t of [1.61,1.8,2])assert.equal(finishWeights(t,1,mode),0);
 assert.equal(finishWeights(2,1,'hybrid',false),0);
 assert.deepEqual(Object.keys(FINISH_DEFAULTS),['wall','floor','wood','lighting']);
});
test('automatic finish is bounded, continuous, monotone and exactly reversible',()=>{
 let prior=0;for(let i=0;i<=2000;i++){const t=i/1000,w=finishWeights(t,null,'hybrid');assert.ok(w>=prior&&w<=1);assert.ok(w-prior<.005);assert.ok(Math.abs(w-finishWeights(2-(2000-i)/1000,null,'hybrid'))<1e-12);prior=w;}
 assert.equal(finishWeights(2,null,'hybrid'),1);assert.equal(finishWeights(1.8,.5,'hybrid'),.5);
});
