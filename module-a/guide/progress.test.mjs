import test from 'node:test';
import assert from 'node:assert/strict';
import {guideProgress, horizontalPlacement, muralTransfer} from './progress.mjs';

test('A05 follows the unchanged A04 endpoint and has a stable reading interval', () => {
  assert.equal(guideProgress(18, 18, 25).active, true);
  assert.equal(guideProgress(18.8, 18, 25).entry, 1);
  assert.equal(guideProgress(19.2, 18, 25).introduction, 1);
  assert.equal(guideProgress(20.2, 18, 25).scan, 0);
  assert.equal(guideProgress(24.4, 18, 25).scan, 1);
  assert.equal(guideProgress(25, 18, 25).handoff, 1);
});

test('the same scroll position restores the same viewing position in either direction', () => {
  for (const screens of [20.2, 21.1, 22.3, 23.8, 24.4]) {
    const progress = guideProgress(screens, 18, 25).scan;
    const {x, travel} = horizontalPlacement(2600, 1440, progress);
    assert.equal(travel, 1160);
    assert.ok(Math.abs(x + 1160 * (1 - progress)) < 1e-9);
  }
  assert.deepEqual(horizontalPlacement(2600, 1440, 0), {travel:1160, x:-1160});
  assert.deepEqual(horizontalPlacement(2600, 1440, 1), {travel:1160, x:0});
});

test('an image already narrower than the viewport remains centered without invented travel', () => {
  assert.deepEqual(horizontalPlacement(1000, 1440, 0.5), {travel:0, x:220});
});
test('mural image grows from the projected wall to its formal right-edge placement',()=>{
  const wall={left:400,top:200,width:500,height:300};
  const from=muralTransfer(17.4,wall,1440,900,3,720);
  const end=muralTransfer(18,wall,1440,900,3,720);
  assert.deepEqual([from.left,from.top,from.width,from.height],[400,266.6666666666667,500,166.66666666666666]);
  assert.equal(from.width/from.height,3);
  assert.equal(end.left+end.width,1440);assert.equal(end.height,720);
  assert.equal(end.imageOpacity,1);assert.equal(end.backgroundOpacity,1);
});
