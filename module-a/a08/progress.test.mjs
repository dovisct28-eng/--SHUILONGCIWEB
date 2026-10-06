import test from 'node:test';
import assert from 'node:assert/strict';
import {a08Progress} from './progress.mjs';
test('A08 type waits for the wall and enters chapter/title/body/CTA in order',()=>{
  assert.equal(a08Progress(39.9).active,false);
  for(const p of [40,40.3,40.5,40.65]) assert.equal(a08Progress(p).opacity,0);
  for(let p=40.65;p<=42;p+=.01){
    const s=a08Progress(p);
    assert.ok(s.chapter>=s.title&&s.title>=s.body&&s.body>=s.cta);
    assert.deepEqual(s,a08Progress(p));
  }
  for(const p of [41.23,42])for(const role of ['opacity','chapter','title','body','cta'])assert.equal(a08Progress(p)[role],1);
});
