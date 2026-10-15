import test from 'node:test';
import assert from 'node:assert/strict';
import {gestureState,events} from '../motion-graphics/gesture-v3-state.ts';
test('all three actions finish dwell before feedback; release precedes next approach',()=>{
 for(const [i,e] of events.entries()){
  assert.equal(gestureState(e.at-31).progress,0);
  assert.equal(gestureState(e.at-30).progress,0);
  assert.ok(gestureState(e.at-1).progress<1);
  assert.equal(gestureState(e.at).progress,1);
  assert.equal(gestureState(e.at).confirmed,true);
  assert.equal(gestureState(e.release+12).lock,0);
  if(i<events.length-1)assert.ok(e.release+12<events[i+1].at-60);
 }
});
test('OPEN and CLOSE interpolate without boolean geometry jumps, arbitrary seeks deterministic',()=>{
 for(let f=1;f<1110;f++){
  const a=gestureState(f-1),b=gestureState(f);
  assert.ok(Math.abs(a.figureLeft-b.figureLeft)<23,`left jump ${f}`);
  assert.ok(Math.abs(a.figureWidth-b.figureWidth)<8,`width jump ${f}`);
  assert.ok(Math.abs(a.handX-b.handX)<20,`hand jump ${f}`);
  assert.ok(b.figureLeft>=180&&b.figureLeft+b.figureWidth<=1220);
 }
 assert.equal(gestureState(750).expand,0);
 assert.equal(gestureState(774).expand,1);
 assert.equal(gestureState(1020).expand,1);
 assert.equal(gestureState(1044).expand,0);
 assert.deepEqual(gestureState(774),gestureState(774));
});
test('single hand cursor remains continuous when targets change',()=>{
 for(let f=1;f<1110;f++){
  const a=gestureState(f-1),b=gestureState(f);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<100,`cursor discontinuity ${f}`);
 }
});
