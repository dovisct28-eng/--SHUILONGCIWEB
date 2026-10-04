// Screen positions remain anchored to the renderer's projected GLB nodes.
// Sorted vertical rails prevent overlap without implying a viewing route.
import {markerReveal,paletteFor} from '../module-a/visual-director/state.mjs';
import {roomLabels,circled} from '../module-a/a02/markers.mjs';
export function layoutLabels(points, width, height) {
  const result = [];
  for (const side of [-1, 1]) {
    const column = points.filter(p => (p.x < width / 2 ? -1 : 1) === side)
      .sort((a, b) => a.y - b.y || a.id.localeCompare(b.id));
    const gap = 48;
    const top = 64, bottom = height - 64;
    const ys = column.map((p, i) => Math.max(top + i * gap, Math.min(bottom, p.y)));
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    if (ys.length && ys.at(-1) > bottom) {
      const excess = ys.at(-1) - bottom;
      for (let i = 0; i < ys.length; i++) ys[i] -= excess;
    }
    column.forEach((p, i) => result.push({ ...p, lx: side < 0 ? 78 : width - 78, ly: ys[i] }));
  }
  return result;
}

export function createMuralPresentation(pins, svg) {
  let visibility = 0, emphasis = 0, secondary = 1, roomWeight=0, core = new Set();
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
  return {
    set({ visibility: v = 0, emphasis: e = 0, coreIds = [], secondaryVisibility = 1, architecturalWeight=0 } = {}) {
      roomWeight=clamp(architecturalWeight);
      visibility = clamp(v); emphasis = clamp(e); core = new Set(coreIds);
      secondary = clamp(secondaryVisibility);
      document.body.classList.toggle('narrative-markers', visibility > 0);
      for (const p of pins) {
        p.button.tabIndex = -1;
        p.button.setAttribute('aria-label', p.m.label + '，模型示意位置');
        p.button.setAttribute('aria-hidden', String(visibility === 0 || (!core.has(p.m.id) && secondary === 0)));
      }
    },
    update(points, width, height) {
      const positions = roomWeight>.001?roomLabels(points,width,height):layoutLabels(points, width, height);
      const reveal=markerReveal(visibility),palette=paletteFor(document.body.dataset?.directorAccent);
      svg.style.opacity = 1;
      for (const p of pins) {
        const pos = positions.find(v => v.id === p.m.id);
        const show = visibility > 0 && Boolean(pos) && (core.has(p.m.id) || secondary > 0);
        p.button.hidden = !show;
        p.line.style.display = p.dot.style.display = show ? '' : 'none';
        if (!show) continue;
        const isCore = core.has(p.m.id);
        const weight = isCore ? 1 : (1 - emphasis * (roomWeight>.001?.25:.2)) * secondary;
        p.button.style.opacity = reveal.label * weight;
        p.button.style.background = 'transparent';
        p.button.style.color = roomWeight>.001?'#d8d2c5':isCore ? '#d8d2c5' : '#c6c9c2';
        p.button.style.fontWeight = isCore && emphasis > .5 ? '500' : '400';
        p.button.dataset.core = String(isCore);
        p.button.textContent=(roomWeight>.001?circled[p.m.id]+'  ':'')+p.m.label;
        p.button.style.fontSize=roomWeight>.001?'15px':'';
        p.line.setAttribute('stroke-dasharray',roomWeight>.001?'none':'3 3');
        p.line.setAttribute('stroke-width',roomWeight>.001?'.8':'1.2');
        p.button.style.left = pos.lx + 'px'; p.button.style.top = pos.ly + 'px';
        p.line.style.opacity = reveal.line * (isCore?1:weight*.6); p.dot.style.opacity = reveal.anchor * (isCore?1:weight*.6);
        const deltaX=pos.lx-pos.x,deltaY=pos.ly-pos.y;
        const trim=roomWeight>.001?Math.max(0,1-49/Math.max(1,Math.hypot(deltaX,deltaY))):1;
        for (const [key, value] of Object.entries({x1:pos.x,y1:pos.y,x2:pos.x+deltaX*trim*reveal.line,y2:pos.y+deltaY*trim*reveal.line})) p.line.setAttribute(key, value);
        p.line.setAttribute('stroke', '#a0a39c');
        p.dot.setAttribute('cx', pos.x); p.dot.setAttribute('cy', pos.y);
        p.dot.setAttribute('fill', palette.accent); p.dot.setAttribute('r', isCore ? 2.3 + emphasis * .7 : 2);
      }
    },
  };
}
