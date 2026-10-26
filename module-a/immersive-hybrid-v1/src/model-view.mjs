import * as T from '../vendor/three.module.js';
import {PRESETS} from './camera-presets.mjs';

// The repository's GLB is an uncompressed, world-coordinate model. This reader
// intentionally supports that documented format, not arbitrary third-party GLTF.
export async function createModel(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#c6c5bc');
 const camera=new T.PerspectiveCamera(42,16/9,.06,180);
 const response=await fetch('../../shuilong-temple/shuilong-temple.glb');if(!response.ok)throw Error('建筑模型加载失败');
 const data=await response.arrayBuffer(),dv=new DataView(data),jsonLength=dv.getUint32(12,true);
 const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,jsonLength))),start=28+jsonLength;
 const root=new T.Group();scene.add(root);let removed=0;
 function attr(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],n=({VEC2:2,VEC3:3,VEC4:4})[a.type]||1,C=({5126:Float32Array,5125:Uint32Array,5123:Uint16Array})[a.componentType];if(!C||v.byteStride)throw Error('Unsupported model accessor');return new C(data,start+(v.byteOffset||0)+(a.byteOffset||0),a.count*n);}
 const textureCache=new Map();
 async function texture(index,srgb){if(textureCache.has(index))return textureCache.get(index);const promise=(async()=>{const im=doc.images[doc.textures[index].source],v=doc.bufferViews[im.bufferView],url=URL.createObjectURL(new Blob([new Uint8Array(data,start+v.byteOffset,v.byteLength)],{type:im.mimeType}));try{const t=await new T.TextureLoader().loadAsync(url);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=srgb?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;return t;}finally{URL.revokeObjectURL(url);}})();textureCache.set(index,promise);return promise;}
 const materials=await Promise.all(doc.materials.map(async m=>{const p=m.pbrMetallicRoughness,c=m.extras?.fallbackColor||p.baseColorFactor,mat=new T.MeshStandardMaterial({color:new T.Color(...c.slice(0,3)),roughness:p.roughnessFactor,side:m.doubleSided?T.DoubleSide:T.FrontSide});mat.userData.key=m.extras?.textureKey;try{if(p.baseColorTexture){mat.map=await texture(p.baseColorTexture.index,true);mat.color.setRGB(1,1,1);}if(p.metallicRoughnessTexture)mat.roughnessMap=await texture(p.metallicRoughnessTexture.index,false);if(m.normalTexture){mat.normalMap=await texture(m.normalTexture.index,false);mat.normalScale.setScalar(m.normalTexture.scale||.18);}}catch{mat.userData.textureFallback=true;}return mat;}));
 for(const node of doc.nodes){const group=new T.Group();group.name=node.name;root.add(group);if(node.name.startsWith('mural-')){group.visible=false;continue;}
  for(const p of doc.meshes[node.mesh].primitives){const g=new T.BufferGeometry();for(const [key,name,n]of [['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2],['COLOR_0','color',3]])if(p.attributes[key]!==undefined)g.setAttribute(name,new T.BufferAttribute(attr(p.attributes[key]),n));let indices=attr(p.indices);
   if(node.name==='07_Entrance'){
    const xyz=g.attributes.position,keep=[];
    for(let i=0;i<indices.length;i+=3){const ids=[indices[i],indices[i+1],indices[i+2]],inside=ids.every(k=>Math.abs(xyz.getX(k))<=.761&&xyz.getY(k)>=-.001&&xyz.getY(k)<=1.681&&xyz.getZ(k)>11.70&&xyz.getZ(k)<12.17);if(inside)removed++;else keep.push(...ids);}indices=new Uint32Array(keep);
   }
   g.setIndex(new T.BufferAttribute(indices,1));const mat=materials[p.material];if(g.attributes.color)mat.vertexColors=true;
   const mesh=new T.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
 }
 scene.add(new T.HemisphereLight('#e8edf0','#8c7d64',2));const sun=new T.DirectionalLight('#fff1dd',3.1);sun.position.set(-19,23,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:90});sun.shadow.normalBias=.025;scene.add(sun);
 const floor=new T.Mesh(new T.PlaneGeometry(160,160),new T.MeshStandardMaterial({color:'#9a9787',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.605;floor.receiveShadow=true;scene.add(floor);
 let mural=null;
 async function ensureMural(){if(mural)return mural;const tex=await new T.TextureLoader().loadAsync('./assets/murals/mural-01-display.webp');tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;mural=new T.Mesh(new T.PlaneGeometry(3.65,1.2547),new T.MeshBasicMaterial({map:tex,toneMapped:false,fog:false,side:T.DoubleSide}));mural.position.set(4.865,1.55,4.8);mural.rotation.y=-Math.PI/2;mural.visible=false;scene.add(mural);return mural;}
 function setCamera(p){camera.position.fromArray(p.position);camera.lookAt(...p.target);camera.fov=p.fov;camera.updateProjectionMatrix();}
 function render(){renderer.render(scene,camera);}
 function resize(w,h,dpr=Math.min(devicePixelRatio,1.5)){renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();render();}
 function project(){const corners=[[4.865,2.17735,2.975],[4.865,2.17735,6.625],[4.865,.92265,6.625],[4.865,.92265,2.975]];return corners.map(p=>{const v=new T.Vector3(...p).project(camera);return [(v.x+1)/2,(1-v.y)/2];});}
 function mask(threshold=3){const old=scene.background;scene.background=new T.Color(0);const mask=new T.ShaderMaterial({uniforms:{cutoff:{value:threshold}},vertexShader:'varying float distanceToCamera;void main(){vec4 v=modelViewMatrix*vec4(position,1.);distanceToCamera=-v.z;gl_Position=projectionMatrix*v;}',fragmentShader:'varying float distanceToCamera;uniform float cutoff;void main(){float m=1.-step(cutoff,distanceToCamera);gl_FragColor=vec4(vec3(m),1.);}',side:T.DoubleSide});scene.overrideMaterial=mask;render();const result=canvas.toDataURL('image/png');scene.overrideMaterial=null;scene.background=old;mask.dispose();render();return result;}
 setCamera(PRESETS.R01);resize(innerWidth,innerHeight);
 return {renderer,camera,scene,root,setCamera,render,resize,project,mask,ensureMural,get mural(){return mural;},removed,stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,textures:renderer.info.memory.textures,geometries:renderer.info.memory.geometries}),dispose(){root.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());for(const t of textureCache.values())t.then(t=>t.dispose());mural?.geometry.dispose();mural?.material.map.dispose();mural?.material.dispose();floor.geometry.dispose();floor.material.dispose();renderer.dispose();}};
}
