import {createModel} from './model-view.mjs';
import {PRESETS,interpolate} from './camera-presets.mjs';
import {createController,STATES,animate} from './transition-controller.mjs';
import {createAssetLoader} from './asset-loader.mjs';
import {createParallax} from './parallax-scene.mjs';
import {createViewer} from './mural-viewer.mjs';
import {placeMural} from './depth-layers.mjs';

const $=s=>document.querySelector(s),frame=$('.frame'),scene=$('.scene'),canvas=$('#model'),status=$('#status'),muralLayer=$('.mural-layer'),muralButton=$('.mural-hit');
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');let reduced=reducedQuery.matches,model=null,active=null,compare=false,ready=false;
const loader=createAssetLoader(),parallax=createParallax(scene,loader);let manifest;
const copy={overview:['01','建筑总览','从大门进入，沿右侧通道抵达第一铺。','走近大门 →'],'gate-exterior':['02','大门入口','三处门洞，中门通向戏台后方。','进入门内 →'],'gate-interior':['03','绕过戏台','沿戏台右侧通道，进入院内。','走向廊道 →'],'gallery-approach':['04','右侧廊道','沿廊道前行，第一铺位于右侧墙面。','停靠第一铺 →'],'mural-01-stop':['05','第一铺壁画','点击墙面壁画，展开查看真实图像。','展开壁画 ↗']};
function drawUI(state){document.body.dataset.state=state;const c=copy[state]||copy['mural-01-stop'];$('#step').textContent=`空间 / ${c[0]}`;$('#title').textContent=c[1];$('#description').textContent=c[2];$('#next').textContent=c[3];$('#previous').disabled=state==='overview';for(const b of document.querySelectorAll('[data-state]')){if(b.dataset.state===state)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}muralLayer.style.opacity=state==='mural-01-stop'?'1':'0';muralButton.tabIndex=state==='mural-01-stop'?0:-1;muralButton.disabled=state!=='mural-01-stop';}
function debug(){if(!model)return;const state=controller.state,entry=active?.entry;$('#debug-data').textContent=JSON.stringify({state,busy:controller.busy,source:state==='overview'?'真实 Three.js 模型':active?.source,asset:active?.url,size:active?[active.image.naturalWidth,active.image.naturalHeight]:[canvas.width,canvas.height],camera:PRESETS[entry?.camera||'R01'],muralAnchor:[4.865,1.55,4.8],mask:entry?.mask||null,cacheEntries:loader.count,render: model.stats(),lastTransitionFrameMs:metrics(),reducedMotion:reduced,modelUnitNotice:manifest.modelUnitNotice},null,2);}
let times=[],lastFrame=0;function note(now){if(lastFrame)times.push(now-lastFrame);lastFrame=now;if(times.length>240)times.shift();}function metrics(){const a=times.slice().sort((a,b)=>a-b);return {samples:a.length,median:a[Math.floor(a.length*.5)]||null,p95:a[Math.floor(a.length*.95)]||null};}
function fit(){if(!model)return;model.resize(frame.clientWidth,frame.clientHeight,1);if(active?.entry.id==='mural-01-stop')placeMural(muralButton,model.project(),frame);debug();}
const viewer=createViewer($('dialog'),()=>controller.go('mural-01-stop'));
const controller=createController(async(next,previous)=>{
 if(!ready)return;
 $('#next').disabled=$('#previous').disabled=true;status.textContent='';lastFrame=0;times=[];
 try{
  if(next==='mural-01-detail'){await viewer.open();document.body.dataset.state=next;return;}
  if(previous==='mural-01-detail'){viewer.close();drawUI(next);return;}
  muralButton.disabled=true;
  if(next==='overview'){
   await animate(reduced?0:300,t=>{scene.style.opacity=1-t;note(performance.now());});parallax.hide();active=null;model.setCamera(PRESETS.R01);model.render();
  }else{
   const entry=manifest.scenes[next],assetPromise=loader.scene(entry);
   status.textContent='正在准备下一处空间…';await assetPromise;status.textContent='';
   if(previous==='overview'){
    await animate(reduced?0:1250,t=>{const cam=t<.55?interpolate(PRESETS.R01,PRESETS.R02,t/.55):interpolate(PRESETS.R02,PRESETS[entry.camera],(t-.55)/.45);model.setCamera(cam);model.render();note(performance.now());});
    model.setCamera(PRESETS[entry.camera]);model.render();active={...await parallax.set(entry),entry};scene.style.opacity='0';await animate(reduced?0:420,t=>{scene.style.opacity=t;note(performance.now());});
   }else{
    // Different physical viewpoints use short limited travel plus a matched
    // opacity handoff. A still image is never rotated as a walkable 3D room.
    await animate(reduced?0:220,t=>{scene.style.opacity=1-t*.85;parallax.move(t,reduced);note(performance.now());});
    model.setCamera(PRESETS[entry.camera]);model.render();active={...await parallax.set(entry),entry};scene.style.opacity='.15';await animate(reduced?0:260,t=>{scene.style.opacity=.15+t*.85;note(performance.now());});
   }
   model.setCamera(PRESETS[entry.camera]);model.render();if(next==='mural-01-stop')placeMural(muralButton,model.project(),frame);
   $('#compare').checked=false;compare=false;$('.reference').hidden=true;
   loader.trim([entry.generated,entry.reference]);
  }
  drawUI(next);status.textContent=active?.source==='参考渲染图'?'场景图尚未就绪，当前显示模型参考渲染图。':'';
 }catch(error){status.textContent=`资源未能加载：${error.message}。可刷新或返回建筑总览。`;throw error;}
 finally{$('#next').disabled=false;$('#previous').disabled=next==='overview';setTimeout(debug,0);}
});
function go(state){if(!ready)return Promise.resolve(false);return controller.go(state).catch(e=>console.warn('Gallery transition:',e.message));}
$('#next').onclick=()=>go(STATES[Math.min(5,STATES.indexOf(controller.state)+1)]);$('#previous').onclick=()=>go(STATES[Math.max(0,STATES.indexOf(controller.state)-1)]);muralButton.onclick=()=>go('mural-01-detail');
for(const b of document.querySelectorAll('[data-state]'))b.onclick=()=>go(b.dataset.state);
let wheelAmount=0,lastWheel=0,holdUntil=0;
window.addEventListener('wheel',e=>{if(!ready||controller.busy||controller.state==='mural-01-detail'||e.target.closest('aside,button'))return;const now=performance.now();if(now<holdUntil)return;if(now-lastWheel>180)wheelAmount=0;lastWheel=now;wheelAmount+=e.deltaY*(e.deltaMode===1?16:1);if(Math.abs(wheelAmount)>=75){const direction=Math.sign(wheelAmount);wheelAmount=0;holdUntil=now+900;if(controller.state==='mural-01-stop'&&direction>0)return;controller.step(direction).catch(e=>console.warn(e.message));}},{passive:true});
window.addEventListener('keydown',e=>{if(e.target.closest('button,input,dialog')||controller.state==='mural-01-detail')return;if(e.key==='ArrowRight'||e.key==='ArrowDown')$('#next').click();if(e.key==='ArrowLeft'||e.key==='ArrowUp')$('#previous').click();});
function setReduced(value){reduced=value;document.body.dataset.reduced=String(value);$('#motion').setAttribute('aria-pressed',String(value));$('#motion').textContent=value?'动态已减少':'减少动态';parallax.move(0,true);}
$('#motion').onclick=()=>setReduced(!reduced);reducedQuery.addEventListener('change',e=>setReduced(e.matches));setReduced(reduced);
$('#debug-toggle').onclick=()=>{const panel=$('#debug');panel.hidden=!panel.hidden;$('#debug-toggle').setAttribute('aria-expanded',String(!panel.hidden));debug();};
$('#compare').onchange=async e=>{compare=e.target.checked;if(active&&compare){$('.reference').src=active.entry.reference;await $('.reference').decode();$('.reference').hidden=false;}else $('.reference').hidden=true;};
$('#reload-assets').onclick=async()=>{if(controller.busy||!active)return;try{manifest=await fetch('./scene-manifest.json',{cache:'reload'}).then(r=>r.json());loader.clear();const original=manifest.scenes[active.entry.id],suffix=`?reload=${Date.now()}`,entry={...original,generated:original.generated+suffix,reference:original.reference+suffix};active={...await parallax.set(entry),entry};status.textContent=active.source==='参考渲染图'?'当前为参考渲染图':'已读取场景图';debug();}catch(error){status.textContent=error.message;}};
let pointerRaf=0;frame.addEventListener('pointermove',e=>{if(reduced||controller.busy||!active)return;const x=(e.clientX-innerWidth/2)/innerWidth;if(pointerRaf)cancelAnimationFrame(pointerRaf);pointerRaf=requestAnimationFrame(()=>{parallax.move(x);muralLayer.style.transform=$('.scene-background').style.transform;pointerRaf=0;});});frame.addEventListener('pointerleave',()=>{parallax.move(0,true);muralLayer.style.transform='none';});
addEventListener('resize',fit);addEventListener('pagehide',e=>{if(!e.persisted)model?.dispose();});
try{manifest=await fetch('./scene-manifest.json').then(r=>{if(!r.ok)throw Error('场景清单缺失');return r.json();});model=await createModel(canvas);fit();ready=true;status.textContent='';drawUI('overview');window.hybrid={go,get state(){return controller.state;},get busy(){return controller.busy;},get ready(){return ready;},get source(){return active?.source||'真实 Three.js 模型';},get active(){return active?.entry.id;},metrics,model,viewer,manifest,loader};if(new URLSearchParams(location.search).has('debug'))$('#debug-toggle').click();}
catch(error){status.textContent=`无法准备预览：${error.message}。请通过本地服务器打开并检查模型路径。`;document.body.dataset.error=error.message;}
