import test from 'node:test';
import assert from 'node:assert/strict';
import {inkPalette,contrastRatio} from './ink-scene.mjs';
import {deriveSharedWorldState} from '../../shuilong-temple/shared-world.mjs';
test('shared valley continues through A02/A03 while information remains readable',()=>{
  assert.deepEqual(inkPalette(5),inkPalette(6.19));
  assert.deepEqual(inkPalette(7.2),{weight:deriveSharedWorldState(7.2).mountains,paper:'#171b1d',ink:'#d8d2c5',secondary:'#a0a39c'});
  for(let screens=0;screens<14;screens+=.005){const palette=inkPalette(screens);
    assert.equal(palette.weight,deriveSharedWorldState(screens).mountains);
    assert.ok(contrastRatio(palette.ink,palette.paper)>=4.5);
    assert.ok(contrastRatio(palette.secondary,palette.paper)>=4.5);
    inkPalette(20);assert.deepEqual(inkPalette(screens),palette);
  }
  assert.deepEqual(inkPalette(NaN),inkPalette(0));
});
