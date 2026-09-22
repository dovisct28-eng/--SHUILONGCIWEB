import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveA02State, CORE_MURALS, A02_START, A02_SCREENS } from './progress.mjs';
import { layoutLabels } from '../../shuilong-temple/narrative-markers.mjs';

test('A01, return to center and spatial settling never display mural markers', () => {
  for (const height of [768, 900, 1024, 1080]) {
    for (const screens of [0, 3, 5, 6.2, 6.7, 7.2, 7.8]) {
      assert.equal(deriveA02State(screens * height, height).markers, 0);
    }
  }
});

test('all five appear before simultaneous core emphasis, followed by stable reading', () => {
  const at = screens => deriveA02State((A02_START + screens) * 1000, 1000);
  assert.equal(at(2.4).markers, 1);
  assert.equal(at(2.4).emphasis, 0);
  assert.equal(at(3).markers, 1);
  assert.ok(at(3).emphasis > 0 && at(3).emphasis < 1);
  for (const screens of [3.4, 3.7, A02_SCREENS]) {
    assert.equal(at(screens).emphasis, 1);
    assert.equal(at(screens).phase, 'a02-reading');
  }
  const nodes = JSON.parse(readFileSync(new URL('../../shuilong-temple/mural-locations.json', import.meta.url)));
  assert.equal(nodes.length, 5);
  assert.ok(CORE_MURALS.every(id => nodes.some(n => n.id === id)));
  assert.deepEqual(CORE_MURALS, ['mural-01', 'mural-02', 'mural-05']);
});

test('forward and reverse traversal produce identical complete states', () => {
  const stops = [0, 6200, 6700, 7200, 8000, 8500, 9200, 9600, 10200];
  const forward = stops.map(y => deriveA02State(y, 1000));
  assert.deepEqual(stops.toReversed().map(y => deriveA02State(y, 1000)).reverse(), forward);
});

test('crowded projected nodes remain ordered, separated and inside the label rails', () => {
  for (const [w, h] of [[798, 645], [1000, 756], [1000, 820], [450, 400]]) {
    const points = Array.from({length:5}, (_, i) => ({id:`mural-0${i+1}`,x:w*.6,y:h-40+i}));
    const labels = layoutLabels(points, w, h);
    for (let i = 0; i < labels.length; i++) {
      assert.equal(labels[i].x, points[i].x);
      assert.ok(labels[i].ly >= 64 && labels[i].ly <= h-64);
      if (i) assert.ok(labels[i].ly - labels[i-1].ly >= 48);
    }
  }
});
