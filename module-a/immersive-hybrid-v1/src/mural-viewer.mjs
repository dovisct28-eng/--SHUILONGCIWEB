export function createViewer(dialog,onClose){let scale=1,offset=[0,0],drag=null,restore=null;const image=dialog.querySelector('img'),viewport=dialog.querySelector('.detail-image');
 function update(){const bounds=viewport.getBoundingClientRect();offset=offset.map((v,i)=>Math.max(-bounds[i?'height':'width']*(scale-1)/2,Math.min(bounds[i?'height':'width']*(scale-1)/2,v)));image.style.transform=`translate(${offset[0]}px,${offset[1]}px) scale(${scale})`;dialog.querySelector('[data-zoom-value]').textContent=`${Math.round(scale*100)}%`;}
 dialog.querySelector('[data-close]').onclick=onClose;dialog.addEventListener('cancel',e=>{e.preventDefault();onClose();});
 for(const button of dialog.querySelectorAll('[data-zoom]'))button.onclick=()=>{const delta=Number(button.dataset.zoom);scale=delta?Math.min(3,Math.max(1,scale+delta)):1;if(scale===1)offset=[0,0];update();};
 viewport.addEventListener('pointerdown',e=>{if(scale<=1||e.button!==0)return;drag=[e.clientX,e.clientY,...offset];viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{if(drag){offset=[drag[2]+e.clientX-drag[0],drag[3]+e.clientY-drag[1]];update();}});for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,()=>drag=null);
 addEventListener('resize',update);
 return {async open(){restore=document.activeElement;await image.decode();scale=1;offset=[0,0];dialog.showModal();update();dialog.querySelector('[data-close]').focus();},close(){dialog.close();restore?.focus();},get scale(){return scale;}};
}
