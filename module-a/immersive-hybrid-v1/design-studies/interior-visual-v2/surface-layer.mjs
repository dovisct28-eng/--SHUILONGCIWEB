// Isolated study adapter: original Combined B triangles, camera matrices and depth.
// Project only independently masked, newly generated surface patches onto
// original Combined B triangles. No extra runtime renderer, GLB or scene.
const references=new URL('../../assets/combined-b-transition/references/camera-manifest.json',import.meta.url);
const names=['gate-interior','stage-turn','corridor-advance','mural-approach'];
const times=[1,1.43,1.8,2];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const b2MuralVisibility=time=>smooth(1.59,1.75,time);
export function b2Weights(pose){
 const t=Math.max(1,Math.min(2,pose.time??0)),weights=[0,0,0,0];
 let i=0;while(i<2&&t>times[i+1])i++;const u=smooth(times[i],times[i+1],t);weights[i]=1-u;weights[i+1]=u;
 const yaw=Math.abs(Math.atan2(pose.target[0]-pose.position[0],pose.position[2]-pose.target[2]));
 const discovery=1-smooth(.04,.30,yaw)*smooth(1.94,2,t);
 const front=1-smooth(0,.7,pose.muralFront??0);
 return {weights,gain:smooth(.72,1.43,pose.time??0)*discovery*front};
}
export async function installStudyLayers(runtime,T,{direction='B'}={}){
 const base=new URL(`./assets/prepared/${direction}/`,import.meta.url);
 let mode='hybrid',last=runtime.pose,disposed=false;const textures=[],layers=[];let group;
 try{
  const response=await fetch(references);if(!response.ok)throw Error('新机位清单不可用');
  const manifest=await response.json();
  async function load(path,color){const img=new Image();img.src=new URL(path,base).href;await img.decode();const texture=new T.Texture(img);texture.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;texture.minFilter=T.LinearFilter;texture.magFilter=T.LinearFilter;texture.generateMipmaps=false;texture.needsUpdate=true;textures.push(texture);return texture;}
  const loaded=await Promise.allSettled([...names.map(n=>load(`${n}.webp`,true)),...names.map(n=>load(`${n}-valid-rg.png`,false))]);
  if(loaded.some(v=>v.status==='rejected'))throw Error('融合素材加载失败');
  const maps=loaded.slice(0,4).map(v=>v.value),masks=loaded.slice(4).map(v=>v.value);
  const matrices=names.map(name=>{const c=manifest.results.find(x=>x.name===name);if(!c)throw Error(`缺少机位 ${name}`);return new T.Matrix4().fromArray(c.projection).multiply(new T.Matrix4().fromArray(c.cameraMatrix).invert());});
  const scene=(()=>{let x=runtime.root;while(x.parent)x=x.parent;if(!x.isScene)throw Error('建筑场景不可用');return x;})();
  group=new T.Group();group.name='InteriorVisualV2-CombinedB-surface-projections';scene.add(group);runtime.root.updateMatrixWorld(true);
  function extract(mesh,predicate){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index,ids=[];if(!p||!n)return null;for(let i=0;i<(idx?.count??p.count);i+=3){const tri=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);if(tri.every(k=>predicate(p.getX(k),p.getY(k),p.getZ(k),n.getX(k),n.getY(k),n.getZ(k))))ids.push(...tri);}if(!ids.length)return null;const copy=g.clone();copy.setIndex(ids);return copy;}
  function add(mesh,geometry,kind){
   const u={gain:{value:0},weights:{value:new T.Vector4()},surface:{value:kind==='wall'?0:kind==='floor'?1:2}};
   names.forEach((_,i)=>{u['picture'+i]={value:maps[i]};u['mask'+i]={value:masks[i]};u['matrix'+i]={value:matrices[i]};});
   const mat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,depthTest:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:true});
   mat.onBeforeCompile=s=>{Object.assign(s.uniforms,u);s.vertexShader='varying vec3 b2World;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nb2World=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader=`varying vec3 b2World; uniform sampler2D picture0,picture1,picture2,picture3,mask0,mask1,mask2,mask3; uniform mat4 matrix0,matrix1,matrix2,matrix3; uniform vec4 weights; uniform float gain; uniform int surface;
vec4 b2Sample(sampler2D picture,sampler2D mask,mat4 matrix){vec4 q=matrix*vec4(b2World,1.);vec2 uv=q.xy/q.w*.5+.5;if(q.w<=0.||uv.x<=0.||uv.x>=1.||uv.y<=0.||uv.y>=1.)return vec4(0.);vec4 m=texture2D(mask,uv);float coverage=surface==0?m.r:surface==1?m.g:m.b;return vec4(texture2D(picture,uv).rgb,coverage);}\n`+s.fragmentShader;
    s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
vec4 a=b2Sample(picture0,mask0,matrix0),b=b2Sample(picture1,mask1,matrix1),c=b2Sample(picture2,mask2,matrix2),d=b2Sample(picture3,mask3,matrix3);vec4 k=vec4(a.a,b.a,c.a,d.a)*weights;float total=dot(k,vec4(1.));if(total<.001)discard;diffuseColor.rgb=(a.rgb*k.x+b.rgb*k.y+c.rgb*k.z+d.rgb*k.w)/total;diffuseColor.a*=min(1.,total)*gain;`);};
   mat.customProgramCacheKey=()=>`interior-v2-${kind}`;const proxy=new T.Mesh(geometry,mat);proxy.matrixAutoUpdate=false;proxy.matrix.copy(mesh.matrixWorld);proxy.frustumCulled=false;proxy.renderOrder=2;proxy.name=`InteriorVisualV2-${kind}-${mesh.parent.name}`;group.add(proxy);layers.push({proxy,mat,u,kind});
  }
  runtime.root.traverse(mesh=>{if(!mesh.isMesh||!['02_Enclosure','05_EastGallery'].includes(mesh.parent.name))return;const key=mesh.material?.userData?.textureKey;
   if(key==='plaster'){const g=extract(mesh,(x,y,z,nx)=>x>4.4&&nx<-.9);if(g)add(mesh,g,'wall');}
   if(mesh.parent.name==='05_EastGallery'&&key==='stone'){const g=extract(mesh,(x,y,z,nx,ny)=>ny>.9&&y>.30&&y<.33);if(g)add(mesh,g,'floor');}
   if(mesh.parent.name==='05_EastGallery'&&key==='wood'){const g=extract(mesh,(x,y)=>y>.36&&y<3.2);if(g)add(mesh,g,'wood');}
  });
  if(!layers.some(l=>l.kind==='wall')||!layers.some(l=>l.kind==='floor'))throw Error('未找到 Combined B 的墙面或地面');
  function update(pose){last=pose;const {weights,gain}=b2Weights(pose);for(const l of layers){l.u.weights.value.set(...weights);l.u.gain.value=mode==='original'?0:gain*(l.kind==='wall'?.74:l.kind==='floor'?.30:.32);l.proxy.visible=l.u.gain.value>.001;}}
  const previous=runtime.setCamera;runtime.setCamera=function(pose,options){update(pose);return previous.call(runtime,pose,options);};update(last);
  return {setMode(v){if(!['original','hybrid'].includes(v))throw Error('未知显示模式');mode=v;update(last);runtime.invalidate();},get state(){return {mode,pose:last,weights:b2Weights(last),textures:textures.length,layers:layers.map(l=>({kind:l.kind,name:l.proxy.name,opacity:l.u.gain.value,visible:l.proxy.visible}))};},dispose(){if(disposed)return;disposed=true;runtime.setCamera=previous;for(const l of layers){l.proxy.removeFromParent();l.proxy.geometry.dispose();l.mat.dispose();}for(const t of textures)t.dispose();group.removeFromParent();}};
 }catch(e){for(const l of layers){l.proxy.removeFromParent();l.proxy.geometry.dispose();l.mat.dispose();}for(const t of textures)t.dispose();group?.removeFromParent();throw e;}
}
