import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveLineState, createArchitectureLines } from './a01-lines.mjs';
import { ARCHITECTURE_LINES } from './a01-lines-data.mjs';
import {createA01ArtDirection,deriveHeroWeight} from './a01-art-direction.mjs';
import {createArchitectureFocus,visualState} from './environment.mjs';
const preview = fs.readFileSync(new URL('水龙祠-交互预览.html',import.meta.url),'utf8');
const core = JSON.parse(preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const moduleLine=preview.split('\n').find(line=>line.startsWith('const moduleText='));
const moduleText=JSON.parse(moduleLine.slice('const moduleText='.length,moduleLine.lastIndexOf('".replaceAll(')+1));
const url=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const T=await import(url(moduleText.replaceAll('./three.core.js',url(core))));

test('line structure precedes solid; exits before shift and never returns at A02',()=>{
 assert.equal(deriveLineState(0).solid,0);
 assert.ok(deriveLineState(0).lineOpacity>.5);assert.equal(deriveLineState(0).groups.roof,1);
 assert.equal(deriveLineState(.15).groups.hall,1);
 assert.equal(deriveLineState(.04).groups.roof,1);
 assert.ok(deriveLineState(.15).groups.court<1);
 const line=deriveLineState(.48);
 assert.ok(Object.values(line.groups).every(n=>n===1));
 assert.ok(line.solid<.12&&line.lineOpacity===1);
 const overlay=deriveLineState(.54);
 assert.ok(overlay.solid>.3&&overlay.solid<.9&&overlay.lineOpacity>.2);
 for(const p of [.65,.82,1,2]){assert.equal(deriveLineState(p).solid,1);assert.equal(deriveLineState(p).lineOpacity,0);}
});
test('forward/reverse, clamped input and reduced motion are deterministic',()=>{
 for(const p of [0,.1,.2,.35,.47,.64,1]){
  const before=deriveLineState(p);deriveLineState(1);deriveLineState(0);
  assert.deepEqual(deriveLineState(p),before);
  const reduced=deriveLineState(p,true);assert.equal(reduced.depth,0);
  assert.equal(reduced.solid,before.solid);assert.deepEqual(reduced.groups,before.groups);
 }
 assert.equal(deriveLineState(-1).progress,0);assert.equal(deriveLineState(NaN).progress,0);
});
test('geometry remains allocated once across seek/resize and releases completely',()=>{
 const root=new T.Group(),layer=createArchitectureLines(T,root,ARCHITECTURE_LINES);
 const objects=root.children[0].children,geometries=objects.map(o=>o.geometry),materials=objects.map(o=>o.material);
 let released=0;[...geometries,...materials].forEach(r=>r.addEventListener('dispose',()=>released++));
 for(const p of [0,.18,.31,.45,.59,1,.45,1])layer.apply(deriveLineState(p));
 assert.deepEqual(objects.map(o=>o.geometry),geometries);
 assert.deepEqual(objects.map(o=>o.material),materials);
 assert.equal(layer.getState().visible,false);assert.equal(layer.getState().drawCalls,0);
 assert.ok(layer.getState().segments<1000);assert.equal(layer.getState().geometries,10);
 layer.dispose();assert.equal(root.children.length,0);assert.equal(released,20);
});
test('invalid contour releases partially allocated resources and leaves root usable',()=>{
 const root=new T.Group(),solid=new T.Group();root.add(solid);
 assert.throws(()=>createArchitectureLines(T,root,{hall:[NaN,0,0,1,1,1]}),/Invalid A01/);
 assert.deepEqual(root.children,[solid]);
});
test('standalone line/data copies match modules; no timers, canvas or extra RAF',()=>{
 for(const [name,file] of [['inlineA01Lines','a01-lines.mjs'],['inlineA01Data','a01-lines-data.mjs'],['inlineA01Art','a01-art-direction.mjs']]){
  const literal=preview.match(new RegExp(`const ${name}=("(?:\\\\.|[^"\\\\])*");`))[1];
  assert.equal(JSON.parse(literal).replaceAll('\r\n','\n'),fs.readFileSync(new URL(file,import.meta.url),'utf8').replaceAll('\r\n','\n'));
 }
 const source=fs.readFileSync(new URL('a01-lines.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/requestAnimationFrame|setTimeout|setInterval|createElement/);
 assert.ok(Object.keys(ARCHITECTURE_LINES).every(n=>!n.includes('mural')));
});

test('material and light arrive after structure, before the environmental climax',()=>{
 const structure=deriveLineState(.48),solid=deriveLineState(.55),material=deriveLineState(.60),complete=deriveLineState(.65);
 assert.equal(structure.materialWeight,0);assert.equal(structure.lightingWeight,0);
 assert.ok(solid.solid>.5&&solid.materialWeight<.15);
 assert.ok(material.materialWeight>.9&&material.environmentWeight<.05);
 assert.equal(complete.environmentWeight,1);assert.equal(complete.lightingWeight,1);
});

test('A01 restores camera, lighting and base materials at A02, without touching murals',()=>{
 const root=new T.Group(),scene=new T.Scene(),camera=new T.PerspectiveCamera(34,1.6,.1,180);
 scene.fog=new T.FogExp2(0xe7e5df,.007);
 const sun=new T.DirectionalLight(0xffffff,3.3);sun.position.set(-19,23,-22);
 const fill=new T.HemisphereLight(0xffffff,0xffffff,1.2),renderer={toneMappingExposure:1.18},floor={material:{opacity:.15}};
 for(const name of ['03_MainHall','mural-05']){const g=new T.Group();g.name=name;
 const m=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());m.material.userData.textureKey='roof';g.add(m);root.add(g);}
 const focus=createArchitectureFocus(T,root),art=createA01ArtDirection(T,{root,scene,camera,sun,fill,renderer,floor});
 const mural=root.children[1].children[0].material.color.clone(),target=new T.Vector3(0,0,-1.75);
 focus(visualState(8));const material=root.children[0].children[0].material,base=material.color.clone(),baseRoughness=material.roughness,baseMetalness=material.metalness;
 const originalColors={sun:sun.color.clone(),sky:fill.color.clone(),ground:fill.groundColor.clone(),fog:scene.fog.color.clone()};
 const seek=n=>{const state=visualState(n);focus(state);art.apply(deriveHeroWeight(n),state,deriveLineState(1));art.camera(4.05,.68,54,target,deriveHeroWeight(n));};
 seek(5.7);const hero=art.getState();assert.equal(camera.fov,32);assert.equal(fill.intensity,.75);
 seek(8);assert.ok(root.children[0].children[0].material.color.equals(base));assert.equal(camera.fov,34);assert.equal(renderer.toneMappingExposure,1.18);assert.equal(material.roughness,baseRoughness);assert.equal(material.metalness,baseMetalness);assert.ok(sun.color.equals(originalColors.sun)&&fill.color.equals(originalColors.sky)&&fill.groundColor.equals(originalColors.ground)&&scene.fog.color.equals(originalColors.fog));assert.equal(fill.intensity,1.2);assert.deepEqual(sun.position.toArray(),[-19,23,-22]);
 assert.ok(root.children[1].children[0].material.color.equals(mural));
 seek(5.7);assert.deepEqual(art.getState(),hero);
 for(let n=6.2;n<7.2;n+=.002)assert.ok(Math.abs(deriveHeroWeight(n)-deriveHeroWeight(n+.002))<.004);
});

test('near camera pulls back continuously and reduced motion retains the full compound',()=>{
 const camera=new T.PerspectiveCamera(34,1.6,.1,180),scene=new T.Scene();scene.fog=new T.FogExp2();const sun=new T.DirectionalLight(),fill=new T.HemisphereLight();
 const art=createA01ArtDirection(T,{root:new T.Group(),camera,scene,sun,fill,renderer:{},floor:{material:{}}}),target=new T.Vector3(0,0,-1.75);
 art.camera(.28,.68,58,target,1,deriveLineState(.04));const near=art.getState();
 art.camera(.28,.68,58,target,1,deriveLineState(.20));const whole=art.getState();assert.ok(near.target[2]<-10);assert.equal(whole.target[2],-1.75);
 art.camera(.28,.68,58,target,1,deriveLineState(.04,true));assert.deepEqual(art.getState().target,whole.target);
 let previous=null;for(let p=0;p<=.201;p+=.001){art.camera(.28,.68,58,target,1,deriveLineState(p));const position=camera.position.clone();if(previous)assert.ok(position.distanceTo(previous)<.35);previous=position;}
 art.camera(.28,.68,58,target,1,deriveLineState(.04));assert.deepEqual(art.getState(),near);
});
