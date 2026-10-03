import test from 'node:test';
import assert from 'node:assert/strict';
import {inkPalette,contrastRatio} from './ink-scene.mjs';
import {deriveHeroWeight} from '../../shuilong-temple/a01-art-direction.mjs';
test('ink palette restores shared paper and readable text through the original handoff',()=>{
  assert.deepEqual(inkPalette(5),inkPalette(6.19));
  assert.deepEqual(inkPalette(7.2),{weight:0,paper:'#f2eee4',ink:'#343833',secondary:'#62675f'});
  for(let screens=0;screens<14;screens+=.005){const palette=inkPalette(screens);
    assert.equal(palette.weight,deriveHeroWeight(screens));
    assert.ok(contrastRatio(palette.ink,palette.paper)>=4.5);
    assert.ok(contrastRatio(palette.secondary,palette.paper)>=4.5);
    inkPalette(20);assert.deepEqual(inkPalette(screens),palette);
  }
  assert.deepEqual(inkPalette(NaN),inkPalette(0));
});
