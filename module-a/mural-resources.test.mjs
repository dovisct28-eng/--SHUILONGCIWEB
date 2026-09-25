import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MURAL_RESOURCES, MODEL_DISPLAY_BOUNDS, fitMuralImage } from './mural-resources.mjs';
import { mapMuralProjection } from './guide/progress.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const locations = JSON.parse(fs.readFileSync(path.join(root, 'shuilong-temple/mural-locations.json'), 'utf8'));

test('display resources map only murals 01, 02, and 05 to existing display files', () => {
  assert.deepEqual(Object.keys(MURAL_RESOURCES), locations.map(mural => mural.id));
  for (const id of ['mural-01', 'mural-02', 'mural-05']) {
    const resource = MURAL_RESOURCES[id];
    assert.equal(path.basename(fileURLToPath(resource.display)), `${id}-display.webp`);
    assert.ok(fs.existsSync(fileURLToPath(resource.display)), `${id} display exists`);
    assert.equal(resource.detail, null);
  }
  for (const id of ['mural-03', 'mural-04']) {
    assert.equal(MURAL_RESOURCES[id].display, null);
    assert.equal(MURAL_RESOURCES[id].detail, null);
  }
  assert.ok(Object.values(MURAL_RESOURCES).every(resource => !resource.display || !resource.display.includes('detail')));
});

test('display plane dimensions preserve image ratio and fit entirely within mural bounds', () => {
  for (const mural of locations) {
    const fitted = fitMuralImage(mural, 1.8);
    assert.ok(fitted.width <= mural.width + 1e-10);
    assert.ok(fitted.height <= mural.height + 1e-10);
    assert.ok(Math.abs(fitted.width / fitted.height - 1.8) < 1e-10);
  }
  assert.throws(() => fitMuralImage(locations[0], 0), TypeError);
});

test('model display limits can enlarge images without changing location metadata', () => {
  for (const id of ['mural-01', 'mural-02', 'mural-05']) {
    const mural = locations.find(entry => entry.id === id);
    const ratio = { 'mural-01': 2.91, 'mural-02': 4.42, 'mural-05': 3.71 }[id];
    const original = fitMuralImage(mural, ratio);
    const enlarged = fitMuralImage(mural, ratio, MODEL_DISPLAY_BOUNDS[id]);
    assert.ok(enlarged.width > original.width);
    assert.ok(enlarged.width <= MODEL_DISPLAY_BOUNDS[id].maxWidth);
    assert.ok(enlarged.height <= MODEL_DISPLAY_BOUNDS[id].maxHeight);
    assert.ok(Math.abs(enlarged.width / enlarged.height - ratio) < 1e-10);
  }
});

test('iframe mural projections map through the scaled model frame into stage coordinates', () => {
  assert.deepEqual(mapMuralProjection(
    { left: 200, top: 100, width: 400, height: 120 },
    { left: 320, top: 140, width: 800, height: 600 },
    1000, 750,
    { left: 20, top: 40 },
  ), { left: 460, top: 180, width: 320, height: 96 });
  assert.equal(mapMuralProjection(null, {}, 100, 100, {}), null);
});

test('the model runtime uses the shared display mapping and keeps image textures out of GLB generation', () => {
  const runtime = fs.readFileSync(path.join(root, 'shuilong-temple/水龙祠-交互预览.html'), 'utf8');
  const builder = fs.readFileSync(path.join(root, 'shuilong-temple/build-model.mjs'), 'utf8');
  assert.match(runtime, /MURAL_RESOURCES, MODEL_DISPLAY_BOUNDS, fitMuralImage/);
  assert.match(runtime, /new T\.TextureLoader\(\)/);
  assert.match(runtime, /group\.userData\.mural=node\.extras\?\.mural/);
  assert.match(runtime, /syncMuralTextures\(\);resolve\(false\)/);
  assert.doesNotMatch(builder, /display\.webp|TextureLoader|images:/);
});
