import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSourceLineEndings as normalize } from './source-equivalence.mjs';

test('source comparison tolerates CRLF and mixed line endings only', () => {
  assert.equal(normalize('a\r\nb\nc\r\n'), 'a\nb\nc\n');
  for (const changed of ['a\nb = 2;\n', 'a\n b\n', 'a\nb', 'a\rb\n']) {
    assert.notEqual(normalize(changed), normalize('a\r\nb\r\n'));
  }
});
