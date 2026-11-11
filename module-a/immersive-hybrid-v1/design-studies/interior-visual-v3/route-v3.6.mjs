import {REAR_DOCKS,createRearRail} from './route-v3.3.mjs';
import {FIFTH_DOCK} from './route-v3.4.mjs';

const scanSettings=[
 {seconds:6,standOff:1.35,span:.32,fov:55},
 {seconds:8,standOff:3.75,span:.34,fov:39},
 {seconds:4,standOff:3.9,span:.34},
 {seconds:4,standOff:3.9,span:.34},
 {seconds:8,standOff:3.9,span:.34,fov:42},
];
const pose=(position,target)=>({position,target,fov:48});
const at=(x,y,z,tx,tz)=>pose([x,y,z],[tx,y,tz]);
const createTourRail=(segment,points)=>createRearRail(segment,points,{angularGaze:true});

// PlaneGeometry's local +X points to the photo's right edge. Rotate this
// vector and the front normal by the same angle used for the wall texture.
export function wallSweep(mural,index,start,aspect){
 const {seconds,standOff,span,fov=48}=scanSettings[index];
 const {position:center,rotation,width,height}=mural;
 const half=Math.min(width,height*aspect)*span;
 const right=[Math.cos(rotation),0,-Math.sin(rotation)];
 const normal=[Math.sin(rotation),0,Math.cos(rotation)];
 const stop=offset=>({
  position:center.map((v,i)=>v+right[i]*offset+normal[i]*standOff),
  target:center.map((v,i)=>v+right[i]*offset*.72),
  fov,
 });
 const begin=stop(half),end=stop(-half);
 return {seconds,approach:createTourRail(3,[start,begin]),scan:createTourRail(3,[begin,end]),end};
}

export function onwardRail(index,start){
 const connections=[
  [at(3.83,1.55,2.55,3.84,-3),at(3.85,1.38,-5.55,3.15,-7.2),
   at(2.55,1.38,-7.2,2.45,-10.2),at(2.35,1.62,-9.4,2.3,-12.1),
   at(1.35,1.85,-11.45,4.515,-12.6),REAR_DOCKS[0]],
  [at(.97,1.85,-12.8,3.2,-14.865),REAR_DOCKS[1]],
  [at(0,1.85,-10.85,-.7,-14.865),REAR_DOCKS[2]],
  [at(-2.75,1.85,-10.45,-4.515,-12.45),at(-.8,1.85,-10.6,-4.515,-11.75),FIFTH_DOCK],
 ];
 return createTourRail(Math.max(0,index-1),[start,...connections[index]]);
}

const exitPoints=[
 // Continue from the fifth mural along the west gallery. Cross toward
 // the central doorway only after clearing the stage.
 at(-1.45,1.85,-9.56,-3.2,-7.6),
 at(-2.35,1.62,-9.4,-2.5,-7.2),
 at(-2.55,1.38,-7.2,-3.65,-5.7),
 at(-3.85,1.38,-5.55,-3.85,2.4),
 at(-3.85,1.55,7.65,-3.75,10.7),
 at(-3.88,1.55,9.8,-1.4,11.25),
 at(-3.3,1.55,10.7,-.35,11.7),
 at(-1.45,1.45,10.95,-.05,11.6),
 at(-.08,1.38,11.35,0,15.4),
 at(0,1.38,12.25,0,16.25),
 at(0,1.38,14.1,0,18.1),
 at(0,1.38,16.5,0,20.5),
];
export const EXTERIOR_POSE={...at(0,1.38,16.5,0,11.8),time:.65};

export function exteriorTurn(progress){
 const heading=Math.PI*progress;
 return {...EXTERIOR_POSE,target:[-4.7*Math.sin(heading),1.38,16.5+4.7*Math.cos(heading)]};
}

export function exitRail(start){
 const rail=createTourRail(3,[start,...exitPoints]);
 return {...rail,sample(progress){
  const pose=rail.sample(progress);
  // Match the existing doorway light as the camera moves into the exterior.
  return {...pose,time:Math.max(.65,Math.min(1,1-(pose.position[2]-12)*.078))};
 }};
}
