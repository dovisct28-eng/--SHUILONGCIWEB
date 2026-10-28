import {FIRST_MURAL} from './corridor-path.mjs';
import {clamp,ease,sampleMuralTurn} from './mural-transition-controller.mjs';

// Model units, not a surveyed viewpoint. Only mural-01 has a validated route.
export function frontCamera({center,normal,standOff,fov=48}){
 const length=Math.hypot(...normal);
 if(!(length>0&&standOff>0))throw Error('Invalid mural viewing normal or distance');
 return {time:2,position:center.map((v,i)=>v+normal[i]/length*standOff),target:[...center],fov};
}
export const FIRST_FRONT_DOCK=Object.freeze({
 muralId:'mural-01',center:FIRST_MURAL.position,normal:Object.freeze([-1,0,0]),
 width:FIRST_MURAL.width,height:FIRST_MURAL.height,standOff:2.058,
 discoveryCamera:sampleMuralTurn(1),
 // Keep the eye inside the corridor; full-image framing belongs to reading.
 frontCamera:frontCamera({center:FIRST_MURAL.position,normal:[-1,0,0],standOff:2.058}),
 transition:Object.freeze({front:1600,hold:320,reading:1400}),
});
function direction(pose){const d=pose.target.map((v,i)=>v-pose.position[i]),length=Math.hypot(...d);return {unit:d.map(v=>v/length),length};}
// Spherical direction and position share one C2 clock. No accumulated deltas,
// coordinate changes in event handlers, or separate pan/turn animations.
export function sampleMuralFront(progress,config=FIRST_FRONT_DOCK){
 const p=clamp(progress),a=config.discoveryCamera,b=config.frontCamera;
 if(p===0)return {...structuredClone(a),muralFront:0};
 if(p===1)return {...structuredClone(b),muralFront:1};
 const u=ease(p),from=direction(a),to=direction(b),dot=Math.max(-1,Math.min(1,from.unit.reduce((n,v,i)=>n+v*to.unit[i],0))),theta=Math.acos(dot);
 if(dot<-.99999)throw Error('Opposite views require a validated intermediate camera');
 const d=theta<1e-6?from.unit.map((v,i)=>v+(to.unit[i]-v)*u):from.unit.map((v,i)=>(v*Math.sin((1-u)*theta)+to.unit[i]*Math.sin(u*theta))/Math.sin(theta));
 const length=from.length+(to.length-from.length)*u,position=a.position.map((v,i)=>v+(b.position[i]-v)*u);
 return {time:2,position,target:position.map((v,i)=>v+d[i]*length),fov:a.fov+(b.fov-a.fov)*u,muralFront:p};
}
export function frontReadingPhases(progress){const p=clamp(progress);return {handoff:ease(p/.12),rectify:ease((p-.12)/.76),ui:ease((p-.84)/.16)};}
