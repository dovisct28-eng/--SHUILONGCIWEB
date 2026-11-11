// Capture the displayed photo and the part of it visible inside the detail window.
export function culturePhoto(scene){
 const image=scene.querySelector('[data-culture-mural="1"]');
 if(!image?.naturalWidth)return null;
 const rect=image.getBoundingClientRect();
 if(!rect.width||!rect.height)return null;
 const clip=image.closest('.culture-ritual')?.getBoundingClientRect();
 return {
  image,rect,
  right:clip?100*(1-clip.width/rect.width):0,
  bottom:clip?100*(1-clip.height/rect.height):0,
 };
}

// Keep the source photograph registered while the detail window opens or closes.
export async function moveCulturePhoto(from,to){
 if(!from||!to||from.image.currentSrc!==to.image.currentSrc)return;
 const {image,rect}=to;
 const bridge=image.cloneNode();
 bridge.className='culture-image-bridge';
 bridge.alt='';
 bridge.setAttribute('aria-hidden','true');
 bridge.style.cssText=`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px`;
 const frame=({rect:other,right,bottom})=>({
  transform:`translate(${other.left-rect.left}px,${other.top-rect.top}px) scale(${other.width/rect.width})`,
  clipPath:`inset(0 ${right}% ${bottom}% 0)`,
 });
 document.body.append(bridge);
 image.style.visibility='hidden';
 try{
  await bridge.animate([frame(from),frame(to)],{
   duration:680,easing:'cubic-bezier(.25,.65,.24,1)',fill:'both',
  }).finished;
 }catch(error){
  if(error.name!=='AbortError')throw error;
 }finally{
  bridge.remove();
  image.style.visibility='';
 }
}
