// Rebuild the shared GLB and the preview's offline copy from model-source.js.
// Three.js 0.180.0 is already bundled in the preview, so this adds no dependency.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.dirname(fileURLToPath(import.meta.url));
const previewPath = path.join(directory, '水龙祠-交互预览.html');
const preview = fs.readFileSync(previewPath, 'utf8');
const coreLiteral = preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)?.[1];
const moduleLine = preview.split('\n').find(line => line.startsWith('const moduleText='));
if (!coreLiteral || !moduleLine?.includes('".replaceAll(')) throw new Error('Bundled Three.js source not found');
const core = JSON.parse(coreLiteral);
const moduleSource = JSON.parse(moduleLine.slice('const moduleText='.length, moduleLine.lastIndexOf('".replaceAll(') + 1));
const url = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const T = await import(url(moduleSource.replaceAll('./three.core.js', url(core))));
const source = fs.readFileSync(path.join(directory, 'model-source.js'), 'utf8');
const root = new Function('T', `${source}\nreturn makeTemple(T);`)(T);
root.updateMatrixWorld(true);

const groups = root.children;
const gltf = {
  asset: { version: '2.0', generator: 'ShuilongTemple procedural reference model' },
  scene: 0, scenes: [{ nodes: groups.map((_, index) => index) }],
  nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [], images: [], samplers: [], textures: [],
};
const chunks = [];
let byteLength = 0, triangles = 0;
const palette = new Map();
function appendBuffer(bytes, target) {
  if (byteLength % 4) { const padding = Buffer.alloc(4 - byteLength % 4); chunks.push(padding); byteLength += padding.length; }
  const offset = byteLength;
  chunks.push(bytes);
  byteLength += bytes.length;
  gltf.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target });
  return gltf.bufferViews.length - 1;
}
function accessor(array, type, componentType, target, includeBounds = false) {
  const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const view = appendBuffer(bytes, target);
  const entry = { bufferView: view, componentType, count: array.length / ({ VEC3: 3, VEC2: 2 }[type] || 1), type };
  if (includeBounds) {
    entry.min = [Infinity, Infinity, Infinity]; entry.max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < array.length; i += 3) for (let c = 0; c < 3; c++) {
      entry.min[c] = Math.min(entry.min[c], array[i + c]);
      entry.max[c] = Math.max(entry.max[c], array[i + c]);
    }
  }
  gltf.accessors.push(entry);
  return gltf.accessors.length - 1;
}
const textureCache = new Map();
function texture(kind, channel) {
  const key = `${kind}-${channel}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const bytes = fs.readFileSync(path.join(directory, 'textures', `${key}.jpg`));
  const image = gltf.images.push({ bufferView: appendBuffer(bytes), mimeType: 'image/jpeg', name: key }) - 1;
  if (!gltf.samplers.length) gltf.samplers.push({ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 });
  const index = gltf.textures.push({ source: image, sampler: 0 }) - 1;
  textureCache.set(key, index);
  return index;
}
function worldUV(vertex, normal) {
  const ax = Math.abs(normal.x), ay = Math.abs(normal.y), az = Math.abs(normal.z);
  if (ay >= ax && ay >= az) return [vertex.x, vertex.z];
  if (ax >= az) return [vertex.z, vertex.y];
  return [vertex.x, vertex.y];
}
for (const group of groups) {
  const batches = new Map();
  for (const mesh of group.children) {
    if (!mesh.isMesh) continue;
    const material = mesh.material;
    const key = `${material.color.getHexString()}:${material.side}:${material.userData.texture || ''}`;
    if (!palette.has(key)) {
      palette.set(key, gltf.materials.length);
      const kind = material.userData.texture;
      gltf.materials.push({ pbrMetallicRoughness: {
        baseColorFactor: kind ? [1, 1, 1, 1] : [material.color.r, material.color.g, material.color.b, 1],
        metallicFactor: 0, roughnessFactor: material.roughness,
        ...(kind ? { baseColorTexture: { index: texture(kind, 'basecolor') }, metallicRoughnessTexture: { index: texture(kind, 'roughness') } } : {}),
      }, ...(kind ? { normalTexture: { index: texture(kind, 'normal'), scale: .18 }, extras: { fallbackColor: [material.color.r, material.color.g, material.color.b], textureKey: kind } } : {}), doubleSided: material.side === T.DoubleSide });
    }
    if (!batches.has(key)) batches.set(key, { positions: [], normals: [], uvs: [], colors: [], hasColors: false, indices: [] });
    const batch = batches.get(key), geometry = mesh.geometry;
    const base = batch.positions.length / 3;
    const positions = geometry.getAttribute('position'), normals = geometry.getAttribute('normal');
    if (!normals) geometry.computeVertexNormals();
    const actualNormals = geometry.getAttribute('normal');
    const colors = geometry.getAttribute('color');
    batch.hasColors ||= Boolean(colors);
    const normalMatrix = new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
    const vertex = new T.Vector3(), normal = new T.Vector3();
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
      normal.fromBufferAttribute(actualNormals, i).applyMatrix3(normalMatrix).normalize();
      batch.positions.push(vertex.x, vertex.y, vertex.z);
      batch.normals.push(normal.x, normal.y, normal.z);
      batch.colors.push(colors ? colors.getX(i) : 1, colors ? colors.getY(i) : 1, colors ? colors.getZ(i) : 1);
      if (material.userData.texture) {
        const scale = material.userData.texture === 'brick' ? 2 : 1;
        batch.uvs.push(...worldUV(vertex, normal).map(value => value * scale));
      }
    }
    if (geometry.index) for (let i = 0; i < geometry.index.count; i++) batch.indices.push(base + geometry.index.getX(i));
    else for (let i = 0; i < positions.count; i++) batch.indices.push(base + i);
  }
  const primitives = [];
  for (const [key, batch] of batches) {
    const position = accessor(new Float32Array(batch.positions), 'VEC3', 5126, 34962, true);
    const normal = accessor(new Float32Array(batch.normals), 'VEC3', 5126, 34962);
    const uv = batch.uvs.length ? accessor(new Float32Array(batch.uvs), 'VEC2', 5126, 34962) : null;
    const colorAttribute = batch.hasColors ? accessor(new Float32Array(batch.colors), 'VEC3', 5126, 34962) : null;
    const indices = accessor(new Uint32Array(batch.indices), 'SCALAR', 5125, 34963);
    triangles += batch.indices.length / 3;
    const color = key.split(':')[0];
    const role = group.userData.mural ? color === '668f8c' ? 'placeholder' : color === 'cda85d' ? 'border' : null : null;
    primitives.push({ attributes: { POSITION: position, NORMAL: normal, ...(uv !== null ? { TEXCOORD_0: uv } : {}), ...(colorAttribute !== null ? { COLOR_0: colorAttribute } : {}) }, indices, material: palette.get(key), mode: 4, ...(role ? { extras: { role } } : {}) });
  }
  const meshIndex = gltf.meshes.length;
  gltf.meshes.push({ primitives });
  gltf.nodes.push({ name: group.name, mesh: meshIndex, extras: group.userData.mural ? { mural: group.userData.mural } : {} });
}
gltf.buffers.push({ byteLength });
const binary = Buffer.concat(chunks);
const json = Buffer.from(JSON.stringify(gltf));
const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)]);
const header = Buffer.alloc(12); header.write('glTF'); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + paddedJson.length + 8 + paddedBinary.length, 8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(paddedJson.length); jsonHeader.write('JSON', 4);
const binaryHeader = Buffer.alloc(8); binaryHeader.writeUInt32LE(paddedBinary.length); binaryHeader.write('BIN\0', 4);
const output = Buffer.concat([header, jsonHeader, paddedJson, binaryHeader, paddedBinary]);
const expectedMurals = JSON.parse(fs.readFileSync(path.join(directory, 'mural-locations.json'), 'utf8'));
const builtMurals = gltf.nodes.filter(node => node.extras.mural).map(node => node.extras.mural);
if (JSON.stringify(expectedMurals) !== JSON.stringify(builtMurals)) throw new Error('Mural metadata differs from mural-locations.json');
if (!/atob\('[A-Za-z0-9+/=]+'\)/.test(preview)) throw new Error('Offline model copy not found');
let embedded = preview.replace(/atob\('[A-Za-z0-9+/=]+'\)/, `atob('${output.toString('base64')}')`);
for (const [name, file] of [['inlineA04', 'a04-scene.mjs'], ['inlineMarkers', 'narrative-markers.mjs'], ['inlineEnvironment', 'environment.mjs']]) {
  const expression = new RegExp(`const ${name}="(?:\\\\.|[^"\\\\])*";`);
  if (!expression.test(embedded)) throw new Error(`Offline module ${name} not found`);
  embedded = embedded.replace(expression, `const ${name}=${JSON.stringify(fs.readFileSync(path.join(directory, file), 'utf8'))};`);
}
fs.writeFileSync(path.join(directory, 'shuilong-temple.glb'), output);
fs.writeFileSync(previewPath, embedded);
fs.writeFileSync(path.join(directory, 'model-info.json'), `${JSON.stringify({ triangles, bytes: output.length, groups: groups.map(group => group.name) }, null, 2)}\n`);
console.log(`Built ${triangles} triangles, ${output.length} bytes; GLB and offline preview match.`);
