import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {a01TerrainHeight,createA01Environment,environmentVisible}from './a01-environment.mjs';
import {createA01Materials}from './a01-material.mjs';
import {createA01Post}from './a01-post.mjs';
import {createArchitectureLines}from './a01-lines.mjs';import {ARCHITECTURE_LINES}from './a01-lines-data.mjs';
const preview=fs.readFileSync(new URL('水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);const line=preview.split('\n').find(s=>s.startsWith('const moduleText='));const source=JSON.parse(line.slice(17,line.lastIndexOf('".replaceAll(')+1));const uri=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;const T=await import(uri(source.replaceAll('./three.core.js',uri(core))));
test('terrain stays beneath the court, masks the plinth edge and falls continuously',()=>{
 for(const x of [-5,0,5])for(const z of [-15,0,12])assert.equal(a01TerrainHeight(x,z),-.615);
 for(const z of [-14,-7,0,7,12])assert.ok(a01TerrainHeight(5.9,z)>0&&a01TerrainHeight(5.9,z)<.6);
 assert.ok(a01TerrainHeight(20,0)<-4);let previous=a01TerrainHeight(6,0);for(let x=6;x<35;x+=.01){const h=a01TerrainHeight(x,0);assert.ok(Math.abs(h-previous)<.04);previous=h;}
});
test('environment discards color/depth and matching shadow fragments, then stops rendering',()=>{
 const previous=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({beginPath(){},ellipse(){},fill(){}})})};
 try{
  const scene=new T.Scene(),env=createA01Environment(T,scene),group=scene.getObjectByName('A01NarrativeEnvironment');
  const shader=()=>({uniforms:{},vertexShader:'#include <worldpos_vertex>\n#include <project_vertex>',fragmentShader:'#include <color_fragment>\n#include <alphatest_fragment>\n#include <opaque_fragment>'});
  const canopy=group.getObjectByName('CanopyGroves'),surface=shader(),shadow=shader();canopy.material.onBeforeCompile(surface);canopy.customDepthMaterial.onBeforeCompile(shadow);
  assert.equal(canopy.material.depthWrite,true);assert.equal(canopy.material.transparent,false);
  assert.match(surface.fragmentShader,/if\(coverage<=threshold\)discard/);assert.match(shadow.fragmentShader,/a01EnvironmentVisibility<=hash/);
  assert.equal(surface.uniforms.a01EnvironmentVisibility,shadow.uniforms.a01EnvironmentVisibility);
  for(const weight of [1,.5,.04,.03,0,1]){env.apply(weight,1);assert.equal(group.visible,environmentVisible(weight));assert.equal(surface.uniforms.a01EnvironmentVisibility.value,weight);}
  env.apply(0,1);assert.equal(group.visible,false);env.dispose();assert.equal(scene.children.length,0);
 }finally{globalThis.document=previous;}
});
test('directional reveal and its shadow share uniforms and restore at A02',()=>{
 const m=new T.MeshStandardMaterial();m.userData.textureKey='roof';const mesh=new T.Mesh(new T.BoxGeometry(),m),rig=createA01Materials(T,[m],[mesh]);
 const shader=()=>({uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <alphatest_fragment>\n#include <fog_fragment>'});
 const surface=shader(),depth=shader();m.onBeforeCompile(surface);mesh.customDepthMaterial.onBeforeCompile(depth);
 assert.equal(surface.uniforms.a01Reveal,depth.uniforms.a01Reveal);assert.equal(surface.uniforms.a01Hero,depth.uniforms.a01Hero);
 const allocated=mesh.customDepthMaterial;
 for(const [amount,solid,hero]of [[1,0,1],[1,.5,1],[1,1,1],[0,1,0],[1,.5,1]]){rig.apply(amount,solid,hero);assert.equal(surface.uniforms.a01Reveal.value,solid);assert.equal(depth.uniforms.a01Hero.value,hero);assert.equal(mesh.customDepthMaterial,allocated);}
 rig.apply(0,1,0);assert.equal(depth.uniforms.a01Hero.value,0);let disposed=0;allocated.addEventListener('dispose',()=>disposed++);rig.dispose();assert.equal(disposed,1);mesh.geometry.dispose();m.dispose();
});
test('normal strengths reset exactly after repeated A01 seeks',()=>{
 const materials=['roof','brick','wood','plaster','stone','paving'].map(textureKey=>{const m=new T.MeshStandardMaterial();m.userData.textureKey=textureKey;m.normalScale.setScalar(.18);return m;});
 const rig=createA01Materials(T,materials);
 for(const weight of [1,.3,0,.8,1,0]){rig.apply(weight);for(const m of materials)assert.ok(Math.abs(m.normalScale.x-.18*(1+weight*(m.userData.textureKey==='roof'?.55:.25)))<1e-10);}
 for(const m of materials)assert.deepEqual(m.normalScale.toArray(),[.18,.18]);
 const late=new T.MeshStandardMaterial();late.userData.textureKey='roof';const lateRig=createA01Materials(T,[late]);lateRig.apply(1);late.normalScale.setScalar(.18);late.normalMap=new T.Texture();lateRig.apply(1);lateRig.apply(0);assert.deepEqual(late.normalScale.toArray(),[.18,.18]);late.normalMap.dispose();
});
test('post shader failure restores the renderer callback and renders the healthy scene',()=>{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(),previous=()=>{},draws=[];
 const renderer={debug:{onShaderError:previous},info:{autoReset:false,render:{calls:1,triangles:10,lines:0}},getPixelRatio:()=>1,setRenderTarget(){},clear(){},render(s){draws.push(s);if(s!==scene)this.debug.onShaderError({getProgramInfoLog:()=> 'injected invalid GLSL'},{});}};
 const post=createA01Post(T,renderer,scene,camera);post.resize(100,80);post.apply(1,{solid:1});post.render();
 assert.match(post.getState().error,/injected invalid GLSL/);assert.equal(post.getState().enabled,false);assert.equal(renderer.debug.onShaderError,previous);assert.equal(renderer.info.autoReset,false);assert.equal(draws.at(-1),scene);
 const count=draws.length;post.render();assert.equal(draws.length,count+1);assert.equal(draws.at(-1),scene);post.dispose();
});
test('three line brightness ranks preserve every actual contour segment',()=>{
 const root=new T.Group(),layer=createArchitectureLines(T,root,ARCHITECTURE_LINES),state=layer.getState();
 const count=Object.values(ARCHITECTURE_LINES).reduce((n,p)=>n+p.length/6,6);
 assert.equal(Object.values(state.hierarchy).reduce((a,b)=>a+b,0),count);assert.ok(Object.values(state.hierarchy).every(n=>n>0));
 assert.equal(state.segments,count);assert.ok(ARCHITECTURE_LINES.detail.length>0);assert.ok(root.children[0].children.every(o=>o.geometry.attributes.color.count===o.geometry.attributes.position.count));layer.dispose();
});
test('new offline visual modules match source and own no animation clock',()=>{
 for(const [symbol,file]of [['inlineA01Environment','a01-environment.mjs'],['inlineA01Post','a01-post.mjs']]){
  const literal=preview.match(new RegExp(`const ${symbol}=("(?:\\\\.|[^"\\\\])*");`))[1],source=fs.readFileSync(new URL(file,import.meta.url),'utf8');assert.equal(JSON.parse(literal),source);assert.doesNotMatch(source,/requestAnimationFrame|setInterval|setTimeout/);
 }
});
