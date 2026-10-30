import {routeWeights} from './route-v3.2.mjs';
// Independent route: fixed world-space projection, reference-depth rejection,
// eroded semantic masks and the existing live architecture depth buffer.
export async function installRouteSurfaces(runtime,T){
 const base=new URL('./assets/route-v3.2/',import.meta.url),response=await fetch(new URL('references/camera-manifest.json',base));
 if(!response.ok)throw Error('V3.2 配准机位未加载');const manifest=await response.json();
 let scene=runtime.root;while(scene.parent)scene=scene.parent;
 const group=new T.Group();group.name='V32-route-surface-projections';scene.add(group);
 const textures=[],layers=[];let enabled=true,last=runtime.pose;
 async function load(name,color){const image=new Image();image.src=new URL(name,base);await image.decode();const t=new T.Texture(image);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.minFilter=T.LinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;textures.push(t);return t;}
 try{
  const records=await Promise.all(manifest.items.map(async item=>({item,map:await load(`prepared/${item.name}.webp`,true),mask:await load(`prepared/${item.name}-safe.png`,false),depth:await load(`prepared/${item.name}-depth.png`,false)})));
  // Nearest filtering is essential for packed reference depth.
  for(const r of records){r.depth.minFilter=T.NearestFilter;r.depth.magFilter=T.NearestFilter;}
  const declarations=records.map((_,i)=>`uniform sampler2D pic${i},mask${i},dep${i};uniform mat4 proj${i},view${i};uniform float weight${i};`).join('\n');
  const sample=records.map((_,i)=>`{vec4 q=proj${i}*vec4(routeWorld,1.);vec2 uv=q.xy/q.w*.5+.5;if(q.w>0.&&min(uv.x,uv.y)>0.&&max(uv.x,uv.y)<1.){vec3 m=texture2D(mask${i},uv).rgb;float coverage=kind==0?m.r:kind==1?m.g:m.b;vec3 packed=texture2D(dep${i},uv).rgb*255.;float depth=dot(packed,vec3(65536.,256.,1.))/16777215.*40.;float eye=-(view${i}*vec4(routeWorld,1.)).z;float valid=1.-smoothstep(.035,.09,abs(eye-depth));float k=coverage*weight${i}*valid;sum+=texture2D(pic${i},uv).rgb*k;total+=k;}}`).join('\n');
  function add(mesh,ids,kind){
   const geometry=mesh.geometry.clone();geometry.setIndex(ids);
   const uniforms={gain:{value:0},kind:{value:kind}};
   records.forEach((r,i)=>{uniforms[`pic${i}`]={value:r.map};uniforms[`mask${i}`]={value:r.mask};uniforms[`dep${i}`]={value:r.depth};const view=new T.Matrix4().fromArray(r.item.cameraMatrix).invert();uniforms[`view${i}`]={value:view};uniforms[`proj${i}`]={value:new T.Matrix4().fromArray(r.item.projection).multiply(view)};uniforms[`weight${i}`]={value:0};});
   const material=new T.MeshBasicMaterial({transparent:true,depthTest:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,toneMapped:false,fog:false});
   material.onBeforeCompile=s=>{Object.assign(s.uniforms,uniforms);s.vertexShader='varying vec3 routeWorld;\n'+s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nrouteWorld=(modelMatrix*vec4(transformed,1.)).xyz;');s.fragmentShader=`varying vec3 routeWorld;uniform int kind;uniform float gain;\n${declarations}\n`+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>\nif(routeWorld.z>7.9||routeWorld.z< -15.1)discard;if(kind==0&&((routeWorld.z< -8.&&routeWorld.x<4.7)||(routeWorld.z>2.9&&routeWorld.z<6.7&&routeWorld.y>.8&&routeWorld.y<2.3)))discard;vec3 sum=vec3(0.);float total=0.;\n${sample}\nif(total<.001)discard;diffuseColor.rgb=sum/total;diffuseColor.a*=min(1.,total)*gain;`);};
   material.customProgramCacheKey=()=>`route32-${kind}`;
   const proxy=new T.Mesh(geometry,material);proxy.matrixAutoUpdate=false;proxy.matrix.copy(mesh.matrixWorld);proxy.frustumCulled=false;proxy.renderOrder=2;group.add(proxy);layers.push({proxy,uniforms,kind});
  }
  runtime.root.updateMatrixWorld(true);
  runtime.root.traverse(mesh=>{
   if(!mesh.isMesh||!['02_Enclosure','05_EastGallery','03_MainHall'].includes(mesh.parent.name))return;
   const key=mesh.material?.userData?.textureKey,kind=key==='plaster'?0:key==='stone'?1:-1;if(kind<0)return;
   const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index,ids=[];if(!p||!n)return;
   for(let i=0;i<(index?.count??p.count);i+=3){const tri=[0,1,2].map(j=>index?index.getX(i+j):i+j);
    const safe=tri.every(k=>{const x=p.getX(k),y=p.getY(k),z=p.getZ(k);if(kind===0)return x>4.4&&n.getX(k)<-.9;if(kind===1)return n.getY(k)>.9&&y>.20&&y<.80;return false;});
    // Exclude the ENTIRE candidate mural wall, not only the texture rectangle.
    if(safe)ids.push(...tri);
   }if(ids.length)add(mesh,ids,kind);
  });
  function update(pose){last=pose;const state=routeWeights(pose.route12??0);for(const layer of layers){const gain=enabled&&pose.route12!=null?state.gain*(layer.kind===0?.60:.32):0;layer.uniforms.gain.value=gain;records.forEach((r,i)=>layer.uniforms[`weight${i}`].value=state.weights[i]);layer.proxy.visible=gain>.001;}}
  update(last);
  return {update,setEnabled(value){enabled=value;update(last);runtime.invalidate();},get state(){return {enabled,progress:last.route12??null,...routeWeights(last.route12??0),layers:layers.map(l=>({kind:l.kind,gain:l.uniforms.gain.value,triangles:l.proxy.geometry.index.count/3})),referenceDepth:true,secondWallExcluded:true};},dispose(){for(const l of layers){l.proxy.geometry.dispose();l.proxy.material.dispose();}textures.forEach(t=>t.dispose());group.removeFromParent();}};
 }catch(e){textures.forEach(t=>t.dispose());group.removeFromParent();throw e;}
}
