import {corridorWeights,corridorPhase,FIRST_MURAL} from './corridor-path.mjs';

// These are shallow, material-bearing skins of EXISTING surfaces. Original
// meshes keep their depth, shadows and silhouette; no screen-facing photograph.
export function createCorridorLayers({T,scene,root,renderer,camera,invalidate}){
 const group=new T.Group();group.name='V22-surface-layers';scene.add(group);
 const layers=[],textures=[];let status='idle',error=null,loading=null,generation=0,disposed=false,mode='hybrid',override=null,time=0,enabled=true;
 const decode=[];
 const base=new URL('../assets/hybrid-v2-2/',import.meta.url);
 function extract(mesh,predicate){
  const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index,ids=[];
  for(let i=0;i<(index?.count??p.count);i+=3){const tri=[0,1,2].map(j=>index?index.getX(i+j):i+j);
   if(tri.every(k=>predicate(p.getX(k),p.getY(k),p.getZ(k),n.getX(k),n.getY(k),n.getZ(k))))ids.push(...tri);
  }
  if(!ids.length)return null;const skin=g.clone();skin.setIndex(ids);return skin;
 }
 function skin(mesh,geometry,texture,kind,zone){
  const material=mesh.material.clone();material.transparent=true;material.depthWrite=false;material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;
  const uniforms={gain:{value:0},detailMap:{value:texture}};
  material.onBeforeCompile=shader=>{
   Object.assign(shader.uniforms,uniforms);
   shader.vertexShader='varying vec3 galleryWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\ngalleryWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader='varying vec3 galleryWorld;uniform float gain;uniform sampler2D detailMap;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    vec2 detailUv=${kind==='floor'?'galleryWorld.xz/vec2(1.75,3.2)':'galleryWorld.zy/vec2(5.6,2.8)'};
    vec3 detail=texture2D(detailMap,detailUv).rgb*2.;
    diffuseColor.rgb*=detail;
    diffuseColor.a*=gain*smoothstep(-15.1,-14.7,galleryWorld.z)*(1.-smoothstep(10.15,10.55,galleryWorld.z));`);
  };
  material.customProgramCacheKey=()=>`v22-planar-${kind}`;
  const proxy=new T.Mesh(geometry,material);proxy.matrixAutoUpdate=false;proxy.matrix.copy(mesh.matrixWorld);proxy.receiveShadow=mesh.receiveShadow;proxy.castShadow=false;proxy.renderOrder=2;proxy.name=`V22-${zone}-${kind}`;group.add(proxy);
  layers.push({proxy,material,uniforms,zone,kind,source:mesh.parent.name,triangles:geometry.index.count/3});
 }
 function disposeTexture(t){t.image?.close?.();t.dispose();}
 function clear(){for(const l of layers){l.proxy.removeFromParent();l.proxy.geometry.dispose();l.material.dispose();}layers.length=0;for(const t of textures)disposeTexture(t);textures.length=0;}
 async function fetchAsset(url,type){const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);try{const response=await fetch(url,{signal:abort.signal});if(!response.ok)throw Error('室内资源未能读取');return await (type==='json'?response.json():response.blob());}finally{clearTimeout(timer);}}
 async function load(retry=false){
  if(disposed)return false;if(loading)return loading;if(status==='ready'&&!retry)return true;
  status='loading';error=null;const token=++generation;clear();
  loading=(async()=>{try{
   const manifest=await fetchAsset(new URL(`layers.json${retry?'?retry='+token:''}`,base),'json');
   const loaded=await Promise.allSettled(manifest.textures.map(async row=>{const start=performance.now(),blob=await fetchAsset(new URL(row.url+(retry?'?retry='+token:''),base),'blob'),bitmap=await createImageBitmap(blob),tex=new T.Texture(bitmap);tex.flipY=false;tex.needsUpdate=true;decode.push({id:row.id,loadAndDecodeMs:performance.now()-start,width:bitmap.width,height:bitmap.height});tex.colorSpace=T.NoColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return {id:row.id,tex};}));
   const good=loaded.filter(r=>r.status==='fulfilled').map(r=>r.value);
   if(disposed||token!==generation){for(const x of good)disposeTexture(x.tex);return false;}
   if(loaded.some(r=>r.status==='rejected')){for(const x of good)disposeTexture(x.tex);throw Error('室内材质未能加载');}
   for(const x of good)textures.push(x.tex);const maps=Object.fromEntries(good.map(x=>[x.id,x.tex]));root.updateMatrixWorld(true);
   root.traverse(mesh=>{if(!mesh.isMesh||!['02_Enclosure','03_MainHall','05_EastGallery'].includes(mesh.parent.name))return;
    const key=mesh.material.userData.textureKey;
    if(key==='plaster'){
     const g=extract(mesh,(x,y,z,nx)=>x>4.4&&nx<-.9);if(g)skin(mesh,g,maps.plaster,'wall',mesh.parent.name==='03_MainHall'?'far':'mid');
    }
    if(mesh.parent.name==='05_EastGallery'&&key==='stone'){
     const g=extract(mesh,(x,y,z,nx,ny)=>ny>.9&&y>.30&&y<.33);if(g)skin(mesh,g,maps.paving,'floor','mid');
    }
   });
   if(!layers.length)throw Error('模型表面未匹配');
   // Compile the actual lit surface programs during preload, not at the first
   // visible fusion frame. All gains are still zero and geometry is unchanged.
   const compileStart=performance.now();await renderer.compileAsync(scene,camera);decode.push({id:'surface-programs',compileMs:performance.now()-compileStart});
   if(disposed||token!==generation)return false;
   status='ready';update(time);invalidate();return true;
  }catch(e){if(!disposed){clear();status='failed';error=e.message;invalidate();}return false;}finally{loading=null;}})();return loading;
 }
 function update(t){time=t;const w=corridorWeights(t,status==='ready'&&enabled);const manual=override===null?null:Math.max(0,Math.min(1,override));
  for(const l of layers){const value=mode==='original'||time<=1.6||status!=='ready'||!enabled?0:(manual??w[l.zone]);l.uniforms.gain.value=value;l.proxy.visible=value>.00001;}
  group.visible=mode!=='original';return w;
 }
 return {load,update,get status(){return status;},get error(){return error;},setEnabled(v){enabled=v;update(time);},
  setMode(value){if(!['original','hybrid'].includes(value))throw Error('Unknown composite mode');mode=value;update(time);invalidate();},
  setBlend(value){override=value===null?null:Number(value);update(time);invalidate();},
  state:()=>({version:'2.2-procedural-candidate-1',phase:corridorPhase(time),progress:time,status,error,mode,manualBlend:override,weights:corridorWeights(time,status==='ready'&&enabled),effective:layers.map(l=>({name:l.proxy.name,weight:l.uniforms.gain.value,visible:l.proxy.visible,triangles:l.triangles,source:l.source})),foreground:'original geometry, unchanged',textures:textures.length,textureBytesEstimate:textures.reduce((n,t)=>n+t.image.width*t.image.height*4*4/3,0),decode,mural:{...FIRST_MURAL,enabled:false,source:'independent real mural; future docking'}}),
  dispose(){disposed=true;generation++;clear();group.removeFromParent();}
 };
}
