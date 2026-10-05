import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {deriveSharedWorldState,normalizeTitleRects} from './shared-world.mjs';
import {createA03Cutaway} from '../module-a/a03/cutaway.mjs';
import {createDirectorLight} from './director-light.mjs';
const html=fs.readFileSync(new URL('水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(html.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const line=html.split('\n').find(s=>s.startsWith('const moduleText='));
const source=JSON.parse(line.slice(17,line.lastIndexOf('".replaceAll(')+1));
const uri=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const T=await import(uri(source.replaceAll('./three.core.js',uri(core))));
test('one world remains visible in A01–A03 and exits for A04, including reverse and jumps',()=>{
  for(const n of [5.7,9.65,12.15])assert.equal(deriveSharedWorldState(n).visible,true);
  for(const n of [13.2,13.65,16]){const s=deriveSharedWorldState(n);for(const key of ['environment','mountains','vegetation','foreground','fog','posterClearance'])assert.equal(s[key],0);}
  assert.equal(deriveSharedWorldState(12.15,{}).visible,false);
  const stops=[5.7,13.65,9.65,13.65,12.15,5.7,12.15];
  const states=stops.map(n=>deriveSharedWorldState(n));assert.deepEqual(stops.toReversed().map(n=>deriveSharedWorldState(n)).reverse(),states);
  let previous=deriveSharedWorldState(5.7);for(let n=5.701;n<=13.2;n+=.001){const next=deriveSharedWorldState(n);for(const key of ['environment','mountains','posterClearance'])assert.ok(Math.abs(next[key]-previous[key])<.004);previous=next;}
});
test('real moving DOM rectangles map into a resized, offset renderer viewport',()=>{
  const frame={left:300,top:100,width:1000,height:800};
  const rects=[{left:200,top:120,right:700,bottom:420},{left:1050,top:500,right:1450,bottom:800}];
  const a=normalizeTitleRects(rects,frame);assert.deepEqual(a,[{left:-.1,top:.025,right:.4,bottom:.4},{left:.75,top:.5,right:1.15,bottom:.875}]);
  rects[1].left+=100;assert.equal(normalizeTitleRects(rects,frame)[1].left,a[1].left+.1);
  assert.deepEqual(normalizeTitleRects(rects,{width:0,height:0}),[]);
});
test('selective cutaway hides the main roof while preserving entrance/stage and restores arbitrary seeks',()=>{
  const root=new T.Group(),meshes={};
  for(const name of ['03_MainHall','04_WestGallery','05_EastGallery','06_Stage','07_Entrance']){const g=new T.Group();g.name=name;root.add(g);const m=new T.MeshStandardMaterial();m.userData.textureKey='roof';const mesh=new T.Mesh(new T.BoxGeometry(),m);mesh.castShadow=true;g.add(mesh);meshes[name]=mesh;}
  const rig=createA03Cutaway(root);rig.apply(12.15);
  assert.equal(meshes['03_MainHall'].visible,false);assert.equal(rig.getState().galleryCut,1);
  for(const name of ['06_Stage','07_Entrance']){assert.equal(meshes[name].material.opacity,1);assert.equal(meshes[name].material.transparent,false);assert.equal(meshes[name].visible,true);}
  const gallery=meshes['05_EastGallery'].material,s={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <alphatest_fragment>'};gallery.onBeforeCompile(s);assert.match(s.fragmentShader,/discard/);assert.equal(gallery.transparent,false);
  for(const n of [13.65,9.65,12.15,5.7]){rig.apply(n);assert.equal(meshes['03_MainHall'].visible,n!==12.15&&n!==13.65);}
  rig.apply(13.1999);assert.ok(Math.abs(meshes['07_Entrance'].material.opacity-.08)<.00001);assert.ok(Math.abs(meshes['03_MainHall'].material.opacity-.08)<.00001);
});
test('controlled preview owns a single landscape and embeds current shared state for offline use',()=>{
  assert.match(html,/if\(!new URLSearchParams\(location.search\)\.has\('controlled'\)\)environment=mod.createEnvironment/);
  assert.equal(JSON.parse(html.match(/const inlineSharedWorld=("(?:\\.|[^"\\])*");/)[1]),fs.readFileSync(new URL('shared-world.mjs',import.meta.url),'utf8'));
  assert.equal((html.match(/new T.WebGLRenderer\(/g)||[]).length,1);
  const css=fs.readFileSync(new URL('../module-a/a02/styles.css',import.meta.url),'utf8');assert.doesNotMatch(css,/karst-valley/);
});

test('A04 inherits the shared material/light look without moving the camera or tinting murals',()=>{
  const root=new T.Group(),g=new T.Group();g.name='03_MainHall';root.add(g);
  const brick=new T.MeshStandardMaterial({color:0x998877});brick.userData.textureKey='brick';g.add(new T.Mesh(new T.BoxGeometry(),brick));
  const mural=new T.Group();mural.name='mural-05';root.add(mural);const image=new T.MeshBasicMaterial({color:0x987654});mural.add(new T.Mesh(new T.PlaneGeometry(),image));
  const scene=new T.Scene();scene.fog=new T.FogExp2(0xe7e5df,.01);
  const renderer={toneMappingExposure:1},camera=new T.PerspectiveCamera(34),sun=new T.DirectionalLight(),fill=new T.HemisphereLight();scene.add(sun,fill);
  const rig=createDirectorLight(T,{root,scene,renderer,camera,sun,fill,floor:{material:{opacity:.15}}});
  const position=camera.position.clone(),base=brick.color.clone(),tour={entryProgress:1,target:'mural-05',mode:'completed'};
  rig.apply(14.5,tour);const first=brick.color.clone();assert.equal(rig.getState().look,'shared-temple');assert.equal(renderer.toneMappingExposure,1.10);assert.equal(scene.fog.color.getHex(),0x15222b);assert.equal(scene.fog.density,.0045);
  assert.equal(scene.children.filter(o=>o.isLight).length,4);assert.deepEqual(camera.position,position);assert.equal(image.color.getHex(),0x987654);assert.ok(brick.roughness>=.94);
  brick.color.copy(base);rig.apply(14.5,tour);assert.deepEqual(brick.color,first,'caller restores base before each look');
  rig.apply(19,null);assert.notEqual(rig.getState().look,'shared-temple','A05 is outside the shared A04 look');
});
