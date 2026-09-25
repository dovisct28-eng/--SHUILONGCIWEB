import test from 'node:test';
import assert from 'node:assert/strict';
import { a08Progress } from './progress.mjs';

test('A08 enters after the A07 left edge and reverses by scroll position', () => {
  assert.deepEqual(a08Progress(39.9), { active: false, opacity: 0 });
  assert.deepEqual(a08Progress(40), { active: true, opacity: 0 });
  assert.ok(a08Progress(40.5).opacity > 0);
  assert.deepEqual(a08Progress(41), { active: true, opacity: 1 });
  assert.deepEqual(a08Progress(42), { active: true, opacity: 1 });
});
