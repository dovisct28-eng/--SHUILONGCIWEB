import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {V24_MURALS,muralGeometry} from '../src/v24-murals.mjs';
import {muralCorners} from '../src/mural-anchor.mjs';

test('five planning records preserve model locations and dimensions',async()=>{
 const model=JSON.parse(await readFile(new URL('../../../shuilong-temple/mural-locations.json',import.meta.url)));
 assert.equal(V24_MURALS.length,5);
 for(const [i,m] of V24_MURALS.entries()){
  assert.equal(m.id,model[i].id);assert.deepEqual(m.position,model[i].position);
  assert.equal(m.width,model[i].width);assert.equal(m.height,model[i].height);
 }
});
test('01 orientation agrees with existing compositor and 02 uses its own geometry',()=>{
 const a=muralGeometry(V24_MURALS[0]);
 for(const [i,p] of a.corners.entries())for(let j=0;j<3;j++)assert.ok(Math.abs(p[j]-muralCorners()[i][j])<1e-12);
 const b=muralGeometry(V24_MURALS[1]);
 assert.ok(Math.abs(b.normal[0]+1)<1e-12);
 assert.ok(Math.abs(b.corners[0][2]+14.8)<1e-12);
 assert.ok(Math.abs(b.corners[1][2]+8.7)<1e-12);
 assert.ok(Math.abs(6.1*1357/6000-1.3796)<.0001);
});
test('rear and left wall normals face into the hall',()=>{
 for(const i of [2,3])assert.ok(muralGeometry(V24_MURALS[i]).normal[2]>.999);
 assert.ok(muralGeometry(V24_MURALS[4]).normal[0]>.999);
 assert.equal(V24_MURALS[1].status,'candidate-not-implemented');
});
