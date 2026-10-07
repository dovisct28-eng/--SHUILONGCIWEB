import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {NextGestureGate} from './public/next-gesture.mjs';
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
test('HF05 freezes camera preview/lifecycle, classification/reading math and layout algorithms; no new RAF',()=>{
 const baseline='9bf45d4e9d9d911a603d40fc590f41563fcdc874';
 const old=p=>execFileSync('git',['show',baseline+':Mural-Exhibition/'+p],{encoding:'utf8',maxBuffer:8e6}).replace(/\r\n/g,'\n');
 const now=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8').replace(/\r\n/g,'\n');
 const html=now('public/index.html'),base=old('public/index.html');
 const block=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
 for(const [a,b]of [['function initMediaPipe','let continuousOpenFrames'],['function isHandOpen','function handleGestureLogic'],['<div id="camera-feed-container">','<aside id="floating-info"']]){assert.ok(block(base,a,b).length>20);assert.equal(block(html,a,b),block(base,a,b));}
 assert.equal(gestureContract(html),gestureContract(base));
 const cameraRules=s=>s.match(/[^{}]*#camera-feed-container[^{}]*\{[^{}]*\}/g);
 assert.deepEqual(cameraRules(now('public/b03.css')),cameraRules(old('public/b03.css')));
 assert.deepEqual(cameraRules(html),cameraRules(base));
 for(const p of ['public/figure-stage.mjs','public/orbit-layout.mjs','public/character-study.mjs'])assert.equal(now(p),old(p));
 assert.equal((html.match(/requestAnimationFrame\(/g)||[]).length,(base.match(/requestAnimationFrame\(/g)||[]).length);
 assert.ok(!/requestAnimationFrame|setInterval/.test(now('public/orbit-stage.mjs')));
});

function handlerHarness(index=2) {
 const html=fs.readFileSync(new URL('public/index.html',import.meta.url),'utf8');
 const code=html.slice(html.indexOf('function isHandOpen'),html.indexOf('\n    </script>',html.indexOf('function isHandOpen')));
 const context=vm.createContext({NextGestureGate,Math,Date:{now:()=>context.time},time:2000});
 vm.runInContext(`let currentTrack='cyber',entryBusy=false,currentSeriesIndex=${index},isRevealed=false,gestureNeutralY=.5;
 let pointerHistory=[],continuousOpenFrames=0,continuousClosedFrames=0,currentHandState='closed';
 const nextGesture=new NextGestureGate(1000),shaderMaterial={uniforms:{uMouse:{value:{x:-10,y:-10}}}};
 const info={scrollHeight:100,clientHeight:100,scrollTop:0},document={getElementById:()=>info};
 const gsap={to(){}},orbitStage={acknowledgeSwipe(){}};
 let calls=0;function loadSeriesData(i){currentSeriesIndex=(i+8)%8;calls++;}function setRevealed(v){isRevealed=v;}
 ${code}
 this.handle=handleGestureLogic;this.snapshot=()=>({index:currentSeriesIndex,calls,armed:nextGesture.armed});`,context);
 return context;
}
const hand=(x=.5,y=.5,open=true)=>{const lm=Array.from({length:21},()=>({x,y,z:0}));lm[0].y=y+.15;lm[5].x=x-.04;lm[17].x=x+.04;for(const i of [8,12,16,20])lm[i].y=y-(open?.25:.02);return lm;};
function stroke(h,dx=.07,dy=0,frames=8){for(let i=0;i<frames;i++){h.time+=50;h.handle([hand(.2+i*dx,.5+i*dy)]);}}
test('All four swipe directions enter the real handler and advance exactly NEXT',()=>{
 for(const [dx,dy]of [[.07,0],[-.07,0],[.06,.04],[-.06,.04]]){const h=handlerHarness();stroke(h,dx,dy);assert.equal(h.snapshot().index,3);assert.equal(h.snapshot().calls,1);}
});
test('Held-open strokes remain latched beyond cooldown; closing or loss rearms once',()=>{
 const h=handlerHarness();stroke(h);for(let i=0;i<100;i++){h.time+=50;h.handle([hand(i%2?.2:.8)]);}assert.equal(h.snapshot().calls,1);
 for(let i=0;i<3;i++){h.time+=50;h.handle([hand(.5,.5,false)]);}stroke(h,-.07);assert.equal(h.snapshot().calls,2);
 h.handle([]);h.time+=1100;stroke(h);assert.equal(h.snapshot().calls,3);
 // Rearming alone must not bypass the secondary cooldown.
 h.handle([]);stroke(h);assert.equal(h.snapshot().calls,3);
});
test('Last gesture loops to first; NEXT endpoint is direction-free; mouse PREVIOUS remains',()=>{
 const h=handlerHarness(7);stroke(h,-.07);assert.equal(h.snapshot().index,0);
 const html=fs.readFileSync(new URL('public/index.html',import.meta.url),'utf8'),gesture=html.slice(html.indexOf('function handleGestureLogic'),html.indexOf('function triggerSwipeFlash'));
 assert.ok(!/currentSeriesIndex\s*-\s*1|deltaX|PREVIOUS/.test(gesture));assert.equal((gesture.match(/loadSeriesData\(currentSeriesIndex \+ 1\)/g)||[]).length,1);
 assert.ok(html.includes('button.onclick = () => stepCharacter(Number(button.dataset.step))'));assert.ok(html.includes('data-step="-1"'));assert.ok(!html.includes('单手挥动 · 切换人物'));
});
