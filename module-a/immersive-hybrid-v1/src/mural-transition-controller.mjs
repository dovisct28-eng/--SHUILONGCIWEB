import {FIRST_MURAL,sampleGallery} from './corridor-path.mjs';

export const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{const u=clamp(t);return u*u*u*(10+u*(-15+6*u));};
export const MURAL_TIMING=Object.freeze({turn:1450,reading:1750});
// The same discovery turn is sampled in reverse, using the new corridor centre.
export function sampleMuralTurn(progress){
 const u=ease(progress),start=sampleGallery(2),position=[...start.position];
 if(progress<=0)return start;
 const startYaw=Math.atan2(start.target[0]-start.position[0],start.position[2]-start.target[2]);
 const endYaw=Math.atan2(FIRST_MURAL.position[0]-position[0],position[2]-FIRST_MURAL.position[2]);
 const yaw=startYaw+(endYaw-startYaw)*u,pitch=0;
 const distance=Math.hypot(...start.target.map((v,i)=>v-start.position[i]));
 return {time:2,position,target:[position[0]+Math.sin(yaw)*Math.cos(pitch)*distance,position[1]+Math.sin(pitch)*distance,position[2]-Math.cos(yaw)*Math.cos(pitch)*distance],fov:48};
}
export function readingPhases(progress){const p=clamp(progress);return {handoff:ease(p/.35),rectify:ease((p-.35)/.65),ui:ease((p-.82)/.18)};}
export function createMuralController({prepare,animateTurn,animateReading,animateFront,holdFront,rollback}){
 let state='corridor-2_5d',busy=false,error=null;
 const adjacent={'corridor-2_5d':['mural-look'],'mural-look':['corridor-2_5d','mural-reading'],'mural-reading':['mural-look']};
 return {get state(){return state;},get busy(){return busy;},get error(){return error;},async go(next){
  if(busy||!adjacent[state]?.includes(next))return false;
  const previous=state;busy=true;error=null;
  try{
   if(previous==='corridor-2_5d')await prepare();
   if(next==='mural-reading'){
    await animateFront?.(1);await holdFront?.();await animateReading(1);
   }else if(previous==='mural-reading'){
    await animateReading(0);await holdFront?.();await animateFront?.(0);
   }else await animateTurn(next==='mural-look'?1:0);
   state=next;return true;
  }
  catch(e){error=e.message;state='corridor-2_5d';await rollback?.(e);throw e;}finally{busy=false;}
 }};
}
