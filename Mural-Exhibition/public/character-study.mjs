// A deliberately small, text-only archive format. No raw HTML is interpreted.
export function archiveBlocks(text, { markdown = false, name = '', englishName = '' } = {}) {
 const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim().split('\n');
 if (lines[0]?.trim() === name) {
  lines.shift();
  if (!englishName && /^[A-Za-z][A-Za-z\s,.'’()–-]+$/.test(lines[0]?.trim() || '')) englishName = lines.shift().trim();
 }
 const blocks = []; let paragraph = [];
 const flush = () => { if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') }); paragraph = []; };
 for (const raw of lines) {
  const line = raw.trim();
  if (!line) { flush(); continue; }
  const heading = markdown ? line.match(/^#{1,6}\s+(.+)$/) : line.match(/^[一二三四五六七八九十百]+[、．.]\s*(.+)$/);
  if (heading) { flush(); blocks.push({ type: 'h2', text: markdown ? heading[1] : line }); }
  else if (markdown && /^[-*+]\s+/.test(line)) { flush(); blocks.push({ type: 'li', text: line.replace(/^[-*+]\s+/, '') }); }
  else if (markdown && /^>\s?/.test(line)) { flush(); blocks.push({ type: 'blockquote', text: line.replace(/^>\s?/, '') }); }
  else if (!markdown) { flush(); blocks.push({ type:'p', text:line }); }
  else paragraph.push(line);
 }
 flush(); return { englishName, blocks };
}

export function safeSourceURL(value) {
 try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : null; } catch { return null; }
}

export function renderArchive(container, archive, sources = []) {
 container.replaceChildren();
 for (const block of archive.blocks) {
  const el = document.createElement(block.type === 'li' ? 'p' : block.type);
  el.textContent = block.type === 'li' ? `• ${block.text}` : block.text;
  container.append(el);
 }
 if (!archive.blocks.length) { const p = document.createElement('p'); p.textContent = '人物档案待补充'; container.append(p); }
 const section = document.createElement('section'); section.className = 'archive-sources';
 const title = document.createElement('h2'); title.textContent = '资料来源'; section.append(title);
 for (const source of sources) {
  const text = typeof source === 'string' ? source : source && typeof source === 'object' ? ['author', 'title', 'year', 'pages'].map(k => source[k]).filter(v => typeof v === 'string' || typeof v === 'number').join(' · ') : '';
  if (!text) continue;
  const p = document.createElement('p'); p.textContent = text;
  const url = typeof source === 'object' && safeSourceURL(source.url);
  if (url) { const a = document.createElement('a'); a.href = url; a.textContent = '查看来源 ↗'; a.target = '_blank'; a.rel = 'noopener noreferrer'; p.append(' ', a); }
  section.append(p);
 }
 if (section.children.length === 1) { const p = document.createElement('p'); p.textContent = '资料来源待补充。原档案保留，相关解释尚未在本轮核验。'; section.append(p); }
 container.append(section); container.scrollTop = 0;
}

// Camera remains parallel to the original plane. CSS transforms are intentionally
// excluded from the inputs so a revealing panel cannot move its own safe area.
export function cameraFit({ width, height, planeWidth, planeHeight, fov = 45, left = 30, right = 30, verticalInset = 120 }) {
 const tan = Math.tan(fov * Math.PI / 360), aspect = width / height;
 const safeWidth = Math.max(1, width - left - right), safeHeight = Math.max(1, height - 2 * verticalInset);
 const z = Math.max(planeWidth / (2 * tan * aspect * safeWidth / width), planeHeight / (2 * tan * safeHeight / height)) * 1.05;
 return { z, x: 2 * tan * z * aspect * ((right - left) / (2 * width)), safeWidth, safeHeight };
}
