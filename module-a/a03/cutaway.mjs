import {cutawayState} from '../a04/cutaway-state.mjs';
const ease=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
// Cut existing material fragments; no new geometry, architectural skins or masks.
export function createA03Cutaway(root){
  const hall=[],preserved=[],galleries=[],walls=[],patched=new Set();
  const galleryReveal={value:0},wallReveal={value:0};
  const movie={weight:{value:0},summary:{value:0},x:{value:0},z:{value:0},hx:{value:0},hz:{value:0},wall:{value:0}};
  function patch(m,uniform,name,region){
    if(patched.has(m))return;patched.add(m);
    const compile=m.onBeforeCompile,cache=m.customProgramCacheKey.bind(m);
    m.onBeforeCompile=s=>{compile.call(m,s);s.uniforms[name]=uniform;
      for(const [key,value]of Object.entries(movie))s.uniforms['a04Cut'+key]=value;
      s.vertexShader='varying vec3 a03CutPosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\na03CutPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
      s.fragmentShader=`varying vec3 a03CutPosition;uniform float ${name};
        uniform float a04Cutweight,a04Cutsummary,a04Cutx,a04Cutz,a04Cuthx,a04Cuthz,a04Cutwall;\n`+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
        float cutRegion=${region};float cut=${name}*cutRegion;
        if(a04Cutweight>0.){
        float localWindow=(1.-smoothstep(a04Cuthx-.02,a04Cuthx,abs(a03CutPosition.x-a04Cutx)))*(1.-smoothstep(a04Cuthz-.02,a04Cuthz,abs(a03CutPosition.z-a04Cutz)));
        float movieWindow=localWindow*(1.-a04Cutsummary);
        ${name==='a03WallReveal'?'movieWindow*=a04Cutwall*step(.86,a03CutPosition.y)*(1.-step(2.95,a03CutPosition.y))*step(4.2,abs(a03CutPosition.x));':''}
        cut=max(cut,a04Cutweight*movieWindow);
        }
        if(cut>0.){
          if(cut>.999)discard;
          float cutNoise=fract(sin(dot(floor(a03CutPosition.xz*85.+a03CutPosition.y*31.),vec2(127.1,311.7)))*43758.5453);
          if(cut>cutNoise)discard;
        }`);
    };m.customProgramCacheKey=()=>cache()+'-'+name+'-selective-v4';m.needsUpdate=true;
  }
  root?.children.filter(g=>!g.name.startsWith('mural-')).forEach(g=>g.traverse(mesh=>{
    if(!mesh.isMesh)return;const m=mesh.material,key=m.userData.textureKey;
    if(key==='roof'){
      const entry={mesh,shadow:mesh.castShadow};
      if(g.name==='03_MainHall'){hall.push(entry);patch(m,{value:0},'a03HallCut','0.');}
      else if(['04_WestGallery','05_EastGallery'].includes(g.name)){
        galleries.push(entry);patch(m,galleryReveal,'a03GalleryCut','1.-step(7.1,a03CutPosition.z)');
      }else preserved.push(entry);
    }
    if(['02_Enclosure','03_MainHall','05_EastGallery','04_WestGallery'].includes(g.name)&&['brick','plaster'].includes(key)){
      walls.push({mesh,shadow:mesh.castShadow});
      patch(m,wallReveal,'a03WallReveal','(1.-step(-4.2,a03CutPosition.x))*step(-15.15,a03CutPosition.z)*(1.-step(-8.1,a03CutPosition.z))*step(.86,a03CutPosition.y)*(1.-step(2.95,a03CutPosition.y))');
    }
  }));
  const allRoofs=[...hall,...galleries,...preserved];
  let state={active:false};
  const roof=(entry,opacity)=>{const {mesh}=entry,m=mesh.material;mesh.visible=opacity>.001;
    const soft=opacity>.001&&opacity<.999;if(m.transparent!==soft){m.transparent=soft;m.needsUpdate=true;}
    m.opacity=opacity;m.depthWrite=!soft;mesh.castShadow=entry.shadow&&opacity>.999;};
  return {
    apply(screens,reduced=false,tour=null){
      const local=screens-10.2,active=local>0&&local<=3.002;
      const still=reduced&&active&&local>.55&&local<2.85;
      const main=still?1:active?ease((local-.55)/.55):0,side=still?1:active?ease((local-1.1)/.45):0;
      const handoff=active?ease((local-2.85)/.15):0;
      const movieState=cutawayState(tour);
      const bridge=active?handoff:tour?1:0;
      const current=movieState.active?movieState:{center:[-1.4,-11.75],half:[6.9,4.4],summary:0};
      movie.weight.value=bridge;movie.summary.value=current.summary;movie.wall.value=current.wallWeight??1;movie.x.value=current.center[0];movie.z.value=current.center[1];movie.hx.value=current.half[0];movie.hz.value=current.half[1];
      galleryReveal.value=wallReveal.value=side*(1-bridge);
      if(active&&!tour){
        for(const e of hall)roof(e,(1-main)*(1-handoff)+handoff);
        for(const e of galleries)roof(e,1);
        for(const e of preserved)roof(e,1);
        for(const e of galleries)e.mesh.castShadow=e.shadow&&side<.001&&handoff<.001;
      }else if(tour||screens>13.2){for(const e of allRoofs)roof(e,1);}
      else for(const e of allRoofs){e.mesh.visible=true;e.mesh.castShadow=e.shadow;}
      const fullRoof=movieState.active&&movieState.summary>=.999;
      for(const e of [...hall,...galleries])if(tour)e.mesh.castShadow=e.shadow&&fullRoof;
      for(const e of walls)e.mesh.castShadow=e.shadow&&side*(1-handoff)<.001&&(!tour||fullRoof);
      state={active,main,side,handoff,wall:wallReveal.value,
        preserved:preserved.map(e=>({group:e.mesh.parent.name,visible:e.mesh.visible,opacity:e.mesh.material.opacity})),
        mainRoofDrawn:hall.some(e=>e.mesh.visible),galleryCut:galleryReveal.value,movie:movieState};
    },getState:()=>state,
  };
}
