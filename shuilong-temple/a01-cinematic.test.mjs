import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {a01TerrainHeight}from './a01-environment.mjs';
import {createA01Materials}from './a01-material.mjs';
import {createArchitectureLines}from './a01-lines.mjs';import {ARCHITECTURE_LINES}from './a01-lines-data.mjs';
const preview=fs.readFileSync(new URL('水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);const line=preview.split('\n').find(s=>s.startsWith('const moduleText='));const source=JSON.parse(line.slice(17,line.lastIndexOf('".replaceAll(')+1));const uri=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;const T=await import(uri(source.replaceAll('./three.core.js',uri(core))));
test('terrain meets frozen plinth footprint and falls continuously outside it',()=>{
 for(const x of [-6,0,6])for(const z of [-16.5,0,13])assert.equal(a01TerrainHeight(x,z),-.615);
 assert.ok(a01TerrainHeight(20,0)<-4);let previous=a01TerrainHeight(6,0);for(let x=6;x<35;x+=.01){const h=a01TerrainHeight(x,0);assert.ok(Math.abs(h-previous)<.04);previous=h;}
});
test('normal strengths reset exactly after repeated A01 seeks',()=>{
 const materials=['roof','brick','wood','plaster','stone','paving'].map(textureKey=>{const m=new T.MeshStandardMaterial();m.userData.textureKey=textureKey;m.normalScale.setScalar(.18);return m;});
 const rig=createA01Materials(T,materials);
 for(const weight of [1,.3,0,.8,1,0]){rig.apply(weight);for(const m of materials)assert.ok(Math.abs(m.normalScale.x-.18*(1+weight*(m.userData.textureKey==='roof'?.55:.25)))<1e-10);}
 for(const m of materials)assert.deepEqual(m.normalScale.toArray(),[.18,.18]);
 const late=new T.MeshStandardMaterial();late.userData.textureKey='roof';const lateRig=createA01Materials(T,[late]);lateRig.apply(1);late.normalScale.setScalar(.18);late.normalMap=new T.Texture();lateRig.apply(1);lateRig.apply(0);assert.deepEqual(late.normalScale.toArray(),[.18,.18]);late.normalMap.dispose();
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
