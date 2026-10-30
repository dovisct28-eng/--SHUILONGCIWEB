import {WAYPOINTS,segmentHits} from './route-data.mjs';
export const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const ease=t=>t*t*t*(10+t*(-15+6*t));
const distance=(a,b)=>Math.hypot(...a.map((x,i)=>x-b[i]));
// Clamped cardinal tangents round the corridor corner without moving its walls.
function cubic(points,i,t,key){
 const a=points[i][key],b=points[i+1][key],p=points[Math.max(0,i-1)][key],q=points[Math.min(points.length-1,i+2)][key];
 return a.map((x,k)=>{const m=.32*(b[k]-p[k]),n=.32*(q[k]-x),t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*x+(t3-2*t2+t)*m+(-2*t3+3*t2)*b[k]+(t3-t2)*n;});
}
export function createRail(start){
 const points=[start,...WAYPOINTS.slice(0,6),{...WAYPOINTS[6],position:[-.65,1.85,-11.75]}],table=[{distance:0,i:0,t:0}],steps=100;
 let length=0,previous=start.position;
 for(let i=0;i<points.length-1;i++)for(let n=1;n<=steps;n++){const t=n/steps,p=cubic(points,i,t,'position');length+=distance(p,previous);previous=p;table.push({distance:length,i,t});}
 function sample(progress){
  const u=Math.max(0,Math.min(1,progress)),d=u*length;
  let lo=0,hi=table.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(table[mid].distance<d)lo=mid+1;else hi=mid;}
  const b=table[lo],a=table[Math.max(0,lo-1)],f=(d-a.distance)/(b.distance-a.distance||1),i=b.i,t=a.i===i?a.t+(b.t-a.t)*f:b.t*f;
  const position=cubic(points,i,t,'position'),target=cubic(points,i,t,'target');
  return {position,target,fov:48,time:3,route12:u};
 }
 return {length,sample,points,validate(runtime){const hits=[];let a=sample(0);for(let i=1;i<=700;i++){const b=sample(i/700),h=segmentHits(runtime,a.position,b.position,.18);if(h.length)hits.push({progress:i/700,hits:h});a=b;}return hits;}};
}
export const REFERENCE_STOPS=[
 {name:'leave-first',progress:.10},
 {name:'east-corridor',progress:.36},
 {name:'hall-corner',progress:.65},
 {name:'turn-second',progress:.86},
 {name:'second-dock',progress:1}
];
export function routeWeights(progress){
 const p=Math.max(0,Math.min(1,progress)),weights=REFERENCE_STOPS.map(()=>0);
 let i=0;while(i<REFERENCE_STOPS.length-2&&p>REFERENCE_STOPS[i+1].progress)i++;
 const u=smooth(REFERENCE_STOPS[i].progress,REFERENCE_STOPS[i+1].progress,p);weights[i]=1-u;weights[i+1]=u;
 return {weights,gain:smooth(0,.12,p)};
}
