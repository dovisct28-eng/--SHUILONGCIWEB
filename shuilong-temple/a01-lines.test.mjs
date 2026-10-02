import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveLineState, createArchitectureLines } from './a01-lines.mjs';
import { ARCHITECTURE_LINES } from './a01-lines-data.mjs';
const preview = fs.readFileSync(new URL('水龙祠-交互预览.html',import.meta.url),'utf8');
const core = JSON.parse(preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const moduleLine=preview.split('\n').find(line=>line.startsWith('const moduleText='));
const moduleText=JSON.parse(moduleLine.slice('const moduleText='.length,moduleLine.lastIndexOf('".replaceAll(')+1));
const url=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const T=await import(url(moduleText.replaceAll('./three.core.js',url(core))));

test('line structure precedes solid; exits before shift and never returns at A02',()=>{
 assert.equal(deriveLineState(0).solid,0);
 assert.equal(deriveLineState(.15).groups.hall,0);
 const line=deriveLineState(.407);
 assert.ok(Object.values(line.groups).every(n=>n===1));
 assert.ok(line.solid<.12&&line.lineOpacity===1);
 const overlay=deriveLineState(.50);
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
 for(const [name,file] of [['inlineA01Lines','a01-lines.mjs'],['inlineA01Data','a01-lines-data.mjs']]){
  const literal=preview.match(new RegExp(`const ${name}=("(?:\\\\.|[^"\\\\])*");`))[1];
  assert.equal(JSON.parse(literal).replaceAll('\r\n','\n'),fs.readFileSync(new URL(file,import.meta.url),'utf8').replaceAll('\r\n','\n'));
 }
 const source=fs.readFileSync(new URL('a01-lines.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/requestAnimationFrame|setTimeout|setInterval|createElement/);
 assert.ok(Object.keys(ARCHITECTURE_LINES).every(n=>!n.includes('mural')));
});
