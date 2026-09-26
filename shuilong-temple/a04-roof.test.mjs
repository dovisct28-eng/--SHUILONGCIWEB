import test from 'node:test';
import assert from 'node:assert/strict';
import { createA04Scene } from './a04-scene.mjs';

test('opaque roofs regain depth writing after a transparent A04 transition', () => {
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => ({ style: {} }), body: { append() {} } };
  class Vector3 { constructor(x, y, z) { Object.assign(this, { x, y, z }); } }
  class Group { add() {} }
  class Box3 { constructor(min, max) { Object.assign(this, { min, max }); } }
  const T = { Vector3, Group, Box3, LineBasicMaterial: class {} };
  const camera = { position: { fromArray() {} }, lookAt() {}, updateMatrixWorld() {} };
  const roof = { material: { opacity: 1, transparent: false, depthWrite: true } };
  try {
    const controller = createA04Scene(T, camera, { add() {} }, {}, [roof], []);
    for (const opacity of [1, .12, 0, 1]) {
      controller.set({ paths: [], camera: { position: [0, 0, 0], target: [0, 0, 0] }, roofOpacity: opacity });
      assert.equal(controller.apply(), true);
      assert.equal(roof.material.opacity, opacity);
      assert.equal(roof.material.depthWrite, opacity === 1);
      assert.equal(roof.material.transparent, opacity < 1);
    }
  } finally { globalThis.document = previousDocument; }
});
