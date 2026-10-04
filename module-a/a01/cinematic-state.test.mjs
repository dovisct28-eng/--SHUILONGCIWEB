import test from 'node:test';import assert from 'node:assert/strict';
import {cinematicState,canvasFrame} from './cinematic-state.mjs';
test('cinematic, framing and environment windows are independent and reversible',()=>{
  assert.equal(cinematicState(.48,2.4).hero,0);assert.equal(cinematicState(.58,2.9).hero,1);
  assert.equal(cinematicState(1,6.2).environment,1);assert.equal(cinematicState(1,7.2).environment,0);
  assert.equal(cinematicState(1,6.4).center,0);assert.equal(cinematicState(1,7).center,1);
  for(const [w,h]of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
    for(const n of [0,.12,.18,.32,.45])assert.deepEqual(canvasFrame(w,h,cinematicState(n,n*5)),{width:w,height:h});
    let previous=canvasFrame(w,h,cinematicState(.48,2.4));
    for(let n=.481;n<.581;n+=.001){const current=canvasFrame(w,h,cinematicState(n,n*5));assert.ok(Math.abs(previous.width-current.width)<w*.009);assert.ok(Math.abs(previous.height-current.height)<h*.009);previous=current;}
    const stops=[0,.2,.48,.52,.58,1];assert.deepEqual(stops.map(n=>canvasFrame(w,h,cinematicState(n,n*5))),stops.toReversed().map(n=>canvasFrame(w,h,cinematicState(n,n*5))).toReversed());
    assert.deepEqual(canvasFrame(w,h,cinematicState(0,0,true)),canvasFrame(w,h,cinematicState(1,5,true)));
  }
});
