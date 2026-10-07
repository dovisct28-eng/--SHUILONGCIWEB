import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const gestureContract=createRequire(import.meta.url)('./b03-gesture-contract.cjs');
import {panelPresentation} from './public/orbit-stage.mjs';
import {orbitLayout,intersects,projectOccupancy} from './public/orbit-layout.mjs';
import {figureLayout,stageSafeArea,alphaGeometry} from './public/figure-stage.mjs';

test('Presentation reserves the entire drift/focus envelope at four sizes and both layouts',()=>{
 for(const ratio of [.12,.7,1,3,10])for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,800]])for(const revealed of [false,true]){
  const w=120,h=120,pixels=new Uint8ClampedArray(w*h*4);
  for(let y=10;y<110;y++)for(let x=45;x<75;x++)pixels[(y*w+x)*4+3]=255;
  const geometry=alphaGeometry(pixels,w,h),panelLeft=width*.65;
  const figure=figureLayout({width:w*ratio,height:h,bounds:geometry.bounds,safe:stageSafeArea(width,height,panelLeft,revealed)});
  const projection={x:figure.x,y:figure.y,width:w*ratio*figure.scale,height:h*figure.scale};
  const forbidden=[{x:0,y:0,width,height:96},{x:0,y:height-165,width,height:165},...(revealed?[{x:panelLeft,y:100,width:width-panelLeft,height:height-200}]:[])];
  const input={width,height,effective:figure.effective,projection,geometry,forbidden,panelLeft,revealed,id:'arbitrary-'+ratio};
  const layout=orbitLayout(input),before=JSON.stringify(layout),a=panelPresentation(layout,input);
  assert.deepEqual(a,panelPresentation(layout,input));assert.equal(JSON.stringify(layout),before);
  if(a.some(p=>p.content!=='contour'))assert.equal(a.filter(p=>p.tier==='primary').length,1);
  for(const p of a){const r=p.envelope;assert.ok(Math.abs(p.angle)<=1.2);assert.ok(p.period>=(p.tier==='primary'?7:9)&&p.period<=16);assert.ok(!projectOccupancy(geometry,projection,input.effective).some(c=>intersects(r,c,8)));assert.ok(!forbidden.some(c=>intersects(r,c,8)));assert.ok(r.x>=layout.safe.x&&r.y>=layout.safe.y&&r.x+r.width<=layout.safe.x+layout.safe.width&&r.y+r.height<=layout.safe.y+layout.safe.height);}
  for(let i=0;i<a.length;i++)assert.ok(!a.slice(i+1).some(p=>intersects(a[i].envelope,p.envelope,12)));
 }
});
test('Gesture v2 freezes camera preview, archive/classifier math and stage algorithms; no new RAF',()=>{
 const baseline='9bf45d4e9d9d911a603d40fc590f41563fcdc874';
 const old=p=>execFileSync('git',['show',baseline+':Mural-Exhibition/'+p],{encoding:'utf8',maxBuffer:8e6}).replace(/\r\n/g,'\n');
 const now=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8').replace(/\r\n/g,'\n');
 const html=now('public/index.html'),base=old('public/index.html');
 const block=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
 for(const [a,b]of [['<div id="camera-feed-container">','<aside id="floating-info"']]){assert.ok(block(base,a,b).length>20);assert.equal(block(html,a,b),block(base,a,b));}
 assert.equal(gestureContract(html),gestureContract(base));
 const cameraRules=s=>s.match(/[^{}]*#camera-feed-container[^{}]*\{[^{}]*\}/g);
 assert.deepEqual(cameraRules(now('public/b03.css')),cameraRules(old('public/b03.css')));
 assert.deepEqual(cameraRules(html),cameraRules(base));
 for(const p of ['public/figure-stage.mjs','public/orbit-layout.mjs','public/character-study.mjs'])assert.equal(now(p),old(p));
 assert.equal((html.match(/requestAnimationFrame\(/g)||[]).length,(base.match(/requestAnimationFrame\(/g)||[]).length);
 assert.ok(!/requestAnimationFrame|setInterval/.test(now('public/orbit-stage.mjs')));
});
