import {ENTRY_STOPS,PATH_KEYS,sampleEntry,ENTRY_DURATION} from './entry-path.mjs';

// Coordinates checked against the running GLB, not site measurements. Keep the
// exterior V2.1 rail. Recalibrate only the interior for Combined B.
export const CORRIDOR_DURATION=5000;
export const CORRIDOR_KEYS=[
 {t:0,position:[3.3,1.55,10.7],target:[3.906,1.55,5],fov:48},
 {t:.22,position:[3.6,1.55,10.65],target:[3.906,1.55,5],fov:48},
 {t:.43,position:[3.906,1.55,10.55],target:[3.906,1.55,5],fov:48},
 {t:.60,position:[3.906,1.55,9.7],target:[3.906,1.55,3.4],fov:48},
 {t:.80,position:[3.906,1.55,8.4],target:[3.906,1.55,2.4],fov:48},
 {t:1,position:[3.906,1.55,7.65],target:[3.906,1.55,2],fov:48},
];
export const GALLERY_STOPS=Object.freeze([...ENTRY_STOPS,
 {id:'stage-turn',label:'戏台右侧',time:1.43},
 {id:'corridor-3d',label:'右侧廊道',time:1.60},
 {id:'corridor-hybrid',label:'廊道行进',time:1.80},
 {id:'corridor-2_5d',label:'右廊停靠',time:2},
]);
export const FIRST_MURAL=Object.freeze({id:'mural-01',position:[4.865,1.55,4.8],rotationY:-Math.PI/2,width:3.65,height:1.2547});
const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export function corridorWeights(time,ready=true){
 const t=Math.max(0,Math.min(1,time-1));
 return {foreground:1,mid:ready?smooth(.60,.95,t):0,far:ready?smooth(.66,1,t):0};
}
export function corridorPhase(time){
 if(time<1)return 'entry-3d';if(time===1)return 'gate-interior';
 if(time<1.6)return 'stage-turn';if(time<=1.66)return 'corridor-3d';
 return time<1.95?'corridor-hybrid':'corridor-2_5d';
}
export function sampleGallery(time){
 const t=Math.max(0,Math.min(2,time));
 return {...(t<=1?sampleEntry(t,PATH_KEYS):sampleEntry(t-1,CORRIDOR_KEYS)),time:t};
}

function turnKey(t,position,yawDegrees){
 const yaw=yawDegrees*Math.PI/180;
 const [x,y,z]=position;
 return {t,position,target:[x+4*Math.sin(yaw),y,z-4*Math.cos(yaw)],fov:48};
}

// Use the checked positions around the stage, but pass through them on one
// curve. The first and last neighbor pairs match the original rail tangents.
const GUIDED_TURN_KEYS=[
 {t:.78,...sampleGallery(.78)},
 {t:.85,...sampleGallery(.85)},
 {t:.92,...sampleGallery(.92)},
 turnKey(.98,sampleGallery(.945).position,31),
 turnKey(1.08,sampleGallery(.97).position,51),
 turnKey(1.24,sampleGallery(1).position,23),
 turnKey(1.34,sampleGallery(1.22).position,8),
 {t:1.43,...sampleGallery(1.43)},
 {t:1.6,...sampleGallery(1.6)},
 {t:1.8,...sampleGallery(1.8)},
].map(key=>({...key,t:key.t/2}));

export function sampleGuidedGallery(time){
 if(time<=.85||time>=1.6)return sampleGallery(time);
 return {...sampleEntry(time/2,GUIDED_TURN_KEYS),time};
}

export function travelMs(a,b){
 // Add time only after the threshold; exterior approach timing stays intact.
 const clock=t=>Math.min(1,t)*ENTRY_DURATION+Math.max(0,Math.min(1,(t-.92)/.08))*1600+Math.max(0,t-1)*CORRIDOR_DURATION;
 return Math.abs(clock(b)-clock(a));
}
const BASE_TOUR_MS=travelMs(0,2);
const GATE_TURN_EXTRA_MS=2000;
export const GUIDED_TOUR_MS=BASE_TOUR_MS+GATE_TURN_EXTRA_MS;
export function guidedTourProgress(elapsed){
 // Spend the extra time near the doorway. Resume the usual clock before the right corridor.
 // A smooth ramp keeps the rate positive and joins the original clock at both ends.
 const added=GATE_TURN_EXTRA_MS*smooth(.40*BASE_TOUR_MS,.62*BASE_TOUR_MS+GATE_TURN_EXTRA_MS,elapsed);
 return 2*smooth(0,BASE_TOUR_MS,elapsed-added);
}

export function createGalleryController(onChange){
 let state='overview',busy=false;
 return {get state(){return state;},get busy(){return busy;},async go(next,options){
  if(busy||next===state||!GALLERY_STOPS.some(s=>s.id===next))return false;
  busy=true;try{await onChange(next,state,options);state=next;return true;}finally{busy=false;}
 }};
}
