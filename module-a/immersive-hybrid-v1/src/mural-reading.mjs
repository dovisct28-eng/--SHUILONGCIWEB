import {createMuralController,sampleMuralTurn,MURAL_TIMING,readingPhases} from './mural-transition-controller.mjs';
import {createViewer} from './mural-viewer.mjs';
import {FIRST_FRONT_DOCK,sampleMuralFront,frontReadingPhases} from './mural-front.mjs';
import {projectWallCue} from './mural-wall-cue.mjs';
const DARK_MURAL=.14;

export function createMuralExperience({runtime,reduced,onChange,onError,frontDock=false,autoDiscovery=false}){
 const $=s=>document.querySelector(s),panel=$('#mural-copy'),dialog=$('#mural-detail'),cue=$('#mural-cue');let turn=0,front=0,reading=0,phase='idle',frames=[],runs=[],loading=null,disposed=false,brightness=autoDiscovery?DARK_MURAL:1,cueOpacity=0;
 const config=frontDock?FIRST_FRONT_DOCK:null,phases=frontDock?frontReadingPhases:readingPhases;
 if(frontDock)runtime.mural.setReadingPhases(phases);
 if(autoDiscovery)runtime.mural.setBrightness(brightness);
 const viewer=createViewer(dialog,()=>viewer.close());
 function placeCue(){if(!cue||cue.hidden)return;const projected=projectWallCue(runtime.camera,$('#temple').getBoundingClientRect(),$('#gallery').getBoundingClientRect());cue.style.transform=`matrix3d(${projected.matrix.join(',')})`;}
 function paint(){runtime.mural.setProgress(reading,false);if(autoDiscovery)runtime.mural.setBrightness(brightness,false);runtime.setCamera(config&&turn===1?sampleMuralFront(front,config):sampleMuralTurn(turn),{immediate:true});if(cue){cue.hidden=cueOpacity<=0;cue.style.opacity=cueOpacity;placeCue();}const ui=phases(reading).ui;panel.hidden=ui===0;panel.style.opacity=ui;panel.inert=controller.busy||reading<1;$('#mural-detail-open').disabled=reading<1||controller.busy;onChange();}
 async function animate(field,end){const start=field==='turn'?turn:field==='front'?front:reading,duration=reduced()?100:(config?.transition[field]??MURAL_TIMING[field])*Math.abs(end-start);frames=[];phase=field==='front'?'mural-front-transition':field==='reading'?'mural-reading-transition':'mural-discovery';const began=performance.now();let first,last;
  await new Promise((resolve,reject)=>{function tick(now){if(disposed){reject(Error('场景已退出'));return;}try{first??=now;const u=Math.min(1,(now-first)/Math.max(1,duration));if(last)frames.push(now-last);last=now;
   // Turn's sampler already eases angular velocity. Reading's phase sampler
   // controls the shared projection and ambient field with the same clock.
   const value=start+(end-start)*u;if(field==='turn'){turn=value;if(autoDiscovery&&end===0)brightness=DARK_MURAL+(1-DARK_MURAL)*(1-u*u*(3-2*u));}else if(field==='front')front=value;else reading=value;paint();if(u<1)requestAnimationFrame(tick);else resolve();}catch(e){reject(e);}}requestAnimationFrame(tick);});runs.push({field,end,elapsedMs:performance.now()-began,...metrics()});
 }
 async function cueStage(name,duration,update){phase=name;const started=performance.now();await new Promise((resolve,reject)=>{let first;function tick(now){if(disposed){reject(Error('场景已退出'));return;}try{first??=now;const u=Math.min(1,(now-first)/Math.max(1,duration));update(u);paint();if(u<1)requestAnimationFrame(tick);else resolve();}catch(e){reject(e);}}requestAnimationFrame(tick);});runs.push({field:name,elapsedMs:performance.now()-started});}
 async function discover(){
  if(reduced()){phase='mural-cue-hold';cueOpacity=1;paint();await cueStage('mural-cue-hold',900,()=>{});brightness=1;cueOpacity=0;paint();return;}
  await cueStage('mural-cue-in',500,u=>{cueOpacity=u*u*(3-2*u);});
  await cueStage('mural-cue-hold',850,()=>{});
  await cueStage('mural-brighten',900,u=>{const s=u*u*(3-2*u);brightness=DARK_MURAL+(1-DARK_MURAL)*s;const t=Math.max(0,Math.min(1,(u-.55)/.45));cueOpacity=1-t*t*(3-2*t);});
  brightness=1;cueOpacity=0;paint();
 }
 async function holdFront(){phase='mural-front';paint();const began=performance.now(),duration=reduced()?0:config.transition.hold;await new Promise((resolve,reject)=>{function tick(){if(disposed){reject(Error('场景已退出'));return;}if(performance.now()-began>=duration)resolve();else requestAnimationFrame(tick);}tick();});runs.push({field:'hold',end:front,elapsedMs:performance.now()-began});}
 async function prepare(retry=false){if(loading)return loading;loading=(async()=>{await runtime.hybrid.load();if(!await runtime.mural.load(retry))throw Error(runtime.mural.error??'壁画加载失败');return true;})();try{return await loading;}finally{loading=null;}}
 const controller=createMuralController({prepare,animateTurn:end=>animate('turn',end),animateReading:end=>animate('reading',end),...(config?{animateFront:end=>animate('front',end),holdFront}:{}),...(autoDiscovery?{discover}:{}),rollback(){turn=front=reading=0;brightness=autoDiscovery?DARK_MURAL:1;cueOpacity=0;phase='idle';if(cue)cue.hidden=true;runtime.mural.reset();if(autoDiscovery)runtime.mural.setBrightness(brightness,false);runtime.setCamera(sampleMuralTurn(0));panel.hidden=true;panel.inert=false;runtime.renderFrame();}});
 function metrics(){const a=[...frames].sort((a,b)=>a-b);return {samples:a.length,p50:a[Math.floor(a.length*.50)]??null,p95:a[Math.floor(a.length*.95)]??null,max:a.at(-1)??null};}
 async function go(next){try{const result=await controller.go(next);if(!controller.busy){phase=controller.state;panel.inert=reading<1;$('#mural-detail-open').disabled=controller.state!=='mural-reading';}if(result)onError(null);onChange();return result;}catch(e){onError(e);onChange();return false;}}
 $('#mural-detail-open').onclick=()=>{if(controller.state==='mural-reading'&&!controller.busy)viewer.open().catch(onError);};
 $('#mural-return-wall').onclick=()=>go('mural-look');
 $('#mural-retry').onclick=async()=>{try{await prepare(true);$('#mural-retry').hidden=true;onError(null);}catch(e){onError(e);}};
 $('#mural-mode').onchange=e=>{if(controller.busy)return;runtime.mural.setMode(e.target.value);runtime.renderFrame();onChange();};
 $('#mural-progress').oninput=e=>{if(controller.busy||controller.state==='corridor-2_5d')return;if(config&&controller.state!=='mural-reading')return;reading=Number(e.target.value);paint();};
 $('#mural-auto').onclick=()=>{if(controller.busy)return;reading=controller.state==='mural-reading'?1:0;runtime.mural.setMode('hybrid');$('#mural-mode').value='hybrid';paint();};
 addEventListener('resize',()=>{if(controller.state!=='corridor-2_5d'||controller.busy)requestAnimationFrame(()=>{if(!disposed){runtime.renderFrame();placeCue();onChange();}});});
 return {go,prepare,metrics,get state(){return controller.state;},get busy(){return controller.busy;},get active(){return turn>0||controller.state!=='corridor-2_5d'||controller.busy;},snapshot:()=>({state:controller.state,busy:controller.busy,error:controller.error,turn,front,reading,brightness,cueOpacity,phase,frontDock:config,metrics:metrics(),runs:[...runs],composite:runtime.mural.state()}),
  debugTurn(p){if(controller.busy)return false;turn=Math.max(0,Math.min(1,p));paint();return true;},
  dispose(){disposed=true;viewer.close();}
 };
}
