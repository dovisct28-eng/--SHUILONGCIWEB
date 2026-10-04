import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {architecturalRoom,roomFrame} from './spatial.mjs';import{roomLabels}from './markers.mjs';import{contrastRatio}from '../a01/ink-scene.mjs';
test('room is scoped to the A02 handoff and releases the existing next chapter endpoint',()=>{
 for(const n of [0,3,5.7,6.2,6.4,10.95,11.5,15,29,42])assert.ok(architecturalRoom(n).weight<1e-12);
 assert.equal(architecturalRoom(10.2).weight,1);
 assert.equal(architecturalRoom(6.2).environment,1);assert.equal(architecturalRoom(7.2).environment,0);
 assert.equal(architecturalRoom(7).heading,0);assert.equal(architecturalRoom(7.55).heading,1);
 const frame={width:830,height:620};for(const n of [5.7,10.95,11.5])assert.deepEqual(roomFrame(frame,1440,900,n),frame);
});
test('every parameter is continuous and stateless in both directions',()=>{
 let previous=architecturalRoom(6.2);for(let n=6.201;n<=10.951;n+=.001){const next=architecturalRoom(n);for(const key of Object.keys(next))assert.ok(Math.abs(next[key]-previous[key])<.005,key);const again=architecturalRoom(n);architecturalRoom(42);assert.deepEqual(architecturalRoom(n),again);previous=next;}
 const stops=[6.2,6.45,6.7,6.95,7.55,8.2,8.7,9.65,10.15];assert.deepEqual(stops.map(architecturalRoom),stops.toReversed().map(architecturalRoom).toReversed());
});
test('A02 labels retain the original projected anchor and remain separated',()=>{
 for(const [w,h]of [[1843,864],[1382,720],[1311,614],[983,614]]){const points=['01','02','03','04','05'].map((id,i)=>({id:'mural-'+id,x:w*(i===0?.66:.35),y:h*(i===0?.25:.7)}));const positions=roomLabels(points,w,h);
  for(const p of positions){const original=points.find(v=>v.id===p.id);assert.equal(p.x,original.x);assert.equal(p.y,original.y);assert.ok(p.lx>=76&&p.lx<=w-76&&p.ly>=95&&p.ly<=h-65);}
  for(const side of [-1,1]){const column=positions.filter(p=>p.side===side).sort((a,b)=>a.ly-b.ly);for(let i=1;i<column.length;i++)assert.ok(column[i].ly-column[i-1].ly>=48);}
 }
});
test('candidate text and reduced secondary labels have readable dark-field contrast',()=>{
 const primary='#d8d2c5',secondary='#a0a39c';for(const bg of ['#0b141b','#182126','#20272a','#121b20']){assert.ok(contrastRatio(primary,bg)>=4.5);assert.ok(contrastRatio(secondary,bg)>=4.5);const fade='#'+[0,2,4].map(i=>Math.round(parseInt(primary.slice(i+1,i+3),16)*.75+parseInt(bg.slice(i+1,i+3),16)*.25).toString(16).padStart(2,'0')).join('');assert.ok(contrastRatio(fade,bg)>=4.5);}
});
test('room adds no renderer, postprocessing, texture loader or autonomous clock',()=>{
 const files=['./spatial.mjs','./markers.mjs','../../shuilong-temple/a02-light.mjs'];for(const file of files)assert.doesNotMatch(fs.readFileSync(new URL(file,import.meta.url),'utf8'),/requestAnimationFrame|setInterval|setTimeout|WebGLRenderer|TextureLoader|RenderTarget|Bloom|ShaderMaterial/);
 const css=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');assert.doesNotMatch(css,/radial-gradient|backdrop-filter|animation:/);assert.match(css,/z-index:1/);assert.match(css,/seed='17'/);
 const lights=fs.readFileSync(new URL('../../shuilong-temple/a02-light.mjs',import.meta.url),'utf8');assert.match(lights,/!g.name.startsWith\('mural-'\)/);
});
