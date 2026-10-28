import {GALLERY_CONFIG} from './gallery-config.mjs';
const style=document.createElement('style');style.textContent=`
.v24a-label{position:fixed;top:74px;left:32px;z-index:25;color:#ddd3c3;font:12px system-ui;letter-spacing:.08em;pointer-events:none}
.v24a-loading{position:fixed;inset:0;z-index:100;background:#131d21;display:grid;place-items:center;color:#ddd3c3;font:15px system-ui}.v24a-loading[hidden]{display:none}
#debug-toggle{display:none}
`;document.head.append(style);
const loading=document.createElement('div');loading.className='v24a-loading';loading.setAttribute('role','status');loading.textContent='正在准备建筑与壁画…';document.body.append(loading);
function stopDuringLoad(e){if(!loading.hidden){e.preventDefault();e.stopImmediatePropagation();}}addEventListener('wheel',stopDuringLoad,{capture:true,passive:false});addEventListener('keydown',stopDuringLoad,true);

let inputQuietUntil=0;
addEventListener('wheel',e=>{const h=window.hybrid;if(!loading.hidden||!h)return;const reading=h.state==='mural-reading';if(!reading&&!h.busy&&performance.now()>=inputQuietUntil)return;e.preventDefault();e.stopImmediatePropagation();if(h.busy){inputQuietUntil=performance.now()+400;return;}const dialog=document.querySelector('#mural-detail');if(reading&&dialog.open)dialog.querySelector(`[data-zoom="${e.deltaY>0?'-0.25':'0.25'}"]`).click();},{capture:true,passive:false});

const label=document.createElement('div');label.className='v24a-label';label.textContent='V2.4-B1 · Combined B · 纯 3D 路线待视觉验收';document.body.append(label);
let prepared=false,lastError=null;
const clock=setInterval(()=>{
 if(window.hybrid?.failed){loading.hidden=true;label.textContent='建筑未能加载 · 可重试';return;}
 if(!window.hybrid?.ready)return;clearInterval(clock);
 try{
  if(hybrid.model.hybrid.state().generatedInterior!==false)throw Error('Combined B 纯 3D 配置未生效');
  const frame=document.querySelector('#temple');
  document.querySelector('#gallery').addEventListener('click',e=>{
   if(e.target.closest('button,a,aside,dialog')||hybrid.busy||hybrid.state!=='mural-look')return;
   const rect=frame.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height,q=hybrid.model.mural.state().corners;
   if(q.length!==4)return;const cross=q.map((a,i)=>{const b=q[(i+1)%4];return (b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);});
   if(cross.every(v=>v>=0)||cross.every(v=>v<=0))hybrid.go('mural-reading');
  });label.textContent='V2.4-B1 · Combined B · 纯 3D 路线待视觉验收';prepared=true;
 }catch(e){lastError=e.message;label.textContent=e.message;console.error(e);}finally{loading.hidden=true;}
},80);
addEventListener('pagehide',()=>clearInterval(clock));
window.v24a={get ready(){return prepared;},get error(){return lastError;},config:GALLERY_CONFIG};
