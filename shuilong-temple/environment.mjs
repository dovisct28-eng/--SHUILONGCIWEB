// Design reconstruction, not a surveyed landscape or a botanical inventory.
// No image requests, additional render loop, or changes to the building GLB.
const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };
export function visualState(screens = 0, tour = null) {
  const space = smooth((screens-7)/3), theme = smooth((screens-10.5)/2.7);
  const entry = tour ? clamp(tour.entryProgress ?? 1) : smooth((screens-13.2)/.8);
  return { environmentOpacity: (1-.3*space-.35*theme)*(1-entry),
    foregroundOpacity: (1-space)*(1-entry), environmentSaturation: .65-.25*theme,
    environmentContrast: .8-.25*theme, focusStrength: .22*theme+.55*entry,
    fogDensity: .007+.003*theme, lightIntensity: 3.3-.25*entry,
    target: tour?.target || null, chapter: entry>0?'A04':theme>0?'A03':space>0?'A02':'A01' };
}

export function createEnvironment(T, scene) {
  const group = new T.Group(); group.name = 'Environment';
  const layers = Object.fromEntries(['Terrain','Field','Vegetation','Foreground','DistantMountains','Atmosphere'].map(name=>{
    const layer = new T.Group(); layer.name = name; group.add(layer); return [name,layer];
  }));
  let backdrop=null;
  const materials = [], geometries = new Set(), resolution={value:new T.Vector2(1,1)};
  const material = (color, basic=false) => {
    const m = new (basic?T.MeshBasicMaterial:T.MeshStandardMaterial)({color,transparent:true,depthWrite:false,...(!basic?{roughness:1}:{})});
    m.userData.baseColor=m.color.clone();
    m.onBeforeCompile=shader=>{shader.uniforms.environmentResolution=resolution;
      shader.fragmentShader='uniform vec2 environmentResolution;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        vec2 edge = gl_FragCoord.xy / environmentResolution;
        diffuseColor.a *= smoothstep(0.0,0.16,edge.x)*smoothstep(0.0,0.16,1.0-edge.x)*smoothstep(0.0,0.16,edge.y)*smoothstep(0.0,0.16,1.0-edge.y);
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey=()=> 'environment-edge-v1';
    materials.push(m); return m;
  };
  const mesh = (layer, geometry, mat, position, scale=[1,1,1]) => {
    geometries.add(geometry); const m=new T.Mesh(geometry,mat);m.position.set(...position);m.scale.set(...scale);
    m.receiveShadow=true;layers[layer].add(m);return m;
  };
  try {
    // Radial skirt buries the rectangular display plinth; outer vertex alpha blends into the page.
    const positions=[],colors=[],indices=[],segments=64,rings=[0,.42,.66,.85,1];
    const earth=new T.Color(0xb7ad98);
    for(let r=0;r<rings.length;r++)for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,noise=1+.06*Math.sin(a*3)+.04*Math.cos(a*7),radius=rings[r];
      positions.push(Math.cos(a)*19*radius*noise,-.13-.43*smooth((radius-.5)/.5),-1.75+Math.sin(a)*27*radius*noise);
      const tint=earth.clone().multiplyScalar(.98+.035*Math.sin(a*5+r));colors.push(tint.r,tint.g,tint.b,r===rings.length-1?0:1);
      if(r&&i<segments){const b=r*(segments+1)+i,c=b-segments-1;indices.push(c,c+1,b,b,c+1,b+1);}
    }
    const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(positions,3));ground.setAttribute('color',new T.Float32BufferAttribute(colors,4));ground.setIndex(indices);ground.computeVertexNormals();
    const soil=material(0xffffff);soil.vertexColors=true;mesh('Terrain',ground,soil,[0,0,0]);
    const patch=material(0xa5a18a),ridge=material(0xafa58f),path=material(0xc3b79f);
    // A few irregular field strips on one side; the entrance path remains open.
    for(let i=0;i<3;i++){
      const shape=new T.Shape();shape.moveTo(-14-i*.9,1+i*3.2);shape.lineTo(-7.1,2+i*3.1);shape.lineTo(-7.7,4.1+i*3.1);shape.lineTo(-15-i*.7,3+i*3.3);shape.closePath();
      const m=mesh('Field',new T.ShapeGeometry(shape),i%2?ridge:patch,[0,-.09,0]);m.rotation.x=-Math.PI/2;
    }
    const road=new T.Shape();road.moveTo(-1,12.7);road.bezierCurveTo(-2,18,-9,19,-12,25);road.lineTo(-9.5,25);road.bezierCurveTo(-6,19,1,18,1,12.7);road.closePath();
    const roadMesh=mesh('Field',new T.ShapeGeometry(road,10),path,[0,-.08,0]);roadMesh.rotation.x=Math.PI/2;path.side=T.DoubleSide;
    // Six asymmetric clusters. Shared instancing keeps draw calls independent of leaf count.
    const clusters=[[9,-17,3.8],[12,-13,4.5],[10,-9,3.1],[15,-18,3.4],[-12,13,2.3],[-15,-9,2.5]];
    const crownGeometry=new T.IcosahedronGeometry(1,0),trunkGeometry=new T.CylinderGeometry(.07,.13,1,5);
    geometries.add(crownGeometry);geometries.add(trunkGeometry);
    const leaves=material(0x969985),wood=material(0x807563),dummy=new T.Object3D();
    leaves.depthWrite=true;wood.depthWrite=true;
    const crowns=new T.InstancedMesh(crownGeometry,leaves,clusters.length*32),trunks=new T.InstancedMesh(trunkGeometry,wood,clusters.length);
    clusters.forEach(([x,z,h],i)=>{
      dummy.position.set(x,h*.35-.1,z);dummy.scale.set(1,h*.7,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
      for(let j=0;j<32;j++){
        const a=j*2.4,r=h*.32*Math.sqrt((j+.5)/32),lift=Math.sin(j*1.73)*h*.12;
        dummy.position.set(x+Math.cos(a)*r,h*.72+lift,z+Math.sin(a)*r*.8);
        dummy.scale.set(h*(.10+.035*Math.sin(j)),h*.16,h*.13);dummy.rotation.set(j*.6,j*.4,j*.3);dummy.updateMatrix();crowns.setMatrixAt(i*32+j,dummy.matrix);
        crowns.setColorAt(i*32+j,new T.Color().setScalar(.88+.12*(Math.sin(j*2.7)*.5+.5)));
      }
    });
    layers.Vegetation.add(crowns,trunks);
    const contact=material(0x74705f,true);contact.userData.contact=true;
    for(const [x,z] of clusters){const m=mesh('Vegetation',new T.CircleGeometry(.65,12),contact,[x,-.07,z],[1, .7, 1]);m.rotation.x=-Math.PI/2;}
    const stone=material(0x999587),rock=new T.IcosahedronGeometry(1,0);
    for(const [x,z,s] of [[-7,-15,.35],[8,-18,.5],[-9,12,.3],[11,-10,.25]])mesh('Vegetation',rock,stone,[x,-.03,z],[s,s*.45,s*.8]);
    // Low foreground scrub occupies a single near corner, never the mural walls.
    const grass=material(0x898976);grass.userData.foreground=true;
    for(let i=0;i<9;i++)mesh('Foreground',crownGeometry,grass,[-9.5+i*.35,.1,-17+Math.sin(i)*.6],[.5,.45,.45]);
    // Designed skyline, not a reconstruction of the actual site's mountains.
    // DOM atmosphere behind the canvas cannot veil a mural or a roof.
    if(typeof document!=='undefined'){
      backdrop=document.createElement('div');backdrop.setAttribute('aria-hidden','true');backdrop.dataset.environment='distant-mountains';
      backdrop.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;filter:blur(3px);mask-image:radial-gradient(ellipse at 55% 40%,#000 25%,transparent 68%)';
      backdrop.innerHTML='<svg viewBox="0 0 1000 800" preserveAspectRatio="none" width="100%" height="100%"><path fill="#b7bcae" opacity=".3" d="M0 235 Q90 220 140 195 T240 210 Q300 170 370 180 T480 190 Q560 135 620 168 T760 190 Q850 155 920 195 L1000 235 V510 H0Z"/><path fill="#bfc0af" opacity=".2" d="M0 290 Q130 240 210 260 T370 245 Q480 225 560 250 T760 225 Q890 230 1000 280 V550 H0Z"/></svg>';
      document.body.prepend(backdrop);
    }
    scene.add(group);
  } catch(error) { dispose(); throw error; }
  function dispose(){group.removeFromParent();backdrop?.remove();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  let state=visualState();const hsl={},haze=new T.Color(0xc9c5b8);
  return {group, resize(width,height,pixelRatio=1){resolution.value.set(width*pixelRatio,height*pixelRatio);}, apply(next){state=next;group.visible=next.environmentOpacity>.001;
    if(backdrop)backdrop.style.opacity=String(next.environmentOpacity);
    for(const m of materials){m.opacity=m.userData.foreground?next.foregroundOpacity:next.environmentOpacity*(m.userData.contact?.12:1);m.color.copy(m.userData.baseColor);m.color.getHSL(hsl);m.color.setHSL(hsl.h,hsl.s*next.environmentSaturation,hsl.l);m.color.lerp(haze,(1-next.environmentContrast)*.12);}
    layers.Foreground.visible=next.foregroundOpacity>.001;
  }, getState(){let triangles=0,meshes=0;group.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);}});return {...state,visible:group.visible,groups:group.children.map(g=>g.name),triangles,meshes,resourceRequests:0};},dispose};
}

export function createArchitectureFocus(T, root) {
  const entries=[];
  root.children.filter(g=>!g.name.startsWith('mural-')).forEach(group=>group.traverse(mesh=>{
    if(mesh.isMesh)entries.push({mesh,group:group.name,base:null,mapped:false});
  }));
  const neutral=new T.Color(0xb2ada3);
  return state=>{for(const e of entries){const m=e.mesh.material;
    if(!e.base || Boolean(m.map)!==e.mapped){e.base=m.color.clone();e.mapped=Boolean(m.map);}
    const current=state.target==='mural-01'?e.group==='05_EastGallery':e.group==='03_MainHall';
    const weight=current?1:e.group==='03_MainHall'?.98:e.group==='02_Enclosure'||e.group==='07_Entrance'?.84:.92;
    m.color.copy(e.base).lerp(neutral,state.focusStrength*(current?.015:.12)).multiplyScalar(1-(1-weight)*( .45+state.focusStrength));
  }};
}
