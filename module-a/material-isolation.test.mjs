import test from 'node:test';
import assert from 'node:assert/strict';
import {muralMaterial} from './material-isolation.mjs';

test('each mural receives its own material while non-mural geometry keeps the palette', () => {
  const palette = {opacity: 1, clone() { return {...this}; }};
  const murals = Object.fromEntries(['01', '02', '03', '04', '05'].map(id => [id, muralMaterial(palette, `mural-${id}`)]));
  murals['05'].opacity = .2;
  assert.equal(murals['05'].opacity, .2);
  for (const id of ['01', '02', '03', '04']) assert.equal(murals[id].opacity, 1);
  murals['05'].opacity = 1;
  assert.equal(murals['05'].opacity, 1);
  assert.equal(muralMaterial(palette, 'roof'), palette);
});
