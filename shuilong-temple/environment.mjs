// Design reconstruction, not a surveyed landscape or a botanical inventory.
// Generated watercolor assets are atmosphere only; never used as heritage evidence.
export const ENVIRONMENT_ASSETS = Object.freeze({
  tree:'./environment-assets/watercolor-tree.webp',
  mountains:'./environment-assets/distant-landscape.webp',
  mist:'./environment-assets/ivory-mist.webp',
});
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

export function createEnvironment(T, scene, options = {}) {
  const group = new T.Group(); group.name = 'Environment';
  const layers = Object.fromEntries(['Terrain','Field','Vegetation','Foreground','DistantMountains','Atmosphere'].map(name=>{
    const layer = new T.Group(); layer.name = name; group.add(layer); return [name,layer];
  }));
  let backdrop=null, disposed=false, resourceRequests=0;
  const assetState={tree:'idle',mountains:'idle',mist:'idle'},textures=new Set();
  const assets=options.assets||ENVIRONMENT_ASSETS;
  const loader=options.textureLoader||(typeof document!=='undefined'?new T.TextureLoader():null);
  const load=(key,ready)=>{
    if(!loader)return;
    resourceRequests++;assetState[key]='loading';
    loader.load(assets[key],texture=>{
      if(disposed){texture.dispose();return;}
      textures.add(texture);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
      assetState[key]='loaded';ready(texture);
    },undefined,()=>{if(!disposed)assetState[key]='failed';});
  };
  const materials = [], geometries = new Set(), resolution={value:new T.Vector2(1,1)};
  const heroObjects=[];
  const heroLayout=(object,position,scale)=>{
    heroObjects.push({object,basePosition:object.position.clone(),baseScale:object.scale.clone(),position:new T.Vector3(...position),scale:new T.Vector3(...scale)});
  };
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
    // Irregular soil wash: fading starts near the building, before the outer contour.
    const positions=[],colors=[],indices=[],segments=64,rings=[0,.42,.66,.85,1];
    const earth=new T.Color(0xd9d0bc);
    for(let r=0;r<rings.length;r++)for(let i=0;i<=segments;i++){
      const a=i/segments*Math.PI*2,noise=1+.13*Math.sin(a*3)+.08*Math.cos(a*7),radius=rings[r];
      positions.push(Math.cos(a)*19*radius*noise,-.13-.43*smooth((radius-.5)/.5),-1.75+Math.sin(a)*27*radius*noise);
      const tint=earth.clone().multiplyScalar(.98+.035*Math.sin(a*5+r));colors.push(tint.r,tint.g,tint.b,1-smooth((radius-.28)/.72));
      if(r&&i<segments){const b=r*(segments+1)+i,c=b-segments-1;indices.push(c,c+1,b,b,c+1,b+1);}
    }
    const ground=new T.BufferGeometry();ground.setAttribute('position',new T.Float32BufferAttribute(positions,3));ground.setAttribute('color',new T.Float32BufferAttribute(colors,4));ground.setIndex(indices);ground.computeVertexNormals();
    const soil=material(0xffffff);soil.vertexColors=true;soil.userData.inkColor=new T.Color(0x35454e);mesh('Terrain',ground,soil,[0,0,0]);
    // Six asymmetric clusters. Shared instancing keeps draw calls independent of leaf count.
    const clusters=[[7.1,-15,4.3],[7.8,-7,5.2],[7.4,4,3.5],[-7.2,11.5,3.6],[-7.1,-7,3.9],[-6.8,-16,2.8]];
    const crownGeometry=new T.IcosahedronGeometry(1,0),trunkGeometry=new T.CylinderGeometry(.07,.13,1,5);
    geometries.add(crownGeometry);geometries.add(trunkGeometry);
    const leaves=material(0xb0b19c),wood=material(0xa79b85),dummy=new T.Object3D();
    leaves.userData.wash=.62;wood.userData.wash=.7;
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
    // One shared texture; bottom-anchored billboards keep roots in world space.
    // Geometry fallback remains until decoding succeeds, never blank white cards.
    load('tree',texture=>{
      crowns.visible=trunks.visible=false;
      const foliage=material(0xffffff,true);foliage.map=texture;foliage.toneMapped=false;foliage.fog=false;
      foliage.userData.inkColor=new T.Color(0x71817a);foliage.alphaTest=.025;foliage.userData.wash=.86;foliage.needsUpdate=true;
      const card=new T.PlaneGeometry(1,1);card.translate(0,.5,0);
      clusters.forEach(([x,z,h],i)=>{
        const tree=mesh('Vegetation',card,foliage,[x,-.1,z],[h*.867*(i%2?-1:1),h,1]);
        const [hx,hz,hh]=[[7.7,-14,5.1],[8.2,-5,5.5],[7.6,10.5,4.6],[-7.2,12.5,5.2],[-7.8,-6,4.6],[-7.8,-17.5,4.1]][i];
        heroLayout(tree,[hx,-.1,hz],[hh*.867*(i%2?-1:1),hh,1]);
        tree.material.side=T.DoubleSide;tree.receiveShadow=false;tree.name='WatercolorTree';
        tree.onBeforeRender=(_r,_s,camera)=>{tree.quaternion.copy(camera.quaternion);tree.updateMatrixWorld();};
      });
    });
    const contact=material(0x74705f,true);contact.userData.contact=true;
    for(const [x,z] of clusters){const m=mesh('Vegetation',new T.CircleGeometry(.65,12),contact,[x,-.07,z],[1, .7, 1]);m.rotation.x=-Math.PI/2;}
    const stone=material(0xb3ae9e),rock=new T.IcosahedronGeometry(1,0);
    for(const [x,z,s] of [[-7,-15,.35],[8,-18,.5],[-9,12,.3],[11,-10,.25]])mesh('Vegetation',rock,stone,[x,-.03,z],[s,s*.45,s*.8]);
    // Low asymmetric foreground rocks, a design accent rather than recorded geology.
    const nearStone=material(0x8d8879);nearStone.userData.a01Only=true;
    for(const [x,z,s] of [[-6.8,-17.4,.82],[-7.8,-17,.62],[-6.4,-18.3,.55]])mesh('Foreground',rock,nearStone,[x,-.12,z],[s,s*.62,s*.85]);
    // Soft footprint contact under the plinth, not a circular halo or another render pass.
    const grounding=material(0x625a4b,true);grounding.userData.a01Only=true;grounding.userData.contact=true;
    grounding.onBeforeCompile=shader=>{
      shader.vertexShader='varying vec2 footprint;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n footprint=position.xy;');
      shader.fragmentShader='varying vec2 footprint;\n'+shader.fragmentShader.replace('#include <opaque_fragment>',`vec2 outside=max(abs(footprint)-vec2(5.65,14.5),0.0);diffuseColor.a*=exp(-3.0*dot(outside,outside));\n#include <opaque_fragment>`);
    };grounding.customProgramCacheKey=()=> 'a01-footprint-v1';
    const footprint=mesh('Terrain',new T.PlaneGeometry(16,34),grounding,[0,-.59,-1.75]);footprint.rotation.x=-Math.PI/2;footprint.receiveShadow=false;
    // Low foreground scrub occupies a single near corner, never the mural walls.
    const grass=material(0xb0ad98);grass.userData.foreground=true;
    for(let i=0;i<5;i++)mesh('Foreground',crownGeometry,grass,[-7.5+i*.35,.02,-17+Math.sin(i)*.6],[.35,.22,.3]);
    load('mist',texture=>{
      const wash=material(0xffffff,true);wash.map=texture;wash.toneMapped=false;wash.fog=false;
      wash.userData.inkColor=new T.Color(0x9aa9b0);wash.userData.inkOpacity=.52;wash.userData.wash=.55;wash.userData.foreground=true;wash.needsUpdate=true;
      for(const [x,z,w,angle] of [[-9,-5,13,.9],[9,8,12,1],[0,-19,14,.9]]){
        const cloud=mesh('Foreground',new T.PlaneGeometry(w,w*.337),wash,[x,-.06,z]);
        cloud.rotation.set(-Math.PI/2,0,angle);cloud.receiveShadow=false;cloud.name='WatercolorMist';
      }
    });
    // Designed skyline, not a reconstruction of the actual site's mountains.
    // DOM atmosphere behind the canvas cannot veil a mural or a roof.
    if(typeof document!=='undefined'){
      backdrop=document.createElement('div');backdrop.setAttribute('aria-hidden','true');backdrop.dataset.environment='distant-mountains';
      backdrop.style.cssText='position:fixed;inset:0;z-index:0;pointer-events:none;mask-image:radial-gradient(ellipse at 50% 48%,#000 22%,transparent 70%)';
      backdrop.innerHTML='<svg viewBox="0 0 1000 800" preserveAspectRatio="none" width="100%" height="100%"><path fill="#b7bcae" opacity=".19" d="M0 235 Q90 220 140 195 T240 210 Q300 170 370 180 T480 190 Q560 135 620 168 T760 190 Q850 155 920 195 L1000 235 V510 H0Z"/><path fill="#bfc0af" opacity=".12" d="M0 290 Q130 240 210 260 T370 245 Q480 225 560 250 T760 225 Q890 230 1000 280 V550 H0Z"/></svg>';
      document.body.prepend(backdrop);
      const mountains=document.createElement('img');mountains.alt='';mountains.decoding='async';
      mountains.style.cssText='position:absolute;left:-4%;top:-2%;width:108%;height:72%;object-fit:contain;opacity:.36';
      resourceRequests++;assetState.mountains='loading';
      mountains.onload=()=>{if(disposed)return;assetState.mountains='loaded';backdrop.replaceChildren(mountains);};
      mountains.onerror=()=>{if(!disposed)assetState.mountains='failed';};
      mountains.src=assets.mountains;
    }
    scene.add(group);
  } catch(error) { dispose(); throw error; }
  function dispose(){disposed=true;group.removeFromParent();backdrop?.remove();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
  let state=visualState();const hsl={},haze=new T.Color(0xf2eee4);
  return {group, resize(width,height,pixelRatio=1){resolution.value.set(width*pixelRatio,height*pixelRatio);}, apply(next){state=next;group.visible=next.environmentOpacity>.001;
    if(backdrop)backdrop.style.opacity=String(next.environmentOpacity);
    const hero=next.heroWeight??0;
    for(const entry of heroObjects){entry.object.position.copy(entry.basePosition).lerp(entry.position,hero);entry.object.scale.copy(entry.baseScale).lerp(entry.scale,hero);}
    if(backdrop){backdrop.style.transform=`translateY(${-4*hero}%)`;const image=backdrop.querySelector('img');if(image){image.style.opacity=String(.36-.18*hero);image.style.filter=`brightness(${1-.3*hero}) saturate(${1-.5*hero})`;}}
    for(const m of materials){m.opacity=(m.userData.foreground?next.foregroundOpacity:next.environmentOpacity*(m.userData.contact?.12:1))*(m.userData.wash??1)*(m.userData.a01Only?hero:1)*(1-hero*(1-(m.userData.inkOpacity??1)));m.color.copy(m.userData.baseColor);m.color.getHSL(hsl);m.color.setHSL(hsl.h,hsl.s*next.environmentSaturation,hsl.l);m.color.lerp(haze,(1-next.environmentContrast)*.12);if(m.userData.inkColor)m.color.lerp(m.userData.inkColor,hero);}
    for(const layer of Object.values(layers))for(const m of layer.children)if(m.material?.userData.a01Only)m.visible=hero>.001;
    layers.Foreground.visible=next.foregroundOpacity>.001;
  }, getState(){let triangles=0,meshes=0;group.traverseVisible(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count??m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1);}});return {...state,visible:group.visible,groups:group.children.map(g=>g.name),triangles,meshes,resourceRequests,assets:{...assetState}};},dispose};
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
