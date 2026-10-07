import {test} from 'node:test';
import assert from 'node:assert/strict';
import {alphaGeometry,figureLayout,stageSafeArea,cyberConfig} from './public/figure-stage.mjs';
import {orbitLayout,panelBounds,intersects,projectOccupancy,cropWindows,chooseTemplate} from './public/orbit-layout.mjs';

export function fixture(name,w=240,h=240) {
 const pixels=new Uint8ClampedArray(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const nx=x/w,ny=y/h;
  const filled={tall:nx>.46&&nx<.54&&ny>.03&&ny<.97,wide:ny>.44&&ny<.56&&nx>.03&&nx<.97,left:(nx>.04&&nx<.36&&ny>.1&&ny<.9)||(ny>.49&&ny<.51&&nx<.94),right:(nx>.64&&nx<.96&&ny>.1&&ny<.9)||(ny>.49&&ny<.51&&nx>.06),thin:(nx>.42&&nx<.6&&ny>.15&&ny<.9)||(ny>.21&&ny<.22&&nx>.01&&nx<.99),irregular:Math.hypot(nx-.5,ny-.5)<.45&&(nx<.4||ny>.55||nx>.7),holes:Math.hypot(nx-.5,ny-.5)<.44&&Math.hypot(nx-.5,ny-.5)>.23,edge:nx<.25&&ny>.01&&ny<.99,opaque:!(nx<.06&&ny<.2),empty:false}[name];
  if(filled)pixels[(y*w+x)*4+3]=name==='thin'&&nx>.65?1:255;
 }
 return {pixels,w,h};
}
test('one-pass contour metrics retain faint thin structures and expose geometry only',()=>{
 const {pixels,w,h}=fixture('thin'),g=alphaGeometry(pixels,w,h);
 assert.equal(g.grid.counts.reduce((s,n)=>s+n,0),pixels.filter((a,i)=>i%4===3&&a>=1).length);
 assert.ok(g.raw.x<.02&&g.raw.x+g.raw.width>.98);
 assert.ok(g.grid.counts.some(n=>n>0));assert.equal(g.face,undefined);assert.equal(g.weapon,undefined);
 assert.ok(Math.abs(g.distribution.left+g.distribution.right-1)<1e-8);
 assert.throws(()=>alphaGeometry(fixture('empty').pixels,w,h),/为空/);
});
test('geometry selects vertical, horizontal and asymmetric templates, without ID lookup tables',()=>{
 for(const [name,expected] of [['tall','vertical'],['wide','horizontal'],['left','asymmetric'],['right','asymmetric']]){
  const {pixels,w,h}=fixture(name),g=alphaGeometry(pixels,w,h);assert.equal(chooseTemplate(g,{width:w,height:h},'arbitrary-id'),expected);
 }
});
test('ten geometry stress cases × four sizes × two states use finite deterministic safe layouts',()=>{
 for(const name of ['tall','wide','left','right','thin','irregular','holes','edge','opaque','empty'])for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,800]])for(const revealed of [false,true]){
  const {pixels,w,h}=fixture(name);let geometry;try{geometry=alphaGeometry(pixels,w,h);}catch{}
  const bounds=geometry?.bounds||{x:0,y:0,width:1,height:1},panelLeft=width*.65;
  const figure=figureLayout({width:w,height:h,bounds,safe:stageSafeArea(width,height,panelLeft,revealed)});
  const projection={x:figure.x,y:figure.y,width:w*figure.scale,height:h*figure.scale};
  const forbidden=[{x:0,y:0,width,height:96},{x:0,y:height-165,width,height:165},...(revealed?[{x:panelLeft,y:100,width:width-panelLeft,height:height-200}]:[])];
  const args={width,height,effective:figure.effective,projection,geometry,revealed,panelLeft,id:name,forbidden};
  const a=orbitLayout(args);assert.deepEqual(a,orbitLayout(args));assert.equal(a.attempts,8);assert.ok(a.candidateCount<=320);
  const cells=projectOccupancy(geometry,projection,figure.effective);
  for(const [i,p] of a.panels.entries()){
   const r=panelBounds(p);assert.ok(r.x>=a.safe.x&&r.y>=a.safe.y&&r.x+r.width<=a.safe.x+a.safe.width&&r.y+r.height<=a.safe.y+a.safe.height);
   assert.ok(!cells.some(c=>intersects(r,c,10)),JSON.stringify({name,width,height,revealed,p}));
   assert.ok(!forbidden.some(c=>intersects(r,c,12)));assert.ok(!a.panels.slice(i+1).some(c=>intersects(r,panelBounds(c),16)));
  }
 }
});
test('ID, modes and viewport yield reproducible variation; collapse restores the same default',()=>{
 const f=fixture('irregular'),geometry=alphaGeometry(f.pixels,f.w,f.h),args={width:1440,height:900,effective:{x:540,y:150,width:360,height:530},geometry,projection:{x:500,y:110,width:460,height:620}};
 const a=orbitLayout({...args,id:'01'}),b=orbitLayout({...args,id:'02'});
 assert.notDeepEqual(a.panels,b.panels);
 orbitLayout({...args,id:'01',revealed:true,panelLeft:940});assert.deepEqual(a,orbitLayout({...args,id:'01'}));
 assert.notEqual(a.seed,orbitLayout({...args,id:'01',revealed:true,panelLeft:940}).seed);
});
test('crop selection avoids empty canvas, stays in bounds and caps available source resolution',()=>{
 for(const name of ['tall','wide','left','holes','thin']){
  const f=fixture(name,480,480),g=alphaGeometry(f.pixels,f.w,f.h),windows=cropWindows(g,f.w,f.h,g.bounds);
  for(const r of windows){assert.ok(r.score>=.08);assert.ok(r.x>=g.bounds.x&&r.y>=g.bounds.y&&r.x+r.width<=g.bounds.x+g.bounds.width+1e-9&&r.y+r.height<=g.bounds.y+g.bounds.height+1e-9);let occupied=0;for(let y=Math.floor(r.y*f.h);y<Math.ceil((r.y+r.height)*f.h);y++)for(let x=Math.floor(r.x*f.w);x<Math.ceil((r.x+r.width)*f.w);x++)if(f.pixels[(y*f.w+x)*4+3]>=1)occupied++;assert.ok(occupied>0);}
 }
});
test('author orbit calibration remains optional, bounded, and preserves unrelated metadata',()=>{
 const c=cyberConfig({summary:'原文',layout:{scale:.8,custom:'keep'},bounds:{x:0,y:0,width:1,height:1},orbit:{maxPanels:99,intensity:-1,template:'invalid',custom:'keep'},unknown:{keep:true}});
 assert.equal(c.layout.scale,.8);assert.equal(c.layout.custom,'keep');assert.equal(c.orbit.custom,'keep');assert.deepEqual(c.unknown,{keep:true});assert.equal(c.orbit.maxPanels,5);assert.equal(c.orbit.intensity,0);assert.equal(c.orbit.template,'auto');
 const args={width:1440,height:900,effective:{x:600,y:140,width:200,height:500},id:'any'};
 assert.equal(orbitLayout({...args,orbit:{maxPanels:0}}).panels.length,0);
 assert.ok(orbitLayout({...args,orbit:{maxPanels:2}}).panels.length<=2);
 assert.equal(orbitLayout({...args,orbit:{template:'horizontal'}}).template,'horizontal');
 assert.equal(orbitLayout({width:NaN,height:900}).degraded,'invalid-input');
 assert.equal(orbitLayout(null).degraded,'invalid-input');assert.equal(orbitLayout('invalid').degraded,'invalid-input');
 assert.ok(Number.isFinite(orbitLayout({...args,revealed:true,panelLeft:NaN}).safe.width));
 assert.equal(orbitLayout({...args,width:240,height:180}).panels.length,0);
 assert.ok(orbitLayout({...args,contents:[]}).panels.length===0);
 assert.doesNotThrow(()=>orbitLayout({...args,geometry:{raw:{x:0,y:0,width:0,height:1},aspect:Infinity,centroid:{x:Infinity}},forbidden:'invalid',contents:[null,{id:'a',aspect:NaN,maxEdge:NaN}]}));
});
