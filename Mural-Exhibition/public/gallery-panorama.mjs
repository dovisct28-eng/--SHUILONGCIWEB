export function initialView(w, h, vw, vh) {
 const scale = Math.max(vw / w, vh / h);
 return { scale, x: 0, y: (vh - h * scale) / 2 };
}
export function clampView(view, w, h, vw, vh) {
 const min = Math.max(vw / w, vh / h), scale = Math.max(min, Math.min(view.scale, Math.max(6, min)));
 return { scale, x: Math.max(vw - w * scale, Math.min(0, view.x)), y: Math.max(vh - h * scale, Math.min(0, view.y)) };
}
export function imageToScreen(p, view, w, h) { return { x: view.x + p.x / 100 * w * view.scale, y: view.y + p.y / 100 * h * view.scale }; }
export function screenToImage(p, view, w, h) {
 const x = (p.x - view.x) / (w * view.scale) * 100, y = (p.y - view.y) / (h * view.scale) * 100;
 return x >= -1e-8 && x <= 100 + 1e-8 && y >= -1e-8 && y <= 100 + 1e-8 ? { x: +Math.max(0, Math.min(100, x)).toFixed(4), y: +Math.max(0, Math.min(100, y)).toFixed(4) } : null;
}
// Connected groups retain every character; dense positions open a short chooser.
export function groupHotspots(items, view, w, h, distance = 26) {
 const points = items.map(item => ({ item, ...imageToScreen(item.position, view, w, h) })), groups = [];
 for (const point of points) {
  const matches = groups.filter(g => g.some(p => Math.hypot(p.x - point.x, p.y - point.y) < distance));
  if (!matches.length) groups.push([point]);
  else { const merged = [point, ...matches.flat()]; matches.forEach(g => groups.splice(groups.indexOf(g), 1)); groups.push(merged); }
 }
 return groups;
}
