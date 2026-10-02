// Scroll is the only clock. This layer shares the preview's root/camera/renderer.
const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
const ease = n => { const t = clamp(n); return t*t*(3-2*t); };
const range = (n,a,b) => ease((n-a)/(b-a));
const windows = {hall:[0,.18], west:[.06,.24], east:[.06,.24], stage:[.12,.28], entrance:[.18,.34], roof:[.22,.40], timber:[.28,.44], court:[.32,.46]};
export function deriveLineState(animation = 0, reducedMotion = false) {
  const progress = clamp(animation), growth = clamp((progress-.2)/.45);
  const solid = range(growth,.38,.94);
  return {
    progress, growth, solid,
    solidGrowth: range(growth,.26,.88),
    lineOpacity: (progress < .2 ? range(progress,.02,.17) : 1) * (1-range(growth,.55,.97)),
    environmentWeight: .06 + .94*range(growth,.38,.96),
    assembly: range(progress,.03,.2),
    depth: reducedMotion ? 0 : 1-range(progress,.03,.2),
    groups: Object.fromEntries(Object.entries(windows).map(([key,[a,b]]) => [key, range(growth,a,b)])),
  };
}

export function createArchitectureLines(T, root, data) {
  const group = new T.Group(); group.name = 'A01ArchitectureLines';
  const geometries = [], materials = [], entries = [];
  let state = deriveLineState(), disposed = false;
  const add = (key, positions, color, opacity = 1) => {
    const geometry = new T.BufferGeometry(); geometries.push(geometry);
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions,3));
    const material = new T.LineBasicMaterial({color,transparent:true,opacity:0,depthWrite:false,toneMapped:false,fog:false});
    materials.push(material);
    const line = new T.LineSegments(geometry,material); line.name = key;
    line.frustumCulled = false; group.add(line);
    entries.push({key,line,geometry,material,count:positions.length/3,opacity});
  };
  function dispose() {
    disposed = true; group.removeFromParent();
    geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose());
  }
  try {
    // Axes and sparse locating strokes derive from the actual courtyard bounds.
    // Deliberately open segments, never a rectangular perspective tunnel.
    add('axes',[0,.08,-17.2,0,.08,13.3, -6.3,.08,-11.55,6.3,.08,-11.55, -6.3,.08,8.35,6.3,.08,8.35],0x938a7c,.45);
    add('locators',[-5,.1,-15.3,-5,.1,-13.8, 5,.1,9.8,5,.1,11.3, -1,.1,11.93,1,.1,11.93],0x62675f,.55);
    for (const [key, positions] of Object.entries(data)) {
      if (!positions.length || positions.length%6 || positions.some(n=>!Number.isFinite(n))) throw Error(`Invalid A01 contour ${key}`);
      add(key,positions,0x343833,key==='court'?.52:key==='timber'?.67:1);
    }
    root.add(group);
  } catch(error) { dispose(); throw error; }
  return {
    apply(next) {
      if (disposed) return;
      state = next; group.visible = next.lineOpacity > .001;
      for (const entry of entries) {
        const auxiliary = entry.key==='axes'||entry.key==='locators';
        const progress = auxiliary ? .18+.82*next.assembly : next.groups[entry.key];
        entry.geometry.setDrawRange(0,Math.floor(entry.count/2*progress)*2);
        entry.material.opacity = next.lineOpacity*entry.opacity;
        entry.line.visible = entry.geometry.drawRange.count>0;
        // Fore/mid/back locating strokes gently collect into the model plane.
        entry.line.position.set(auxiliary ? next.depth*(entry.key==='axes'?-.6:.8) : 0,auxiliary ? next.depth*(entry.key==='axes'?.4:1.1) : 0,auxiliary ? next.depth*(entry.key==='axes'?-1.8:2.2) : 0);
      }
    },
    getState() { return {...state,visible:group.visible,geometries:geometries.length,materials:materials.length,segments:entries.reduce((n,e)=>n+e.count/2,0),drawCalls:group.visible?entries.filter(e=>e.line.visible).length:0,groups:entries.map(e=>({key:e.key,drawCount:e.geometry.drawRange.count,opacity:e.material.opacity,position:e.line.position.toArray()})),disposed}; },
    dispose,
  };
}
