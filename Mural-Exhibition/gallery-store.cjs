const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'];
const validPosition = p => p && ((p.x === null && p.y === null) || (typeof p.x === 'number' && typeof p.y === 'number' && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100));
const revision = data => crypto.createHash('sha256').update(data).digest('hex');
function scanAssets(root) {
 const data = [], diagnostics = [];
 if (!fs.existsSync(root)) return { data, diagnostics };
 for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
  const folderName = entry.name, dir = path.join(root, folderName), metaPath = path.join(dir, 'meta.json');
  if (!/^\d+_/.test(folderName) && !fs.existsSync(metaPath)) continue;
  try {
   const hasMeta = fs.existsSync(metaPath);
   if (hasMeta && fs.lstatSync(metaPath).isSymbolicLink()) throw Error('meta.json 不允许符号链接');
   const raw = hasMeta ? fs.readFileSync(metaPath, 'utf8') : '';
   const fallbackId = folderName.split('_')[0];
   const meta = hasMeta ? JSON.parse(raw) : { id: fallbackId, name: folderName.replace(/^\d+_/, ''), order: Number(fallbackId), category: '', position: { x: null, y: null }, sources: [] };
   if (!/^[A-Za-z0-9_-]{1,64}$/.test(meta.id) || typeof meta.name !== 'string' || !meta.name.trim() || !Number.isFinite(meta.order) || !validPosition(meta.position) || typeof meta.category !== 'string' || !Array.isArray(meta.sources)) throw Error('元数据字段无效（id/name/order/category/position/sources）');
   const asset = (base, extensions) => {
    for (const ext of extensions) {
     const file = path.join(dir, `${base}.${ext}`);
     if (fs.existsSync(file) && fs.lstatSync(file).isFile()) return `/assets/${encodeURIComponent(folderName)}/${base}.${ext}`;
    }
    return null;
   };
   const resources = { org: asset('org', IMAGE_EXTENSIONS), line: asset('line', IMAGE_EXTENSIONS), color: asset('color', IMAGE_EXTENSIONS), video: asset('video', ['mp4']), info: asset('info', ['md', 'txt']) };
   data.push({ ...meta, folderName, resources, orgPath: resources.org, linePath: resources.line, colorPath: resources.color, videoPath: resources.video, infoPath: resources.info, annotated: meta.position.x !== null, ready: !!resources.org, revision: revision(raw) });
  } catch (error) { diagnostics.push({ folderName, message: `人物配置未载入：${error.message}` }); }
 }
 const counts = new Map(); data.forEach(item => counts.set(item.id, (counts.get(item.id) || 0) + 1));
 const unique = data.filter(item => { if (counts.get(item.id) === 1) return true; diagnostics.push({ folderName: item.folderName, message: `重复人物 ID：${item.id}` }); return false; });
 unique.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
 return { data: unique, diagnostics };
}
function savePosition(root, id, position, expectedRevision, io = fs) {
 if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id) || !validPosition(position)) throw Object.assign(Error('人物 ID 或坐标无效'), { status: 400 });
 const item = scanAssets(root).data.find(item => item.id === id);
 if (!item) throw Object.assign(Error('人物不存在或配置损坏'), { status: 404 });
 if (typeof expectedRevision !== 'string' || item.revision !== expectedRevision) throw Object.assign(Error('配置已改变，请重新扫描后再保存'), { status: 409 });
 const target = path.join(root, item.folderName, 'meta.json');
 const meta = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : { id: item.id, name: item.name, order: item.order, category: item.category, sources: item.sources };
 meta.position = position;
 const temporary = target + '.' + crypto.randomUUID() + '.tmp';
 try { io.writeFileSync(temporary, JSON.stringify(meta, null, 2) + '\n', { flag: 'wx' }); io.renameSync(temporary, target); }
 finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
 return scanAssets(root);
}
module.exports = { scanAssets, savePosition, validPosition, IMAGE_EXTENSIONS };
