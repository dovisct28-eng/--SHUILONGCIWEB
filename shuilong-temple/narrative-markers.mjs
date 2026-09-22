// Screen positions remain anchored to the renderer's projected GLB nodes.
// Sorted vertical rails prevent overlap without implying a viewing route.
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
  let visibility = 0, emphasis = 0, core = new Set();
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
  return {
    set({ visibility: v = 0, emphasis: e = 0, coreIds = [] } = {}) {
      visibility = clamp(v); emphasis = clamp(e); core = new Set(coreIds);
      document.body.classList.toggle('narrative-markers', visibility > 0);
      for (const p of pins) {
        p.button.tabIndex = -1;
        p.button.setAttribute('aria-label', p.m.label + '，模型示意位置');
        p.button.setAttribute('aria-hidden', String(visibility === 0));
      }
    },
    update(points, width, height) {
      const positions = layoutLabels(points, width, height);
      svg.style.opacity = visibility;
      for (const p of pins) {
        const pos = positions.find(v => v.id === p.m.id);
        const show = visibility > 0 && Boolean(pos);
        p.button.hidden = !show;
        p.line.style.display = p.dot.style.display = show ? '' : 'none';
        if (!show) continue;
        const isCore = core.has(p.m.id);
        const weight = isCore ? 1 : 1 - emphasis * .58;
        p.button.style.opacity = visibility * weight;
        p.button.style.background = isCore ? `rgb(${Math.round(248 - emphasis * 191)} ${Math.round(247 - emphasis * 187)} ${Math.round(243 - emphasis * 185)})` : '#f8f7f3';
        p.button.style.color = isCore && emphasis > .5 ? '#fff' : '#393c38';
        p.button.dataset.core = String(isCore);
        p.button.style.left = pos.lx + 'px'; p.button.style.top = pos.ly + 'px';
        p.line.style.opacity = p.dot.style.opacity = weight;
        for (const [key, value] of Object.entries({x1:pos.x,y1:pos.y,x2:pos.lx,y2:pos.ly})) p.line.setAttribute(key, value);
        p.line.setAttribute('stroke', '#62665f');
        p.dot.setAttribute('cx', pos.x); p.dot.setAttribute('cy', pos.y);
        p.dot.setAttribute('fill', '#393c38'); p.dot.setAttribute('r', isCore ? 3.5 + emphasis * 2 : 3.5);
      }
    },
  };
}
