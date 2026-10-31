import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
const prefix='module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/',base='8643a4daeb55cca217ab0be5222822c3716bf14c';
const current=fs.readFileSync(new URL('./study.mjs',import.meta.url),'utf8');
const previous=execFileSync('git',['show',base+':'+prefix+'study.mjs'],{encoding:'utf8'});
function section(source,start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))).replace(/\r\n/g,'\n');}
test('first mural 650ms image unfolding remains source-identical',()=>assert.equal(section(current,'async function syncReading','async function reading'),section(previous,'async function syncReading','async function reading')));
test('detail coordinate math and interactions remain source-identical',()=>assert.equal(section(current,'function drawDetail','function options'),section(previous,'function drawDetail','function options')));
test('camera travel, candidate placement and module B handoff stay source-identical',()=>assert.equal(section(current,'async function probeRoute',"$('#route-open')"),section(previous,'async function probeRoute',"$('#route-open')")));
test('mural data, route, image math and architecture presentation are untouched',()=>{for(const file of ['murals.json','route-data.mjs','observations.mjs','interior-finish.mjs','surface-layer.mjs']){assert.equal(fs.readFileSync(new URL('./'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n'),execFileSync('git',['show',(file==='murals.json'?'85fb55d':base)+':'+prefix+file],{encoding:'utf8'}).replace(/\r\n/g,'\n'));}});
