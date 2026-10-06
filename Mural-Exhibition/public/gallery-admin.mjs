export function createAdmin({ onData, onDraft, getData }) {
 const panel = document.getElementById('gallery-admin'), toggle = document.getElementById('gallery-admin-toggle');
 let token, selected = null, draft = null, dirty = false, busy = false, enabled = false;
 const list = panel.querySelector('[data-list]'), status = panel.querySelector('[data-status]'), search = panel.querySelector('input');
 const save = panel.querySelector('[data-save]'), cancel = panel.querySelector('[data-cancel]'), unbind = panel.querySelector('[data-unbind]');
 const message = text => status.textContent = text;
 const item = () => getData().find(i => i.id === selected);
 function preview() {
  const current = item();
  panel.querySelector('[data-selected]').textContent = current ? current.name : '尚未选择人物';
  panel.querySelector('[data-position]').textContent = draft && draft.x !== null ? `X ${draft.x.toFixed(4)}% · Y ${draft.y.toFixed(4)}%` : '未绑定坐标';
  save.disabled = busy || !current || !dirty || !draft; cancel.disabled = busy; unbind.disabled = busy || !current || !current.annotated;
  onDraft(enabled && draft?.x !== null ? draft : null);
 }
 function render() {
  const data = getData(), annotated = data.filter(i => i.annotated).length;
  panel.querySelector('[data-count]').textContent = `已录入 ${data.length} · 已标注 ${annotated} · 待标注 ${data.length - annotated}`;
  list.replaceChildren();
  for (const character of data.filter(i => `${i.name} ${i.id}`.toLowerCase().includes(search.value.toLowerCase()))) {
   const button = document.createElement('button'); button.type = 'button'; button.dataset.id = character.id;
   button.textContent = `${character.name} · ${character.annotated ? '已标注' : '待标注'}${character.ready ? '' : ' / 原图未就绪'}`;
   button.setAttribute('aria-pressed', String(character.id === selected));
   button.onclick = () => {
    if (busy) return;
    selected = character.id;
    if (!dirty) draft = { ...character.position }; // Preserve a click made before choosing a character.
    message(dirty ? '预览尚未保存，可重新点击修正。' : '可点击壁画调整位置；拖动浏览、滚轮缩放仍可用。');
    render();
   };
   list.append(button);
  }
  preview();
 }
 async function refresh() {
  const response = await fetch('/api/gallery-admin/characters');
  const result = await response.json(); if (!response.ok) throw Error(result.message);
  token = result.token; onData(result.data);
  if (!dirty) draft = item() ? { ...item().position } : null;
  render();
  if (result.diagnostics.length) message(result.diagnostics.map(d => `${d.folderName}：${d.message}`).join('\n'));
 }
 toggle.onclick = async () => {
  enabled = !enabled; panel.hidden = !enabled; toggle.setAttribute('aria-expanded', String(enabled));
  if (enabled) { try { await refresh(); } catch (error) { message(error.message); } }
  else { dirty = false; draft = null; onDraft(null); }
 };
 search.oninput = render;
 panel.querySelector('[data-refresh]').onclick = async () => { if (busy) return; dirty = false; draft = null; try { await refresh(); message('扫描完成'); } catch (error) { message(error.message); } };
 cancel.onclick = () => { dirty = false; draft = item() ? { ...item().position } : null; message('已取消，原坐标保留。'); render(); };
 async function persist(position) {
  const current = item(); if (!current || busy) return;
  busy = true; preview(); message('正在保存…');
  try {
   const response = await fetch('/api/gallery-admin/position', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Gallery-Token': token }, body: JSON.stringify({ id: current.id, position, revision: current.revision }) });
   const result = await response.json(); if (!response.ok) throw Error(result.message);
   onData(result.data); dirty = false; draft = { ...item().position }; message(position.x === null ? '已取消绑定，全部素材保留。' : '坐标保存成功，刷新后仍然有效。');
  } catch (error) { dirty = false; draft = { ...current.position }; message(`保存失败：${error.message}。已恢复原坐标。`); }
  finally { busy = false; render(); }
 }
 save.onclick = () => persist(draft);
 unbind.onclick = () => { if (!busy) { draft = { x: null, y: null }; dirty = true; message('预览取消绑定；点击保存确认，或取消恢复。'); preview(); } };
 return {
  enable() { toggle.hidden = false; },
  active: () => enabled,
  click(position) { if (!enabled || busy || !position) return; draft = position; dirty = true; message(selected ? '临时位置尚未保存。' : '位置已预览，请从列表选择人物后保存。'); preview(); },
  close() { enabled = false; panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); dirty = false; draft = null; onDraft(null); }
 };
}
