// Read-only GLB inspection page. No production imports with startup side effects.
import * as T from '../../../module-a/immersive-hybrid-v1/vendor/three.module.js';
const response=await fetch(new URL('../../../shuilong-temple/shuilong-temple.glb',import.meta.url));
if(!response.ok)throw Error(`GLB HTTP ${response.status}`);
const data=await response.arrayBuffer(),dv=new DataView(data),jsonLength=dv.getUint32(12,true);
const doc=JSON.parse(new TextDecoder().decode(new Uint8Array(data,20,jsonLength))),start=28+jsonLength;
const canvas=document.querySelector('canvas');
const renderer=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1600,1200,false);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
const scene=new T.Scene();scene.background=new T.Color('#eeede8');
scene.add(new T.HemisphereLight('#ffffff','#b2a48e',2.5));
const sun=new T.DirectionalLight('#fff5e3',2.5);sun.position.set(-15,25,20);scene.add(sun);
const root=new T.Group();scene.add(root);
const cache=new Map();
function attr(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],C={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType];if(!C||v.byteStride)throw Error('Unsupported accessor');return new C(data,start+(v.byteOffset||0)+(a.byteOffset||0),a.count*n);}
async function texture(index,color){if(cache.has(index))return cache.get(index);const promise=(async()=>{const im=doc.images[doc.textures[index].source],v=doc.bufferViews[im.bufferView],url=URL.createObjectURL(new Blob([new Uint8Array(data,start+v.byteOffset,v.byteLength)],{type:im.mimeType}));try{const t=await new T.TextureLoader().loadAsync(url);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;return t;}finally{URL.revokeObjectURL(url);}})();cache.set(index,promise);return promise;}
const materials=await Promise.all(doc.materials.map(async m=>{const p=m.pbrMetallicRoughness,c=p.baseColorFactor,mat=new T.MeshStandardMaterial({color:new T.Color(...c.slice(0,3)),roughness:p.roughnessFactor,metalness:p.metallicFactor??0,side:m.doubleSided?T.DoubleSide:T.FrontSide});mat.userData.key=m.extras?.textureKey;if(p.baseColorTexture)mat.map=await texture(p.baseColorTexture.index,true);if(p.metallicRoughnessTexture)mat.roughnessMap=await texture(p.metallicRoughnessTexture.index,false);if(m.normalTexture){mat.normalMap=await texture(m.normalTexture.index,false);mat.normalScale.setScalar(m.normalTexture.scale??1);}return mat;}));
let triangles=0;
for(const node of doc.nodes){const group=new T.Group();group.name=node.name;root.add(group);if(node.matrix)throw Error('Expected the existing baked-world-coordinate GLB');for(const p of doc.meshes[node.mesh].primitives){const g=new T.BufferGeometry();for(const [key,name,n]of [['POSITION','position',3],['NORMAL','normal',3],['TEXCOORD_0','uv',2],['COLOR_0','color',3]])if(p.attributes[key]!==undefined)g.setAttribute(name,new T.BufferAttribute(attr(p.attributes[key]),n));g.setIndex(new T.BufferAttribute(attr(p.indices),1));triangles+=g.index.count/3;const mat=materials[p.material];if(g.attributes.color)mat.vertexColors=true;group.add(new T.Mesh(g,mat));}}
root.updateMatrixWorld(true);
const bounds=Object.fromEntries(root.children.map(g=>{const b=new T.Box3().setFromObject(g);return [g.name,{min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new T.Vector3()).toArray()}];}));
const camera=new T.OrthographicCamera(-20,20,15,-15,.01,200);
const views={top:{position:[0,70,-1.75],target:[0,0,-1.75],up:[0,0,-1]},front:{position:[0,2.3,60],target:[0,2.3,-1.75]},side:{position:[65,2.3,-1.75],target:[0,2.3,-1.75]},aerial:{position:[28,33,38],target:[0,1,-1.75]}};
function capture(view,{cutaway=false}={}){
 const v=views[view];if(!v)throw Error('Unknown view');
 root.traverse(o=>{if(o.isMesh)o.visible=!(cutaway&&o.material.userData.key==='roof');});
 camera.up.fromArray(v.up??[0,1,0]);camera.position.fromArray(v.position);camera.lookAt(...v.target);camera.updateMatrixWorld(true);
 let l=Infinity,r=-Infinity,b=Infinity,t=-Infinity;const inverse=camera.matrixWorldInverse;
 root.traverse(o=>{if(!o.isMesh||!o.visible)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).applyMatrix4(inverse);l=Math.min(l,q.x);r=Math.max(r,q.x);b=Math.min(b,q.y);t=Math.max(t,q.y);}});
 const cx=(l+r)/2,cy=(b+t)/2,h=Math.max((t-b)*1.1,(r-l)*1.1/(4/3)),w=h*4/3;
 Object.assign(camera,{left:cx-w/2,right:cx+w/2,top:cy+h/2,bottom:cy-h/2});camera.updateProjectionMatrix();renderer.render(scene,camera);
 return {view,cutaway,projection:'OrthographicCamera',position:camera.position.toArray(),target:v.target,up:camera.up.toArray(),frustum:[camera.left,camera.right,camera.top,camera.bottom],trianglesRendered:renderer.info.render.triangles,hidden:'cutaway hides only roof-material meshes in this inspection scene',image:canvas.toDataURL('image/png')};
}
window.audit={capture,bounds,triangles,nodes:doc.nodes.map(n=>n.name),ready:true};
capture('aerial');
