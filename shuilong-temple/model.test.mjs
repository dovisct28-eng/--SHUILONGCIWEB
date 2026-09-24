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
function points(group, material) {
  const node = doc.nodes.find(n => n.name === group);
  return doc.meshes[node.mesh].primitives.filter(p => p.material === material).flatMap(primitive => {
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
test('five mural IDs and wall positions remain unchanged', () => {
  const nodes = doc.nodes.filter(node => node.extras?.mural);
  assert.deepEqual(nodes.map(node => node.extras.mural), murals);
});
test('first mural wall is free of enclosure pilasters and gallery columns', () => {
  const [x, y, z] = murals[0].position;
  const zMin = z - murals[0].width / 2, zMax = z + murals[0].width / 2;
  const yMin = y - murals[0].height / 2, yMax = y + murals[0].height / 2;
  const enclosureTrim = points('02_Enclosure', 3);
  assert.ok(enclosureTrim.length > 0);
  assert.equal(enclosureTrim.filter(p => p[0] > x - .1 && p[0] < x + .35 && p[1] >= yMin && p[1] <= yMax && p[2] >= zMin && p[2] <= zMax).length, 0);
  const galleryWood = points('05_EastGallery', 4);
  assert.ok(galleryWood.length > 0);
  assert.equal(galleryWood.filter(p => p[0] > 2.9 && p[0] < 3.6 && p[1] <= yMax && p[2] >= zMin && p[2] <= zMax).length, 0);
});
test('main hall and gallery structures are still symmetric and reduced', () => {
  assert.ok(points('03_MainHall', 4).length > 0);
  assert.equal(points('04_WestGallery', 4).length, points('05_EastGallery', 4).length);
  assert.ok(info.triangles < 86275);
});
