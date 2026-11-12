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

const exteriorZ=23;
export const EXTERIOR_POSE={position:[0,1.38,exteriorZ],target:[-3.1,1.08,12.1],fov:64,time:.65};

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
 at(0,1.38,17.5,0,21.5),
 at(0,1.38,exteriorZ,0,exteriorZ+4),
];
// The gate geometry ends near z=12.2. Keep the forward gaze until the
// camera and its collision clearance are both outside.
const turnStartZ=12.8;
const turnDuration=3500;
const walkDuration=17500;
const walkRamp=1100;
const turnRamp=650;
const settle=1050;
const smoothstep=t=>t*t*(3-2*t);
const integratedSmoothstep=t=>t*t*t*(1-t/2);
const exteriorLook=EXTERIOR_POSE.target.map((value,i)=>value-EXTERIOR_POSE.position[i]);
const exteriorYaw=Math.atan2(exteriorLook[0],exteriorLook[2]);
const exteriorReach=Math.hypot(exteriorLook[0],exteriorLook[2]);

export const EXIT_DURATION=walkDuration+turnDuration;

export function exitRail(start){
 const rail=createTourRail(3,[start,...exitPoints]);
 const turnLength=exteriorZ-turnStartZ;
 const walkLength=rail.length-turnLength;
 const walkSpeed=walkLength/(walkDuration-walkRamp/2);
 const turnSpeed=(turnLength-walkSpeed*turnRamp/2)/(turnDuration-turnRamp/2-settle/2);

 function sample(progress){
  const pose=rail.sample(progress);
  // Match the existing doorway light as the camera moves into the exterior.
  return {...pose,time:Math.max(.65,Math.min(1,1-(pose.position[2]-12)*.078))};
 }

 function sampleExit(progress){
  const elapsed=progress*EXIT_DURATION;
  if(elapsed>=EXIT_DURATION)return EXTERIOR_POSE;
  if(elapsed<=walkDuration){
   const distance=elapsed<walkRamp
    ?walkSpeed*walkRamp*integratedSmoothstep(elapsed/walkRamp)
    :walkSpeed*(elapsed-walkRamp/2);
   return sample(distance/rail.length);
  }

  // Integrate the speed ramps on the same rail so the end of the walk,
  // the moving turn and the stop share a continuous velocity.
  const turning=elapsed-walkDuration;
  const ramp=Math.min(turning,turnRamp);
  const braking=Math.max(0,turning-(turnDuration-settle));
  const distance=walkSpeed*ramp+(turnSpeed-walkSpeed)*turnRamp*integratedSmoothstep(ramp/turnRamp)
   +turnSpeed*(turning-ramp-settle*integratedSmoothstep(braking/settle));
  const pose=sample((walkLength+distance)/rail.length);
  const blend=smoothstep(turning/turnDuration);
  const [x,y,z]=pose.position;
  const [dx,dy,dz]=pose.target.map((value,i)=>value-pose.position[i]);
  const yaw=Math.atan2(dx,dz)*(1-blend)+exteriorYaw*blend;
  const reach=Math.hypot(dx,dz)*(1-blend)+exteriorReach*blend;
  return {
   ...pose,
   target:[x+reach*Math.sin(yaw),y+dy*(1-blend)+exteriorLook[1]*blend,z+reach*Math.cos(yaw)],
   fov:pose.fov+(EXTERIOR_POSE.fov-pose.fov)*blend,
  };
 }
 return {...rail,sample,sampleExit};
}
