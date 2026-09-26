import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const binary = fs.readFileSync(path.join(directory, 'shuilong-temple.glb'));
const jsonLength = binary.readUInt32LE(12);
const doc = JSON.parse(binary.subarray(20, 20 + jsonLength));
const dataStart = 28 + jsonLength;
const info = JSON.parse(fs.readFileSync(path.join(directory, 'model-info.json'), 'utf8'));
const murals = JSON.parse(fs.readFileSync(path.join(directory, 'mural-locations.json'), 'utf8'));
const preview = fs.readFileSync(path.join(directory, '水龙祠-交互预览.html'), 'utf8');
function points(group, textureKey) {
  const node = doc.nodes.find(n => n.name === group);
  return doc.meshes[node.mesh].primitives.filter(p => doc.materials[p.material].extras?.textureKey === textureKey).flatMap(primitive => {
    const accessor = doc.accessors[primitive.attributes.POSITION];
    const view = doc.bufferViews[accessor.bufferView];
    const offset = dataStart + view.byteOffset + (accessor.byteOffset || 0);
    return Array.from({ length: accessor.count }, (_, i) => [0, 1, 2].map(j => binary.readFloatLE(offset + (i * 3 + j) * 4)));
  });
}
test('GLB, model statistics, and offline preview are the same shared model', () => {
  assert.equal(binary.subarray(0, 4).toString(), 'glTF');
  assert.equal(binary.readUInt32LE(8), binary.length);
  assert.equal(info.bytes, binary.length);
  assert.deepEqual(info.groups, doc.nodes.map(n => n.name));
  const count = doc.meshes.flatMap(mesh => mesh.primitives).reduce((sum, p) => sum + doc.accessors[p.indices].count / 3, 0);
  assert.equal(info.triangles, count);
  const inline = preview.match(/atob\('([A-Za-z0-9+/=]+)'\)/)?.[1];
  assert.ok(inline);
  assert.ok(Buffer.from(inline, 'base64').equals(binary));
  for (const [name, file] of [['inlineA04', 'a04-scene.mjs'], ['inlineMarkers', 'narrative-markers.mjs']]) {
    const literal = preview.match(new RegExp(`const ${name}=("(?:\\\\.|[^"\\\\])*");`))?.[1];
    assert.ok(literal, `${name} embedded module`);
    assert.equal(JSON.parse(literal), fs.readFileSync(path.join(directory, file), 'utf8'));
  }
});
test('five stable mural IDs and all duplicated metadata agree', () => {
  const nodes = doc.nodes.filter(node => node.extras?.mural);
  assert.deepEqual(nodes.map(node => node.extras.mural), murals);
  assert.deepEqual(murals.map(m => m.id), ['mural-01', 'mural-02', 'mural-03', 'mural-04', 'mural-05']);
  assert.ok(!murals.some(m => m.id === 'mural-06'));
  for (const node of nodes) assert.deepEqual(doc.meshes[node.mesh].primitives.map(p => p.extras?.role), ['placeholder', 'border']);
});
test('first mural wall is free of enclosure pilasters and gallery columns', () => {
  const [x, y, z] = murals[0].position;
  const zMin = z - murals[0].width / 2, zMax = z + murals[0].width / 2;
  const yMin = y - murals[0].height / 2, yMax = y + murals[0].height / 2;
  const enclosureTrim = points('02_Enclosure', 'plaster');
  assert.ok(enclosureTrim.length > 0);
  assert.equal(enclosureTrim.filter(p => p[0] > x - .1 && p[0] < x + .35 && p[1] >= yMin && p[1] <= yMax && p[2] >= zMin && p[2] <= zMax).length, 0);
  const galleryWood = points('05_EastGallery', 'wood');
  assert.ok(galleryWood.length > 0);
  assert.equal(galleryWood.filter(p => p[0] > 2.9 && p[0] < 3.6 && p[1] <= yMax && p[2] >= zMin && p[2] <= zMax).length, 0);
});
test('mural spans and wall bands reflect the design model, not surveyed dimensions', () => {
  const byId = Object.fromEntries(murals.map(m => [m.id, m]));
  assert.ok(byId['mural-01'].width / 19.4 < .25);
  for (const id of ['mural-02', 'mural-05']) {
    const mural = byId[id];
    assert.ok(mural.width / 6.6 > .9 && mural.width / 6.6 < 1);
    assert.ok(mural.position[1] + mural.height / 2 < 2.71);
    assert.ok(mural.position[1] - mural.height / 2 > .99);
  }
  assert.ok(points('03_MainHall', 'brick').length > 0);
  assert.equal(points('04_WestGallery', 'wood').length, points('05_EastGallery', 'wood').length);
  assert.ok(points('05_EastGallery', 'wood').some(p => p[0] > 4.8 && p[0] < 4.9 && p[1] > 2.5 && p[1] < 2.7 && p[2] > 2.3 && p[2] < 2.5), 'gallery transverse beam flanks the first mural');
  assert.ok(points('07_Entrance', 'brick').length > 0);
  assert.ok(info.triangles < 150000);
});

test('GLB exports valid UV and embedded PBR texture chains', () => {
  assert.ok(doc.images.length >= 6);
  assert.equal(doc.images.length, doc.textures.length);
  assert.equal(doc.samplers.length, 1);
  for (const image of doc.images) {
    assert.equal(image.mimeType, 'image/jpeg');
    const view = doc.bufferViews[image.bufferView];
    assert.ok(view.byteLength > 100);
    assert.ok(dataStart + view.byteOffset + view.byteLength <= binary.length);
    assert.equal(binary.subarray(dataStart + view.byteOffset, dataStart + view.byteOffset + 3).toString('hex'), 'ffd8ff');
  }
  for (const mesh of doc.meshes) for (const primitive of mesh.primitives) {
    assert.ok(primitive.attributes.POSITION !== undefined);
    assert.ok(primitive.attributes.NORMAL !== undefined);
    const material = doc.materials[primitive.material];
    if (material.pbrMetallicRoughness.baseColorTexture) {
      assert.ok(primitive.attributes.TEXCOORD_0 !== undefined);
      assert.ok(material.pbrMetallicRoughness.metallicRoughnessTexture);
      assert.ok(material.normalTexture);
    }
  }
});

function readAccessor(id) {
  const accessor = doc.accessors[id], view = doc.bufferViews[accessor.bufferView];
  const offset = dataStart + view.byteOffset + (accessor.byteOffset || 0);
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3 }[accessor.type];
  return Array.from({ length: accessor.count }, (_, i) => Array.from({ length: components }, (_, j) =>
    binary[accessor.componentType === 5126 ? 'readFloatLE' : 'readUInt32LE'](offset + (i * components + j) * 4)));
}

test('closed perimeter wall faces are exterior brick and interior plaster in the exported GLB', () => {
  function faceMaterials(group, axis, coordinate, sample = null) {
    const node = doc.nodes.find(n => n.name === group), keys = [];
    for (const primitive of doc.meshes[node.mesh].primitives) {
      const key = doc.materials[primitive.material].extras?.textureKey;
      if (!['brick', 'plaster'].includes(key)) continue;
      const points = readAccessor(primitive.attributes.POSITION), indices = readAccessor(primitive.indices).flat();
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = indices.slice(i, i + 3).map(index => points[index]);
        if (!triangle.every(point => Math.abs(point[axis] - coordinate) < .0001)) continue;
        if (sample) {
          const axes = [0, 1, 2].filter(value => value !== axis), [u, v] = axes;
          const sides = triangle.map((a, j) => { const b = triangle[(j + 1) % 3]; return (b[u] - a[u]) * (sample[1] - a[v]) - (b[v] - a[v]) * (sample[0] - a[u]); });
          if (!sides.every(value => value >= -.00001) && !sides.every(value => value <= .00001)) continue;
        }
        keys.push(key);
      }
    }
    assert.ok(keys.length, `${group} has a face at ${coordinate}`);
    return new Set(keys);
  }
  for (const sign of [-1, 1]) {
    assert.deepEqual(faceMaterials('02_Enclosure', 0, sign * 5.11), new Set(['brick']));
    assert.deepEqual(faceMaterials('02_Enclosure', 0, sign * 4.89), new Set(['plaster']));
    assert.deepEqual(faceMaterials('02_Enclosure', 0, sign * 5.17), new Set(['brick']));
    assert.deepEqual(faceMaterials('02_Enclosure', 0, sign * 4.83), new Set(['plaster']));
  }
  assert.deepEqual(faceMaterials('02_Enclosure', 2, -15.425), new Set(['brick']));
  assert.deepEqual(faceMaterials('02_Enclosure', 2, -15.175), new Set(['plaster']));
  assert.deepEqual(faceMaterials('07_Entrance', 2, 12.16), new Set(['brick']));
  assert.deepEqual(faceMaterials('07_Entrance', 2, 11.7), new Set(['plaster']));
  for (const [x, y] of [[-3.25, 1.7], [0, 2], [3.25, 1.7]]) {
    assert.deepEqual(faceMaterials('07_Entrance', 2, 11.7, [x, y]), new Set(['plaster']), 'arch infill is closed and plastered from inside');
    assert.deepEqual(faceMaterials('07_Entrance', 2, 12.12, [x, y]), new Set(['brick']), 'arch infill is brick from outside');
  }
  // Main hall interior keeps the documented upper/lower brick bands around plaster.
  for (const sign of [-1, 1]) {
    assert.deepEqual(faceMaterials('03_MainHall', 0, sign * 4.76), new Set(['brick']));
    assert.deepEqual(faceMaterials('03_MainHall', 0, sign * 4.54), new Set(['brick', 'plaster']));
  }
});

test('interior plaster has a subtle height gradient, with COLOR_0 preserved for both previews', () => {
  let colored = 0;
  for (const mesh of doc.meshes) for (const primitive of mesh.primitives) {
    if (primitive.attributes.COLOR_0 === undefined) continue;
    colored++;
    assert.equal(doc.materials[primitive.material].extras.textureKey, 'plaster');
    const positions = readAccessor(primitive.attributes.POSITION), colors = readAccessor(primitive.attributes.COLOR_0);
    assert.equal(colors.length, positions.length);
    for (let i = 0; i < colors.length; i++) {
      const expected = .88 + .12 * Math.min(1, Math.max(0, positions[i][1] / 2));
      for (const value of colors[i]) assert.ok(Math.abs(value - expected) < .00001);
    }
  }
  assert.ok(colored >= 3);
  assert.ok(preview.includes("g.setAttribute('color',new T.BufferAttribute(attr(p.attributes.COLOR_0),3))"));
});
