import {createInkScene} from '../../a01/ink-scene.mjs';
import {GALLERY_STOPS as ENTRY_STOPS,sampleGallery as sampleEntry,createGalleryController as createEntryController,travelMs} from './corridor-path.mjs';
const $=s=>document.querySelector(s),iframe=$('#temple'),status=$('#status');
createInkScene($('#gallery'))(5,false);
const query=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=query.matches,runtime=null,ready=false,progress=0,frames=[],last=0,failed=false,replayBusy=false;
function metrics(){const a=frames.slice().sort((a,b)=>a-b);return {samples:a.length,p50:a[Math.floor(a.length*.5)]??null,p95:a[Math.floor(a.length*.95)]??null,max:a.at(-1)??null};}
function debug(){if(runtime&&!$('#debug').hidden)$('#debug-data').textContent=JSON.stringify({state:controller.state,busy:controller.busy||replayBusy,progress,camera:runtime.pose,reducedMotion:reduced,frameMs:metrics(),stats:runtime.stats()},null,2);}
function draw(state){const i=ENTRY_STOPS.findIndex(s=>s.id===state);document.body.dataset.state=state;$('#step').textContent=`0${i+1} / 0${ENTRY_STOPS.length}`;$('#title').textContent=ENTRY_STOPS[i].label;$('#previous').disabled=!ready||i===0;$('#next').disabled=!ready||i===ENTRY_STOPS.length-1;for(const b of document.querySelectorAll('[data-stop]')){if(b.dataset.stop===state)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}debug();}
function moveTo(end,full=false){const start=progress,duration=reduced?100:Math.max(180,travelMs(start,end));frames=[];last=0;
 return new Promise((resolve,reject)=>{let began;function tick(now){try{began??=now;const u=Math.min(1,(now-began)/duration);if(last)frames.push(now-last);last=now;
   // Ease the clock, never reset the rail at a node. Reverse uses the same rail.
   const eased=full?u:u*u*(3-2*u);progress=start+(end-start)*eased;runtime.setCamera(sampleEntry(progress));debug();
   if(u<1)requestAnimationFrame(tick);else resolve();
 }catch(e){reject(e);}}requestAnimationFrame(tick);});}
let wheel=0,lastWheel=0,settledAt=0;
async function prepareBlend(end){if(end<=1.6)return;if(runtime.hybrid.status==='loading')status.textContent='正在准备廊道…';const loaded=await runtime.hybrid.load();runtime.hybrid.setEnabled(loaded);$('#retry-enhancement').hidden=loaded;status.textContent=loaded?'':'廊道材质暂不可用，可继续参观或重试。';}
const controller=createEntryController(async next=>{if(!ready)throw Error('建筑尚未加载');$('#previous').disabled=$('#next').disabled=true;wheel=0;try{const end=ENTRY_STOPS.find(s=>s.id===next).time;await prepareBlend(end);await moveTo(end);if(runtime.hybrid.status!=='failed')status.textContent='';}catch(e){status.textContent=`镜头未能完成：${e.message}`;throw e;}finally{settledAt=performance.now();wheel=0;setTimeout(()=>draw(controller.state),0);}});
async function go(next){if(!ready||replayBusy)return false;if(!controller.busy){$('#depth-overlay').hidden=true;runtime.hybrid.setBlend(null);}try{const result=await controller.go(next);draw(controller.state);return result;}catch(e){draw(controller.state);return false;}}
$('#next').onclick=()=>go(ENTRY_STOPS[Math.min(ENTRY_STOPS.length-1,ENTRY_STOPS.findIndex(s=>s.id===controller.state)+1)].id);
$('#previous').onclick=()=>go(ENTRY_STOPS[Math.max(0,ENTRY_STOPS.findIndex(s=>s.id===controller.state)-1)].id);
for(const b of document.querySelectorAll('[data-stop]'))b.onclick=()=>go(b.dataset.stop);
addEventListener('wheel',e=>{if(e.target.closest('aside,button,a')||!ready||controller.busy||replayBusy){wheel=0;lastWheel=performance.now();return;}const now=performance.now();if(now-settledAt<300||now-lastWheel<160&&wheel===0){lastWheel=now;return;}if(now-lastWheel>180)wheel=0;lastWheel=now;wheel+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);if(Math.abs(wheel)>=75){const dir=Math.sign(wheel);wheel=0;go(ENTRY_STOPS[Math.max(0,Math.min(ENTRY_STOPS.length-1,ENTRY_STOPS.findIndex(s=>s.id===controller.state)+dir))].id);}},{passive:true});
addEventListener('keydown',e=>{if(e.target.closest('button,input,a,aside'))return;if(['ArrowDown','ArrowRight'].includes(e.key)){$('#next').click();e.preventDefault();}if(['ArrowUp','ArrowLeft'].includes(e.key)){$('#previous').click();e.preventDefault();}});
function setReduced(value){reduced=value;$('#motion').setAttribute('aria-pressed',String(value));$('#motion').textContent=value?'动态已减少':'减少动态';debug();}
$('#motion').onclick=()=>setReduced(!reduced);query.addEventListener('change',e=>setReduced(e.matches));setReduced(reduced);
$('#debug-toggle').onclick=()=>{$('#debug').hidden=!$('#debug').hidden;$('#debug-toggle').setAttribute('aria-expanded',String(!$('#debug').hidden));debug();};
$('#export').onclick=()=>{if(!runtime)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(runtime.handoff(),null,2)],{type:'application/json'}));a.href=url;a.download='shuilongci-corridor-handoff-v2-2.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
async function replay(){if(!ready||controller.busy||replayBusy)return false;await go('overview');replayBusy=true;try{await prepareBlend(2);await moveTo(1,true);await moveTo(2,true);}finally{replayBusy=false;}await go('corridor-2_5d');return true;}
$('#replay').onclick=replay;
$('#render-mode').onchange=()=>{if(!runtime||controller.busy||replayBusy)return;runtime.hybrid.setMode($('#render-mode').value);debug();};
$('#blend').oninput=()=>{if(!runtime||controller.busy||replayBusy)return;runtime.hybrid.setBlend(Number($('#blend').value));debug();};
$('#blend-auto').onclick=()=>{runtime?.hybrid.setBlend(null);debug();};
$('#lock-camera').onclick=()=>go('corridor-hybrid');
$('#show-depth').onclick=()=>{if(!runtime||controller.busy||replayBusy)return;const overlay=$('#depth-overlay');if(!overlay.hidden){overlay.hidden=true;overlay.removeAttribute('src');return;}overlay.src=runtime.captureMask(2.8);overlay.hidden=false;};
async function retryEnhancement(){if(!ready||controller.busy||replayBusy)return false;const end=progress>1.6?ENTRY_STOPS.find(s=>s.id===controller.state).id:null;if(end)await go('corridor-3d');const ok=await runtime.hybrid.load(true);$('#retry-enhancement').hidden=ok;status.textContent=ok?'':'廊道材质暂不可用，可继续参观或重试。';if(ok&&end)await go(end);return ok;}
$('#retry-enhancement').onclick=retryEnhancement;
function fail(message){if(ready)return;clearInterval(poll);clearTimeout(timeout);failed=true;status.textContent=`无法准备入口：${message}。检查本地服务后可重试。`;$('#retry').hidden=false;}
let poll,timeout;
addEventListener('message',event=>{if(event.origin===location.origin&&event.source===iframe.contentWindow&&event.data?.type==='shuilong:entry-error'){clearInterval(poll);clearTimeout(timeout);fail(event.data.message);}});
function waitForRuntime(){clearInterval(poll);clearTimeout(timeout);failed=false;poll=setInterval(()=>{try{const w=iframe.contentWindow;if(w.location.href!=='about:blank'&&w.document.readyState==='complete'&&!w.document.querySelector('script[type="module"]')){fail('场景未能加载');return;}if(w.shuilongTemple?.entry&&w.modelReady){clearInterval(poll);clearTimeout(timeout);runtime=w.shuilongTemple.entry;runtime.setCamera(sampleEntry(progress));ready=true;$('#retry').hidden=true;status.textContent='';draw(controller.state);}}catch(e){fail(e.message);}},80);timeout=setTimeout(()=>fail('模型或环境加载超时'),45000);}
iframe.addEventListener('error',()=>fail('场景请求失败'));iframe.addEventListener('load',()=>{try{if(!iframe.contentDocument.querySelector('script[type="module"]')){clearInterval(poll);clearTimeout(timeout);fail('场景未能加载');}}catch(e){fail(e.message);}});
$('#retry').onclick=()=>{ready=false;progress=0;status.textContent='正在重新准备建筑与环境…';$('#retry').hidden=true;iframe.src=iframe.src;waitForRuntime();};
window.hybrid={go,replay,retryEnhancement,get ready(){return ready;},get failed(){return failed;},get state(){return controller.state;},get busy(){return controller.busy||replayBusy;},get progress(){return progress;},get model(){return runtime;},metrics,sample:sampleEntry,stops:ENTRY_STOPS};
waitForRuntime();if(new URLSearchParams(location.search).has('debug'))$('#debug-toggle').click();
