import {createMuralController,sampleMuralTurn,MURAL_TIMING,readingPhases} from './mural-transition-controller.mjs';
import {createViewer} from './mural-viewer.mjs';

export function createMuralExperience({runtime,reduced,onChange,onError}){
 const $=s=>document.querySelector(s),panel=$('#mural-copy'),dialog=$('#mural-detail');let turn=0,reading=0,frames=[],runs=[],loading=null,disposed=false;
 const viewer=createViewer(dialog,()=>viewer.close());
 function paint(){runtime.mural.setProgress(reading,false);runtime.setCamera(sampleMuralTurn(turn),{immediate:true});const ui=readingPhases(reading).ui;panel.hidden=ui===0;panel.style.opacity=ui;$('#mural-detail-open').disabled=reading<1||controller.busy;onChange();}
 async function animate(field,end){const start=field==='turn'?turn:reading,duration=reduced()?100:MURAL_TIMING[field==='turn'?'turn':'reading']*Math.abs(end-start);frames=[];const began=performance.now();let first,last;
  await new Promise((resolve,reject)=>{function tick(now){if(disposed){reject(Error('场景已退出'));return;}try{first??=now;const u=Math.min(1,(now-first)/Math.max(1,duration));if(last)frames.push(now-last);last=now;
   // Turn's sampler already eases angular velocity. Reading's phase sampler
   // controls the shared projection and ambient field with the same clock.
   const value=start+(end-start)*u;if(field==='turn')turn=value;else reading=value;paint();if(u<1)requestAnimationFrame(tick);else resolve();}catch(e){reject(e);}}requestAnimationFrame(tick);});runs.push({field,end,elapsedMs:performance.now()-began,...metrics()});
 }
 async function prepare(retry=false){if(loading)return loading;loading=(async()=>{await runtime.hybrid.load();if(!await runtime.mural.load(retry))throw Error(runtime.mural.error??'壁画加载失败');return true;})();try{return await loading;}finally{loading=null;}}
 const controller=createMuralController({prepare,animateTurn:end=>animate('turn',end),animateReading:end=>animate('reading',end),rollback(){turn=reading=0;runtime.mural.reset();runtime.setCamera(sampleMuralTurn(0));panel.hidden=true;runtime.renderFrame();}});
 function metrics(){const a=[...frames].sort((a,b)=>a-b);return {samples:a.length,p50:a[Math.floor(a.length*.50)]??null,p95:a[Math.floor(a.length*.95)]??null,max:a.at(-1)??null};}
 async function go(next){try{const result=await controller.go(next);$('#mural-detail-open').disabled=controller.state!=='mural-reading';if(result)onError(null);onChange();return result;}catch(e){onError(e);onChange();return false;}}
 $('#mural-detail-open').onclick=()=>{if(controller.state==='mural-reading'&&!controller.busy)viewer.open().catch(onError);};
 $('#mural-return-wall').onclick=()=>go('mural-look');
 $('#mural-retry').onclick=async()=>{try{await prepare(true);$('#mural-retry').hidden=true;onError(null);}catch(e){onError(e);}};
 $('#mural-mode').onchange=e=>{if(controller.busy)return;runtime.mural.setMode(e.target.value);runtime.renderFrame();onChange();};
 $('#mural-progress').oninput=e=>{if(controller.busy||controller.state==='corridor-2_5d')return;reading=Number(e.target.value);paint();};
 $('#mural-auto').onclick=()=>{if(controller.busy)return;reading=controller.state==='mural-reading'?1:0;runtime.mural.setMode('hybrid');$('#mural-mode').value='hybrid';paint();};
 addEventListener('resize',()=>{if(controller.state!=='corridor-2_5d')requestAnimationFrame(()=>{if(!disposed){runtime.renderFrame();onChange();}});});
 return {go,prepare,metrics,get state(){return controller.state;},get busy(){return controller.busy;},get active(){return turn>0||controller.state!=='corridor-2_5d'||controller.busy;},snapshot:()=>({state:controller.state,busy:controller.busy,error:controller.error,turn,reading,metrics:metrics(),runs:[...runs],composite:runtime.mural.state()}),
  debugTurn(p){if(controller.busy)return false;turn=Math.max(0,Math.min(1,p));paint();return true;},
  dispose(){disposed=true;viewer.close();}
 };
}
