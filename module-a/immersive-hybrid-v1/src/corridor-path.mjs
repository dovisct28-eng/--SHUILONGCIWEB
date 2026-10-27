import {ENTRY_STOPS,PATH_KEYS,sampleEntry,ENTRY_DURATION} from './entry-path.mjs';

// Coordinates checked against the running GLB, not site measurements. Keep the
// complete V2.1 rail (including its zero-velocity interior dock) byte-for-byte.
export const CORRIDOR_DURATION=5000;
export const CORRIDOR_KEYS=[
 {t:0,position:[.12,1.38,11.15],target:[1.2,1.38,9.2],fov:48},
 {t:.22,position:[1.65,1.38,10.8],target:[3.35,1.38,8.25],fov:48},
 {t:.43,position:[3.42,1.38,10.5],target:[4.02,1.38,5.5],fov:48},
 {t:.60,position:[3.85,1.38,9.7],target:[4.05,1.38,3.4],fov:48},
 {t:.80,position:[3.85,1.38,8.4],target:[4.05,1.38,2.4],fov:48},
 {t:1,position:[3.85,1.38,7.65],target:[4.1,1.38,2],fov:48},
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
export function travelMs(a,b){
 const clock=t=>Math.min(1,t)*ENTRY_DURATION+Math.max(0,t-1)*CORRIDOR_DURATION;
 return Math.abs(clock(b)-clock(a));
}
export function createGalleryController(onChange){
 let state='overview',busy=false;
 return {get state(){return state;},get busy(){return busy;},async go(next){
  if(busy||next===state||!GALLERY_STOPS.some(s=>s.id===next))return false;
  busy=true;try{await onChange(next,state);state=next;return true;}finally{busy=false;}
 }};
}
