// Design-model units, never survey measurements. Separate position and gaze
// curves keep the eye level below the original central lintel (y=1.615).
export const ENTRY_STOPS = Object.freeze([
  {id:'overview',label:'建筑总览',time:0},
  {id:'approach',label:'接近大门',time:.52},
  {id:'gate-close',label:'大门近景',time:.78},
  {id:'threshold',label:'穿过门洞',time:.92},
  {id:'gate-interior',label:'门内停靠',time:1},
]);
export const ENTRY_DURATION = 10800;
export const PATH_KEYS = [
  {t:0,position:[-23.33250595253667,19.342753798798213,-26.88031350693665],target:[0,-1.25,-1.75],fov:32},
  {t:.18,position:[-34,17,-5],target:[0,.1,-1],fov:34},
  {t:.34,position:[-24,10,24],target:[0,1.25,8],fov:38},
  {t:.44,position:[-7,4.5,29],target:[0,1.3,11.7],fov:43},
  {t:.52,position:[-.35,2.2,24],target:[0,1.32,11.8],fov:46},
  {t:.65,position:[0,1.38,18],target:[0,1.36,10.5],fov:48},
  {t:.78,position:[0,1.38,14.1],target:[0,1.38,9.8],fov:48},
  {t:.85,position:[0,1.38,12.85],target:[0,1.38,9.6],fov:48},
  {t:.92,position:[0,1.38,12.25],target:[.12,1.38,9.7],fov:48},
  {t:1,position:[.12,1.38,11.15],target:[1.2,1.38,9.2],fov:48},
];
const clamp=t=>Math.max(0,Math.min(1,t));
// Nonuniform cubic Hermite: continuous first derivatives, with zero endpoint
// velocity. One global rail is sampled both ways; no per-node position resets.
export function sampleEntry(time,keys=PATH_KEYS){
  const t=clamp(time);let i=0;while(i<keys.length-2&&t>keys[i+1].t)i++;
  const a=keys[i],b=keys[i+1],dt=b.t-a.t,u=(t-a.t)/dt;
  const tangent=(index,field,c)=>{
    if(index===0||index===keys.length-1)return 0;
    const before=keys[index-1],after=keys[index+1];
    return (after[field][c]-before[field][c])/(after.t-before.t);
  };
  const curve=field=>a[field].map((v,c)=>
    (2*u**3-3*u**2+1)*v+(u**3-2*u**2+u)*dt*tangent(i,field,c)
    +(-2*u**3+3*u**2)*b[field][c]+(u**3-u**2)*dt*tangent(i+1,field,c));
  const s=u*u*(3-2*u);
  return {time:t,position:curve('position'),target:curve('target'),fov:a.fov+(b.fov-a.fov)*s};
}
export function createEntryController(onChange){
  let state='overview',busy=false;
  return {get state(){return state;},get busy(){return busy;},async go(next){
    if(busy||state===next||!ENTRY_STOPS.some(s=>s.id===next))return false;
    const previous=state;busy=true;
    try{await onChange(next,previous);state=next;return true;}finally{busy=false;}
  },step(direction){const i=ENTRY_STOPS.findIndex(s=>s.id===state);return this.go(ENTRY_STOPS[Math.max(0,Math.min(ENTRY_STOPS.length-1,i+Math.sign(direction)))].id);}};
}
