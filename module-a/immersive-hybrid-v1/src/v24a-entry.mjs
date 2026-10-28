import * as T from '../vendor/three.module.js';
import {installV24Layers} from './v24a-layer.mjs';

const style=document.createElement('style');style.textContent=`
.v24a-label{position:fixed;top:74px;left:32px;z-index:25;color:#ddd3c3;font:12px system-ui;letter-spacing:.08em;pointer-events:none}
.v24a-open{position:fixed;right:32px;top:76px;z-index:30;background:#1c2628;color:#e2d8c8;border:1px solid #918575;padding:8px 12px;cursor:pointer}
.v24a-panel{position:fixed;z-index:31;right:30px;top:118px;width:295px;max-height:70vh;overflow:auto;padding:18px;background:#182124ee;border:1px solid #5f6c6b;color:#e1d8ca;font:13px/1.6 system-ui}
.v24a-panel[hidden]{display:none}.v24a-panel label{display:block;margin:10px 0}.v24a-panel select,.v24a-panel button{background:#283234;color:inherit;border:1px solid #717d79;padding:5px}.v24a-panel input[type=range]{width:100%}.v24a-panel pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:10px;max-height:180px;overflow:auto}
.v24a-loading{position:fixed;inset:0;z-index:100;background:#131d21;display:grid;place-items:center;color:#ddd3c3;font:15px system-ui}.v24a-loading[hidden]{display:none}
#debug-toggle{display:none}
`;document.head.append(style);
const loading=document.createElement('div');loading.className='v24a-loading';loading.setAttribute('role','status');loading.textContent='正在准备建筑与室内场景…';document.body.append(loading);
function stopDuringLoad(e){if(!loading.hidden){e.preventDefault();e.stopImmediatePropagation();}}addEventListener('wheel',stopDuringLoad,{capture:true,passive:false});addEventListener('keydown',stopDuringLoad,true);
let inputQuietUntil=0;
addEventListener('wheel',e=>{const h=window.hybrid;if(!loading.hidden||!h)return;const reading=h.state==='mural-reading';if(!reading&&!h.busy&&performance.now()>=inputQuietUntil)return;e.preventDefault();e.stopImmediatePropagation();if(h.busy){inputQuietUntil=performance.now()+400;return;}const dialog=document.querySelector('#mural-detail');if(reading&&dialog.open)dialog.querySelector(`[data-zoom="${e.deltaY>0?'-0.25':'0.25'}"]`).click();},{capture:true,passive:false});
const label=document.createElement('div');label.className='v24a-label';label.textContent='V2.4-A · 场景融合候选';document.body.append(label);
const open=document.createElement('button');open.className='v24a-open';open.textContent='场景调试';open.setAttribute('aria-expanded','false');document.body.append(open);
const panel=document.createElement('aside');panel.className='v24a-panel';panel.hidden=true;panel.innerHTML=`<strong>场景融合调试</strong><p>生成图片经模型表面投影；视觉与配准待审。</p><label>显示 <select id="v24-mode"><option value="hybrid">Hybrid 2.5D</option><option value="original">Original 3D</option><option value="ai">AI Scene（表面）</option></select></label><label><input id="v24-wall" type="checkbox" checked> 墙面图层</label><label><input id="v24-floor" type="checkbox" checked> 地面图层</label><label>手动接管 <input id="v24-blend" type="range" min="0" max="1" step=".01" value=".5"></label><button id="v24-auto">恢复轨道融合</button><pre id="v24-state"></pre>`;document.body.append(panel);
open.onclick=()=>{panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));};
let layer=null,lastError=null,prewarmPose=null;
const $=s=>panel.querySelector(s);const repaint=()=>{if(layer&&!panel.hidden)$('#v24-state').textContent=JSON.stringify(layer.state,null,2);};
$('#v24-mode').onchange=e=>{layer?.setMode(e.target.value);repaint();};$('#v24-wall').onchange=e=>{layer?.setLayer('wall',e.target.checked);repaint();};$('#v24-floor').onchange=e=>{layer?.setLayer('floor',e.target.checked);repaint();};$('#v24-blend').oninput=e=>{layer?.setBlend(e.target.value);repaint();};$('#v24-auto').onclick=()=>{layer?.setBlend(null);repaint();};
const clock=setInterval(async()=>{if(window.hybrid?.failed){clearInterval(clock);loading.hidden=true;label.textContent='建筑未能加载';return;}if(!window.hybrid?.ready)return;clearInterval(clock);try{layer=await installV24Layers(hybrid.model,T);hybrid.model.hybrid.setMode('original');
 prewarmPose=hybrid.model.pose;const warm=performance.now();hybrid.model.setCamera(hybrid.sample(1.6),{immediate:true});hybrid.model.setCamera(prewarmPose,{immediate:true});prewarmPose=null;window.v24aWarmMs=performance.now()-warm;
 label.textContent='V2.4-A.1 · 正视停靠候选';repaint();
 const frame=document.querySelector('#temple');document.querySelector('#gallery').addEventListener('click',e=>{if(e.target.closest('button,a,aside,dialog')||hybrid.busy||hybrid.state!=='mural-look')return;const rect=frame.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height,q=hybrid.model.mural.state().corners;if(q.length!==4)return;const cross=q.map((a,i)=>{const b=q[(i+1)%4];return (b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x);});if(cross.every(v=>v>=0)||cross.every(v=>v<=0))hybrid.go('mural-reading');});
}catch(e){lastError=e.message;layer?.dispose();layer=null;if(prewarmPose){try{hybrid.model.setCamera(prewarmPose,{immediate:true});}catch{}prewarmPose=null;}label.textContent='场景候选未加载 · 保留原建筑';console.error('V24A layer unavailable:',e);}finally{loading.hidden=true;}},80);
addEventListener('pagehide',()=>{clearInterval(clock);layer?.dispose();});
window.v24a={get ready(){return Boolean(layer);},get error(){return lastError;},get layer(){return layer;}};
