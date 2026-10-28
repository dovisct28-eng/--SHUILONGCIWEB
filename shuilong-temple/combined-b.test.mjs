import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from '../module-a/immersive-hybrid-v1/vendor/three.module.js';
import {createCandidate} from '../docs/validation/temple-model-v2/src/candidate-model.mjs';
import {createA03Cutaway} from '../module-a/a03/cutaway.mjs';
import {sampleGallery} from '../module-a/immersive-hybrid-v1/src/corridor-path.mjs';
import {sampleMuralFront,FIRST_FRONT_DOCK} from '../module-a/immersive-hybrid-v1/src/mural-front.mjs';
import {GALLERY_CONFIG,createDisabledInterior} from '../module-a/immersive-hybrid-v1/src/gallery-config.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const source=read('model-source.js'),root=new Function('T',source+'\nreturn makeTemple(T);')(T);
const cfg=JSON.parse(read('../docs/validation/temple-model-v2/candidate-config.json'));
const candidate=createCandidate(T,read('../docs/validation/temple-model-v2/src/baseline-model.js'),cfg,cfg.variants.find(v=>v.id==='combined-b')).root;
root.updateMatrixWorld(true);
test('production source constructs the confirmed B geometry once, independently of historical source',()=>{
 assert.ok(!/createCandidate|baseline-model|\.glb|replace\(/.test(source));
 assert.equal(root.children.length,13);assert.equal(new Set(root.children.map(g=>g.name)).size,13);
 for(const g of root.children){
  const ref=candidate.getObjectByName(g.name==='08_MainHallRoof'?'08_HallRoofCandidate':g.name);
  assert.ok(ref,g.name);assert.equal(g.children.length,ref.children.length,g.name);
  for(const [i,m] of g.children.entries()){
   const expected=ref.children[i];assert.equal(m.material.color.getHex(),expected.material.color.getHex());
   assert.equal(m.material.userData.texture,expected.material.userData.texture);
   for(const key of ['position','normal']){const a=m.geometry.attributes[key].array,b=expected.geometry.attributes[key].array;assert.equal(a.length,b.length);assert.ok(a.every((v,j)=>Math.abs(v-b[j])<1e-6),g.name+' '+key);}
   assert.ok(m.position.distanceTo(expected.position)<1e-12);
  }
 }
});
test('Roof B gables hide with the roof, receive A04 window clipping and restore after reverse',()=>{
 const rig=createA03Cutaway(root),assembly=root.getObjectByName('08_MainHallRoof');
 assert.ok(assembly.children.some(m=>m.material.userData.texture==='plaster'));
 for(const s of [12.15,9.65,12.15,9.65]){
  rig.apply(s);assert.ok(assembly.children.every(m=>m.visible===(s===9.65)));
 }
 rig.apply(14.5,false,{storyTime:6,entryProgress:1});
 assert.ok(assembly.children.every(m=>m.visible&&m.material.opacity===1&&m.material.depthWrite&&!m.castShadow));
 for(const m of assembly.children){const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <alphatest_fragment>'};m.material.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('movieWindow'));}
 rig.apply(16,false,{storyTime:45,entryProgress:1,routeComplete:true,guideStartProgress:0});
 assert.ok(assembly.children.every(m=>m.visible&&m.castShadow));
});
test('Combined B eye corridor and mural dock use the widened passage, 48 degree FOV and exact reverse',()=>{
 assert.deepEqual(sampleGallery(2).position,[3.906,1.55,7.65]);
 assert.ok(Math.abs(FIRST_FRONT_DOCK.frontCamera.position[0]-2.807)<1e-12);
 for(let i=0;i<=500;i++){const p=sampleMuralFront(i/500);assert.equal(p.fov,48);assert.equal(p.position[1],1.55);assert.deepEqual(p,sampleMuralFront(i/500));}
 assert.deepEqual(FIRST_FRONT_DOCK.center,[4.865,1.55,4.8]);
});
test('disabled interior is an allocation-free adapter retaining the navigation contract',async()=>{
 assert.equal(GALLERY_CONFIG.generatedInterior,false);const d=createDisabledInterior();
 assert.equal(await d.load(),true);d.update(2);d.setMode('hybrid');d.setBlend(1);d.setEnabled(true);
 assert.equal(d.status,'disabled');assert.equal(d.state().textures,0);assert.deepEqual(d.state().effective,[]);
});
