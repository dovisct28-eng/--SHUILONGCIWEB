// Screen positions remain anchored to the renderer's projected GLB nodes.
// Sorted vertical rails prevent overlap without implying a viewing route.
import {markerReveal,paletteFor} from '../module-a/visual-director/state.mjs';
import {roomLabels,circled} from '../module-a/a02/markers.mjs';
import {a03Labels} from '../module-a/a03/composition.mjs';
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
  let visibility = 0, emphasis = 0, secondary = 1, roomWeight=0, themeWeight=0, fifthWeight=0, markerFocus=0, core = new Set();
  let lastFifth='',themeLayout=null;
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
  return {
    set({ visibility: v = 0, emphasis: e = 0, coreIds = [], secondaryVisibility = 1, architecturalWeight=0, themeWeight:t=0, fifthWeight:f=0, markerFocus:m=0, themeLayout:l=null } = {}) {
      themeLayout=l===null?null:clamp(l);
      markerFocus=clamp(m);
      themeWeight=clamp(t);fifthWeight=clamp(f);
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
      // Use the real renderer projection after the camera/resize has settled.
      const fifth=points.find(p=>p.id==='mural-05'),key=fifth?`${fifth.x},${fifth.y},${width},${height}`:'';
      if(fifthWeight>0&&key!==lastFifth&&typeof window!=='undefined'){lastFifth=key;window.parent.postMessage({type:'shuilong:a03-anchor',x:fifth.x,y:fifth.y},location.origin);}
      if(fifthWeight===0)lastFifth='';
      const positions = roomWeight>.001?roomLabels(points,width,height):layoutLabels(points, width, height);
      const layoutWeight=themeLayout??Math.max(themeWeight,fifthWeight);
      const themeActive=Math.max(themeWeight,fifthWeight)>.001;
      if(layoutWeight>0){const targets=a03Labels(points,width,height);for(const pos of positions){const target=targets.find(p=>p.id===pos.id);pos.lx+=(target.lx-pos.lx)*layoutWeight;pos.ly+=(target.ly-pos.ly)*layoutWeight;}}
      const reveal=markerReveal(visibility),palette=paletteFor(document.body.dataset?.directorAccent);
      svg.style.opacity = 1;
      for (const p of pins) {
        const pos = positions.find(v => v.id === p.m.id);
        const show = visibility > 0 && Boolean(pos) && (core.has(p.m.id) || secondary > 0);
        p.button.hidden = !show;
        p.line.style.display = p.dot.style.display = show ? '' : 'none';
        if (!show) continue;
        const isCore = core.has(p.m.id);
        const weight = (isCore ? 1 : (1 - emphasis * (roomWeight>.001?.25:.2)) * secondary)*(p.m.id==='mural-05'?1:1-.62*fifthWeight);
        const thematicVisibility=themeActive ? .28+.72*markerFocus : 1;
        p.button.style.opacity = reveal.label * weight * thematicVisibility;
        p.button.style.background = 'transparent';
        p.button.style.color = roomWeight>.001?'#d8d2c5':isCore ? '#d8d2c5' : '#c6c9c2';
        p.button.style.fontWeight = isCore && emphasis > .5 ? '500' : '400';
        p.button.dataset.core = String(isCore);
        const labelMode=themeActive?'theme':roomWeight>.001?'room':'legacy';
        if(p.button.dataset.labelMode!==labelMode||(labelMode!=='legacy'&&p.button.childElementCount===0)){
          if(labelMode!=='legacy'){p.button.replaceChildren();const number=document.createElement('span');number.textContent=circled[p.m.id];number.style.cssText=`color:${isCore?palette.accent:'#a0a39c'};font-size:19px;margin-right:7px`;p.button.append(number,document.createTextNode(labelMode==='theme'?p.m.label.replace('幅','铺'):p.m.label));}
          else p.button.textContent=p.m.label;
          p.button.dataset.labelMode=labelMode;
        }
        p.button.style.fontSize=themeActive?'15px':roomWeight>.001?'15px':'';
        p.line.setAttribute('stroke-dasharray',roomWeight>.001||themeWeight>0||fifthWeight>0?'none':'3 3');
        p.line.setAttribute('stroke-width',themeActive?'1.1':roomWeight>.001?'.8':'1.2');
        p.button.style.left = pos.lx + 'px'; p.button.style.top = pos.ly + 'px';
        p.line.style.opacity = reveal.line * (isCore?weight:weight*.6)*thematicVisibility; p.dot.style.opacity = reveal.anchor * (isCore?weight:weight*.6)*thematicVisibility;
        const deltaX=pos.lx-pos.x,deltaY=pos.ly-pos.y;
        const trim=roomWeight>.001||layoutWeight>0?Math.max(0,1-(themeActive?60:roomWeight>.001?49:34)/Math.max(1,Math.hypot(deltaX,deltaY))):1;
        for (const [key, value] of Object.entries({x1:pos.x,y1:pos.y,x2:pos.x+deltaX*trim*reveal.line,y2:pos.y+deltaY*trim*reveal.line})) p.line.setAttribute(key, value);
        p.line.setAttribute('stroke', roomWeight>.001&&isCore&&emphasis>.5?palette.accent:'#a0a39c');
        p.dot.setAttribute('cx', pos.x); p.dot.setAttribute('cy', pos.y);
        p.dot.setAttribute('fill', palette.accent); p.dot.setAttribute('r', themeActive ? 2.5 : isCore ? 2.3 + emphasis * .7 : 2);
      }
    },
  };
}
