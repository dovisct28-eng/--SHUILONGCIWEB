import test from 'node:test';
import assert from 'node:assert/strict';
import {OBSERVATIONS_BY_MURAL, regionTransform, setImageSize, visibleRect} from './observations.mjs';

// Bounding boxes of the visible subjects in the 6000 × 1357 Web photograph.
// Values are left, top, right, and bottom, normalized to the full image.
const subjects = {
  'upper-carriages': [.74, .14, .932, .355],
  'upper-flags': [.496, .065, .63, .34],
  'riders-and-fans': [.369, .40, .544, .606],
  'cloud-bands': [.268, .35, .427, .756],
  'lower-procession': [.152, .64, .313, .964],
  'temple-and-table': [.001, .585, .151, .997],
};

test('second mural preserves its original stops and orders six distinct subjects from right to left', () => {
  const regions = OBSERVATIONS_BY_MURAL['mural-02'];
  assert.deepEqual(regions.map(region => region.id), Object.keys(subjects));
  assert.deepEqual(regions.map(region => region.number), ['01', '02', '03', '04', '05', '06']);
  for (const [index, region] of regions.entries()) {
    assert.ok(region.title && region.copy);
    assert.ok(region.zoom > 1 && region.zoom <= 4);
    if (index) assert.ok(region.center[0] < regions[index - 1].center[0]);
  }
});

test('all six subjects fit inside the zoomed detail viewport at the desktop layouts', () => {
  const width = 6000;
  const height = 1357;
  setImageSize(width, height);
  const viewports = [{width: 900, height: 447}, {width: 950, height: 510}, {width: 1350, height: 700}];
  for (const viewport of viewports) {
    for (const region of OBSERVATIONS_BY_MURAL['mural-02']) {
      const {x, y, width: w, height: h} = visibleRect(regionTransform(region, viewport), viewport);
      const [left, top, right, bottom] = subjects[region.id];
      assert.ok(x <= left * width && x + w >= right * width, region.title);
      assert.ok(y <= top * height && y + h >= bottom * height, region.title);
    }
  }
});
