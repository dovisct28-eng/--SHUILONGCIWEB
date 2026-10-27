// Experimental projected scene layers; keep original meshes, camera and depth.
// Conservative reference-image regions limit projection to blank wall or floor.
const base=new URL('../assets/v24a/',import.meta.url);
const specs=[['g01','gate-interior'],['g02','corridor-start'],['g03','mural-look']];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function v24aWeights(pose){const t=pose.time??0,dx=pose.target[0]-pose.position[0],dz=pose.position[2]-pose.target[2],yaw=Math.atan2(dx,dz),second=smooth(1.36,1.65,t),third=smooth(.06,.40,yaw)*smooth(1.9,2,t);return {handoff:smooth(1.03,1.42,t),weights:[1-second,second*(1-third),second*third]};}
export async function installV24Layers(runtime,T){
 let mode='hybrid',manual=null,enabled={wall:true,floor:true},last=runtime.pose,disposed=false;
 const started=performance.now(),timings=[],textures=[],layers=[];
 const manifest=await (await fetch(new URL('references/camera-manifest.json',base))).json();
 async function image(url,id,color){const start=performance.now();const img=new Image();img.src=url.href;await img.decode();const t=new T.Texture(img);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.needsUpdate=true;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;textures.push(t);timings.push({id,loadDecodeMs:performance.now()-start,width:img.naturalWidth,height:img.naturalHeight});return t;}
 let maps;const loaded=await Promise.allSettled(specs.map(([id])=>image(new URL(`generated/${id}.webp`,base),id,true)));
 if(loaded.some(x=>x.status==='rejected')){for(const t of textures)t.dispose();throw Error('场景图片加载失败');}maps=loaded.map(x=>x.value);
 const matrices=specs.map(([,name])=>{const r=manifest.find(x=>x.name===name);if(!r)throw Error(`Missing camera ${name}`);return new T.Matrix4().fromArray(r.projection).multiply(new T.Matrix4().fromArray(r.cameraMatrix).invert());});
 const scene=(()=>{let x=runtime.root;while(x.parent)x=x.parent;if(!x.isScene)throw Error('Original scene not found');return x;})();
 const group=new T.Group();group.name='V24A-projected-scene-candidate';scene.add(group);runtime.root.updateMatrixWorld(true);
 function extract(mesh,predicate){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,idx=g.index,ids=[];for(let i=0;i<(idx?.count??p.count);i+=3){const tri=[0,1,2].map(j=>idx?idx.getX(i+j):i+j);if(tri.every(k=>predicate(p.getX(k),p.getY(k),p.getZ(k),n.getX(k),n.getY(k),n.getZ(k))))ids.push(...tri);}if(!ids.length)return null;const out=g.clone();out.setIndex(ids);return out;}
 function add(mesh,geometry,kind){
  const u={scene0:{value:maps[0]},scene1:{value:maps[1]},scene2:{value:maps[2]},matrix0:{value:matrices[0]},matrix1:{value:matrices[1]},matrix2:{value:matrices[2]},weights:{value:new T.Vector3()},gain:{value:0},surface:{value:kind==='wall'?0:1}};
  const mat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,depthTest:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,toneMapped:true});
  mat.onBeforeCompile=s=>{Object.assign(s.uniforms,u);s.vertexShader='varying vec3 vGalleryWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvGalleryWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   s.fragmentShader=`varying vec3 vGalleryWorld; uniform sampler2D scene0,scene1,scene2; uniform mat4 matrix0,matrix1,matrix2; uniform vec3 weights; uniform float gain; uniform int surface;
vec4 projectLayer(sampler2D picture,mat4 matrix,float wallLeft,float floorMax){vec4 q=matrix*vec4(vGalleryWorld,1.);vec2 uv=q.xy/q.w*.5+.5;float edge=smoothstep(0.,.10,uv.x)*smoothstep(0.,.10,uv.y)*smoothstep(0.,.10,1.-uv.x)*smoothstep(0.,.10,1.-uv.y);if(q.w<=0.)edge=0.;float region=surface==0?smoothstep(wallLeft,wallLeft+.06,uv.x):(1.-smoothstep(floorMax-.05,floorMax,uv.y));return vec4(texture2D(picture,clamp(uv,0.,1.)).rgb,edge*region);}\n`+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
vec4 a=projectLayer(scene0,matrix0,.62,.0),b=projectLayer(scene1,matrix1,.52,.42),c=projectLayer(scene2,matrix2,.36,.38);vec3 k=vec3(a.a,b.a,c.a)*weights;float total=k.x+k.y+k.z;if(total<.001)discard;diffuseColor.rgb=(a.rgb*k.x+b.rgb*k.y+c.rgb*k.z)/total;diffuseColor.a*=min(1.,total)*gain;`);};
  mat.customProgramCacheKey=()=>`v24a-project-${kind}`;
  const proxy=new T.Mesh(geometry,mat);proxy.matrixAutoUpdate=false;proxy.matrix.copy(mesh.matrixWorld);proxy.frustumCulled=false;proxy.renderOrder=2;proxy.name=`V24A-${kind}-${mesh.parent.name}`;group.add(proxy);layers.push({proxy,mat,u,kind});
 }
 runtime.root.traverse(mesh=>{if(!mesh.isMesh||!['02_Enclosure','05_EastGallery'].includes(mesh.parent.name))return;const key=mesh.material.userData.textureKey;
  if(key==='plaster'){const g=extract(mesh,(x,y,z,nx)=>x>4.4&&nx<-.9);if(g)add(mesh,g,'wall');}
  if(mesh.parent.name==='05_EastGallery'&&key==='stone'){const g=extract(mesh,(x,y,z,nx,ny)=>ny>.9&&y>.30&&y<.33);if(g)add(mesh,g,'floor');}
 });
 if(!layers.some(l=>l.kind==='wall')||!layers.some(l=>l.kind==='floor')){for(const l of layers){l.proxy.geometry.dispose();l.mat.dispose();}for(const t of textures)t.dispose();group.removeFromParent();throw Error('Could not match original wall/floor geometry');}
 function update(pose){last=pose;const {handoff,weights}=v24aWeights(pose);
  const strength=manual??handoff;for(const l of layers){l.u.weights.value.set(...weights);l.u.gain.value=mode==='original'||!enabled[l.kind]?0:strength*(mode==='ai'?1:.76);l.proxy.visible=l.u.gain.value>.001;}}
 const previous=runtime.setCamera;runtime.setCamera=function(pose,options){update(pose);return previous.call(runtime,pose,options);};update(last);
 function redraw(){update(last);runtime.invalidate();}
 timings.push({id:'total-decode-and-geometry',ms:performance.now()-started});redraw();
 return {setMode(v){if(!['original','hybrid','ai'].includes(v))throw Error('Unknown mode');mode=v;redraw();},setBlend(v){manual=v===null?null:Math.max(0,Math.min(1,Number(v)));redraw();},setLayer(k,v){if(!(k in enabled))throw Error('Unknown layer');enabled[k]=Boolean(v);redraw();},get state(){return {mode,manual,enabled:{...enabled},pose:last,layers:layers.map(l=>({name:l.proxy.name,visible:l.proxy.visible,kind:l.kind,opacity:l.u.gain.value,weights:l.u.weights.value.toArray()})),textures:textures.length,timings};},dispose(){if(disposed)return;disposed=true;runtime.setCamera=previous;for(const l of layers){l.proxy.removeFromParent();l.proxy.geometry.dispose();l.mat.dispose();}for(const t of textures)t.dispose();group.removeFromParent();}};
}
