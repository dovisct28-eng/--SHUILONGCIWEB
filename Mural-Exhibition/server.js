const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { scanAssets, savePosition } = require('./gallery-store.cjs');
const RUNTIME_VERSION = 'B03 V4.3';
function createApp({ admin = process.env.GALLERY_ADMIN === '1', assetsDirectory = path.join(__dirname, 'public/assets') } = {}) {
 const app = express(), token = crypto.randomBytes(32).toString('hex');
 app.use(express.static(path.join(__dirname, 'public')));
 app.get('/api/b03-runtime', (req,res)=>{
  let commitSha=null,workingTreeChanged=null;
  const cp=require('node:child_process');
  try{commitSha=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:__dirname,encoding:'utf8',windowsHide:true}).trim();workingTreeChanged=!!cp.execFileSync('git',['status','--porcelain','--','public/index.html','public/camera-lifecycle.mjs','public/pose-pipeline.mjs','public/pose-worker.js','public/operator-tracker.mjs','public/dwell-feedback.mjs','public/hand-ownership.mjs','public/gesture-pointer.mjs','public/dwell-controller.mjs','public/gesture-diagnostics.mjs','public/interaction-config.mjs','public/b03.css','server.js'],{cwd:__dirname,encoding:'utf8',windowsHide:true}).trim();}catch{}
  res.set('Cache-Control','no-store').json({commitSha,workingTreeChanged,version:RUNTIME_VERSION});
 });
 app.get('/m', (req, res) => res.sendFile(path.join(__dirname, 'public/gallery.html')));
 app.get('/api/scan-assets', (req, res) => {
  try { res.set('Cache-Control', 'no-store').json({ success: true, adminEnabled: admin, ...scanAssets(assetsDirectory) }); }
  catch { res.status(500).json({ success: false, message: '读取 assets 目录失败' }); }
 });
 app.use('/api/gallery-admin', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (!admin) return res.status(403).json({ success: false, message: '本地标注管理未启用' });
  const ip = req.socket.remoteAddress, host = req.get('host') || '';
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip);
  const allowedHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host);
  const origin = req.get('origin'), site = req.get('sec-fetch-site');
  if (!local || !allowedHost || (origin && origin !== `http://${host}`) || (site && !['same-origin', 'none'].includes(site))) return res.status(403).json({ success: false, message: '仅允许本机同源管理请求' });
  if (req.method !== 'GET' && (origin !== `http://${host}` || req.get('x-gallery-token') !== token || !req.is('application/json'))) return res.status(403).json({ success: false, message: '管理请求校验失败' });
  next();
 });
 app.get('/api/gallery-admin/characters', (req, res) => res.json({ success: true, token, ...scanAssets(assetsDirectory) }));
 app.post('/api/gallery-admin/position', express.json({ limit: '4kb' }), (req, res) => {
  try { res.json({ success: true, ...savePosition(assetsDirectory, req.body.id, req.body.position, req.body.revision) }); }
  catch (error) { res.status(error.status || 500).json({ success: false, message: error.status ? error.message : '保存失败，原配置已保留' }); }
 });
 app.use((error, req, res, next) => res.status(400).json({ success: false, message: '请求格式无效' }));
 return app;
}
if (require.main === module) {
 const port = Number(process.env.PORT || 3000);
 createApp().listen(port, () => console.log(`水龙祠： http://localhost:${port}/index.html\n本地标注管理：${process.env.GALLERY_ADMIN === '1' ? '已启用' : '关闭'}`));
}
module.exports = { createApp, RUNTIME_VERSION };
