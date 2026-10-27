import {createCorridorLayers as createV22} from './corridor-layers-v22.mjs';
import {corridorWeights,corridorPhase,FIRST_MURAL,sampleGallery} from './corridor-path.mjs';
import {FINISH_DEFAULTS,finishWeights,finishNoise,finishShader} from './corridor-finish.mjs';

export function createCorridorLayers({T,scene,root,renderer,camera,invalidate}){
 const legacy=createV22({T,scene,root,renderer,camera,invalidate:()=>{}});
 const group=new T.Group();group.name='V221-original-surface-finish';scene.add(group);
 const layers=[],timings=[],switches={...FINISH_DEFAULTS};
 let status='idle',error=null,loading=null,disposed=false,mode='hybrid',blend=null,time=0,enabled=true,generation=0;
 function clear(){for(const l of layers){if(l.direct)l.proxy.material=l.original;else{l.proxy.removeFromParent();l.proxy.geometry.dispose();}l.material.dispose();}layers.length=0;}
 function extract(mesh,predicate){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index,ids=[];
  for(let i=0;i<(idx?.count??p.count);i+=3){const tri=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);if(tri.every(k=>predicate(p.getX(k),p.getY(k),p.getZ(k),n.getX(k),n.getY(k),n.getZ(k))))ids.push(...tri);}
  if(!ids.length)return null;const copy=g.clone();copy.setIndex(ids);return copy;}
 function skin(mesh,g,kind,direct=false){
  const mat=mesh.material.clone(),originalCompile=mesh.material.onBeforeCompile.bind(mesh.material),surface=direct&&mesh.material.userData.textureKey==='roof'?'roof':kind,code=finishShader(surface),uniforms={gain:{value:0},finishLight:{value:0},finishMaterial:{value:0}};
  if(!direct){mat.transparent=true;mat.depthWrite=false;mat.polygonOffset=true;mat.polygonOffsetFactor=-1;mat.polygonOffsetUnits=-1;}
  mat.onBeforeCompile=s=>{if(direct)originalCompile(s,renderer);Object.assign(s.uniforms,uniforms);
   s.vertexShader='varying vec3 galleryWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngalleryWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   s.fragmentShader='varying vec3 galleryWorld;uniform float gain;uniform float finishLight;uniform float finishMaterial;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('void main() {',finishNoise+'\nvoid main() {');
   s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nfloat surfaceMask=smoothstep(-15.1,-14.7,galleryWorld.z)*(1.-smoothstep(10.15,10.55,galleryWorld.z));\nvec3 originalDiffuse=diffuseColor.rgb;${code.map}\ndiffuseColor.rgb=mix(originalDiffuse,diffuseColor.rgb,finishMaterial${direct?'*gain*surfaceMask':''});\n${direct?'':'diffuseColor.a*=gain*surfaceMask;'}`);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nfloat originalRoughness=roughnessFactor;${code.roughness}\nroughnessFactor=mix(originalRoughness,roughnessFactor,finishMaterial${direct?'*gain*surfaceMask':''});`);
   s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`vec3 unlitFinish=outgoingLight;${code.light}\n${direct?'outgoingLight=mix(unlitFinish,outgoingLight,gain*surfaceMask);':''}\n#include <opaque_fragment>`);};
  mat.customProgramCacheKey=()=>`v221-surface-${surface}`;
  const proxy=direct?mesh:new T.Mesh(g,mat);if(!direct){proxy.matrixAutoUpdate=false;proxy.matrix.copy(mesh.matrixWorld);proxy.receiveShadow=mesh.receiveShadow;proxy.castShadow=false;proxy.renderOrder=2;proxy.name=`V221-${mesh.parent.name}-${kind}`;group.add(proxy);}
  layers.push({proxy,material:mat,original:mesh.material,direct,uniforms,kind,triangles:(g??mesh.geometry).index.count/3,source:mesh.parent.name});}
 function update(t){time=t;const ready=status==='ready'&&enabled,w=corridorWeights(t,ready);
  legacy.update(t);
  for(const l of layers){const amount=finishWeights(t,blend,mode,ready),on=switches[l.kind];l.uniforms.gain.value=(on||switches.lighting)?amount:0;l.uniforms.finishMaterial.value=on?1:0;l.uniforms.finishLight.value=switches.lighting?1:0;if(l.direct)l.proxy.material=l.uniforms.gain.value>.00001?l.material:l.original;else l.proxy.visible=l.uniforms.gain.value>.00001;}
  group.visible=mode==='hybrid';return w;}
 async function load(retry=false){if(disposed)return false;if(loading)return loading;if(status==='ready'&&!retry)return true;
  status='loading';error=null;const token=++generation;clear();const began=performance.now();
  loading=(async()=>{try{
   if(!await legacy.load(retry))throw Error(legacy.error??'廊道材料读取失败');if(disposed||generation!==token)return false;
   const geometryStart=performance.now();root.updateMatrixWorld(true);
   root.traverse(mesh=>{if(!mesh.isMesh||!['02_Enclosure','03_MainHall','05_EastGallery'].includes(mesh.parent.name))return;
    const key=mesh.material.userData.textureKey;
    if(key==='plaster'){const g=extract(mesh,(x,y,z,nx)=>x>4.4&&nx<-.9);if(g)skin(mesh,g,'wall');}
    if(mesh.parent.name==='05_EastGallery'&&key==='stone'){const g=extract(mesh,(x,y,z,nx,ny)=>ny>.9&&y>.30&&y<.33);if(g)skin(mesh,g,'floor');}
    if(mesh.parent.name==='05_EastGallery'&&['wood','roof'].includes(key))skin(mesh,null,'wood',true);
   });timings.push({id:'geometry',start:geometryStart,ms:performance.now()-geometryStart,skins:layers.length});
   if(layers.length<3)throw Error('原模型廊道表面未匹配');
   // Visible zero-alpha objects are included in compile traversal without a flash.
   const warmGroup=new T.Group();scene.add(warmGroup);
   group.visible=true;for(const l of layers){l.proxy.visible=true;l.uniforms.gain.value=0;if(l.direct){const mesh=new T.Mesh(l.proxy.geometry,l.material);mesh.matrixAutoUpdate=false;mesh.matrix.copy(l.proxy.matrixWorld);mesh.receiveShadow=l.proxy.receiveShadow;warmGroup.add(mesh);l.material.colorWrite=false;l.material.depthWrite=false;}}
   legacy.setMode('hybrid');legacy.setEnabled(true);legacy.setBlend(0);legacy.update(2);
   const legacyGroup=scene.getObjectByName('V22-surface-layers');legacyGroup.visible=true;legacyGroup.children.forEach(o=>o.visible=true);
   const warmCamera=camera.clone(),pose=sampleGallery(1.8);warmCamera.position.fromArray(pose.position);warmCamera.lookAt(...pose.target);warmCamera.updateMatrixWorld();
   const compile=performance.now();try{await renderer.compileAsync(scene,warmCamera);}finally{warmGroup.removeFromParent();for(const l of layers)if(l.direct){l.material.colorWrite=l.original.colorWrite;l.material.depthWrite=l.original.depthWrite;}}
   timings.push({id:'visible-program-compile',start:compile,ms:performance.now()-compile,programs:renderer.info.programs.length});
   if(disposed||generation!==token)return false;
   group.visible=legacyGroup.visible=true;legacy.setMode('hybrid');legacy.setEnabled(true);legacy.setBlend(0);legacy.update(2);legacyGroup.children.forEach(o=>o.visible=true);
   for(const l of layers){l.proxy.visible=true;if(l.direct)l.proxy.material=l.material;}
   const target=new T.WebGLRenderTarget(64,64,{type:T.HalfFloatType}),oldTarget=renderer.getRenderTarget(),auto=renderer.info.autoReset;
   const upload=performance.now();try{renderer.info.autoReset=false;renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,warmCamera);}finally{renderer.setRenderTarget(oldTarget);renderer.info.autoReset=auto;target.dispose();}
   timings.push({id:'offscreen-first-draw',start:upload,ms:performance.now()-upload});status='ready';legacy.setMode(mode==='legacy'?'hybrid':'original');legacy.setEnabled(enabled);legacy.setBlend(blend);timings.push({id:'total-prepare',start:began,ms:performance.now()-began});update(time);invalidate();return true;
  }catch(e){if(!disposed){clear();legacy.setMode('original');status='failed';error=e.message;invalidate();}return false;}finally{loading=null;}})();return loading;}
 return {load,update,get status(){return status;},get error(){return error;},setEnabled(v){enabled=Boolean(v);legacy.setEnabled(status==='ready'&&enabled);update(time);invalidate();},
  setMode(v){if(!['original','legacy','hybrid'].includes(v))throw Error('Unknown composite mode');mode=v;legacy.setMode(mode==='legacy'?'hybrid':'original');update(time);invalidate();},
  setBlend(v){if(v!==null&&!Number.isFinite(Number(v)))throw Error('Invalid blend');blend=v===null?null:Math.max(0,Math.min(1,Number(v)));legacy.setBlend(blend);update(time);invalidate();},
  setFeature(k,v){if(!(k in switches))throw Error('Unknown surface feature');switches[k]=Boolean(v);update(time);invalidate();},
  state:()=>({version:'2.2.1-candidate-1',phase:corridorPhase(time),progress:time,status,error,mode,manualBlend:blend,switches:{...switches},weights:corridorWeights(time,status==='ready'&&enabled),effective:layers.map(l=>({name:l.proxy.name,weight:l.uniforms.gain.value,visible:l.proxy.visible,triangles:l.triangles,source:l.source,kind:l.kind,directMaterial:l.direct})),geometryBytesEstimate:layers.filter(l=>!l.direct).reduce((sum,l)=>sum+Object.values(l.proxy.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+l.proxy.geometry.index.array.byteLength,0),foreground:'original geometry, unchanged',textures:legacy.state().textures,textureBytesEstimate:legacy.state().textureBytesEstimate,decode:legacy.state().decode,preparation:timings.map(t=>({...t})),programs:renderer.info.programs.length,legacyVersion:legacy.state().version,mural:{...FIRST_MURAL,enabled:false}}),
  dispose(){disposed=true;generation++;legacy.dispose();clear();group.removeFromParent();}};
}
