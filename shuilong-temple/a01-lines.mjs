// Scroll is the only clock. This layer shares the preview's root/camera/renderer.
const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
const ease = n => { const t = clamp(n); return t*t*(3-2*t); };
const range = (n,a,b) => ease((n-a)/(b-a));
const windows = {hall:[.08,.34], west:[.16,.43], east:[.16,.43], stage:[.30,.48], entrance:[.32,.50], roof:[0,.42], timber:[.34,.53], court:[.36,.54],detail:[.45,.58]};
const approach={hall:[-.05,0],roof:[-.05,0],detail:[-.05,0],timber:[.02,.10],west:[.04,.15],east:[.04,.15],stage:[.07,.18],entrance:[.07,.18],court:[.08,.20]};
export function deriveLineState(animation = 0, reducedMotion = false) {
  const progress = clamp(animation), growth = clamp((progress-.2)/.45);
  const solid = reducedMotion?1:range(progress,.58,.70);
  return {
    progress, growth, solid, reducedMotion,
    solidGrowth: solid,
    materialWeight: solid,
    lightingWeight: reducedMotion?1:range(progress,.55,.70),
    lineOpacity: reducedMotion?0:(.65+.35*range(progress,0,.05))*(1-range(progress,.685,.71)),
    environmentWeight: reducedMotion?1:range(progress,.70,.82),
    assembly: range(progress,.03,.2),
    depth: reducedMotion ? 0 : 1-range(progress,.03,.2),
    groups: Object.fromEntries(Object.entries(windows).map(([key,[a,b]]) => [key, reducedMotion||key==='roof'?1:range(progress,a,b)])),
  };
}

export function createArchitectureLines(T, root, data) {
  const group = new T.Group(); group.name = 'A01ArchitectureLines';
  const geometries = [], materials = [], entries = [],hierarchy={Primary:0,Secondary:0,Detail:0};
  const sweep={value:0};
  let state = deriveLineState(), disposed = false;
  const add = (key, positions, color, opacity = 1) => {
    const geometry = new T.BufferGeometry(); geometries.push(geometry);
    geometry.setAttribute('position', new T.Float32BufferAttribute(positions,3));
    const colors=[],ranks=[];
    for(let i=0;i<positions.length;i+=6){
      const length=Math.hypot(positions[i+3]-positions[i],positions[i+4]-positions[i+1],positions[i+5]-positions[i+2]);
      const rank=key==='axes'||key==='locators'||key==='court'||key==='detail'?'Detail':key==='roof'&&Math.max(positions[i+1],positions[i+4])>3.1||key==='hall'&&length>2?'Primary':'Secondary';
      hierarchy[rank]++;ranks.push(rank==='Primary'?0:rank==='Secondary'?1:2,rank==='Primary'?0:rank==='Secondary'?1:2);const tint=new T.Color(rank==='Primary'?0xd8c9ae:rank==='Secondary'?0x98958c:0x565d5b);
      tint.multiplyScalar(.86+.14*(.5+.5*Math.sin(i*.37)));colors.push(tint.r,tint.g,tint.b,tint.r,tint.g,tint.b);
    }
    geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    geometry.setAttribute('inkRank',new T.Float32BufferAttribute(ranks,1));
    const material = new T.LineBasicMaterial({color:0xffffff,vertexColors:true,transparent:true,opacity:0,depthWrite:false,toneMapped:false,fog:false});
    materials.push(material);
    const progress={value:0};material.userData.progress=progress;
    material.onBeforeCompile=s=>{s.uniforms.inkProgress=progress;s.uniforms.inkSweep=sweep;
      s.vertexShader='attribute float inkRank;varying float rank;varying vec3 inkWorld;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrank=inkRank;inkWorld=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader='uniform float inkProgress;uniform float inkSweep;varying float rank;varying vec3 inkWorld;\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`float hierarchyStart=rank<.5?-.04:rank<1.5?.10:.45;
       float drawn=smoothstep(hierarchyStart,hierarchyStart+(rank<.5?.12:rank<1.5?.30:.13),inkProgress);
       float score=dot(inkWorld,vec3(-.018,.13,.028));
       float uneven=sin(inkWorld.x*1.7+inkWorld.z*.83)*sin(inkWorld.z*2.1+inkWorld.y*1.3)*.018;
       float lit=smoothstep(-.04,.07,score-(1.0-1.9*inkSweep)+uneven);
       diffuseColor.a*=drawn*(1.-lit*.98);
       #include <opaque_fragment>`);};material.customProgramCacheKey=()=> 'a01-ink-v3';
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
    add('axes',[0,.08,-17.2,0,.08,13.3, -6.3,.08,-11.55,6.3,.08,-11.55, -6.3,.08,8.35,6.3,.08,8.35],0x8899a4,.28);
    add('locators',[-5,.1,-15.3,-5,.1,-13.8, 5,.1,9.8,5,.1,11.3, -1,.1,11.93,1,.1,11.93],0x8899a4,.4);
    for (const [key, positions] of Object.entries(data)) {
      if (!positions.length || positions.length%6 || positions.some(n=>!Number.isFinite(n))) throw Error(`Invalid A01 contour ${key}`);
      add(key,positions,key==='roof'?0xd8c4a6:0xadaeaa,key==='detail'?.48:key==='court'?.42:key==='timber'?.7:1);
    }
    root.add(group);
  } catch(error) { dispose(); throw error; }
  return {
    apply(next) {
      if (disposed) return;
      state = next;sweep.value=next.solid;group.visible = next.lineOpacity > .001;
      for (const entry of entries) {
        const auxiliary = entry.key==='axes'||entry.key==='locators';
        const progress = auxiliary ? .18+.82*next.assembly : next.groups[entry.key];
        entry.geometry.setDrawRange(0,Math.floor(entry.count/2*progress)*2);
        entry.material.opacity = next.lineOpacity*entry.opacity;entry.material.userData.progress.value=next.progress;
        entry.line.visible = entry.geometry.drawRange.count>0;
        // Fore/mid/back locating strokes gently collect into the model plane.
        entry.line.position.set(auxiliary ? next.depth*(entry.key==='axes'?-.6:.8) : 0,auxiliary ? next.depth*(entry.key==='axes'?.4:1.1) : 0,auxiliary ? next.depth*(entry.key==='axes'?-1.8:2.2) : 0);
      }
    },
    getState() { return {...state,hierarchy:{...hierarchy},visible:group.visible,geometries:geometries.length,materials:materials.length,segments:entries.reduce((n,e)=>n+e.count/2,0),drawCalls:group.visible?entries.filter(e=>e.line.visible).length:0,groups:entries.map(e=>({key:e.key,drawCount:e.geometry.drawRange.count,opacity:e.material.opacity,position:e.line.position.toArray()})),disposed}; },
    dispose,
  };
}
