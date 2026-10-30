import {segmentHits} from './route-data.mjs';
import {smooth} from './route-v3.2.mjs';

export const REAR_DOCKS=Object.freeze([
  {position:[-.65,1.85,-11.75],target:[4.515,1.85,-11.75],fov:48},
  {position:[2.25,1.85,-10.6],target:[2.25,1.85,-14.865],fov:48},
  {position:[-2.25,1.85,-10.6],target:[-2.25,1.85,-14.865],fov:48},
  {position:[-1.4,1.85,-11.75],target:[-4.515,1.85,-11.75],fov:48},
]);
const at=(position,target)=>({position,target,fov:48});
export const REAR_POINTS=[
 [REAR_DOCKS[0],at([-.15,1.85,-11.1],[4.1,1.85,-13]),at([.8,1.85,-10.65],[3.3,1.85,-14.4]),at([1.8,1.85,-10.6],[2.25,1.85,-14.865]),REAR_DOCKS[1]],
 [REAR_DOCKS[1],at([1,1.85,-10.45],[1,1.85,-14.865]),at([-1,1.85,-10.45],[-1.6,1.85,-14.865]),REAR_DOCKS[2]],
 [REAR_DOCKS[2],at([-1.9,1.85,-11.1],[-3.2,1.85,-14]),REAR_DOCKS[3]],
];
function cubic(points,i,t,key){const a=points[i][key],b=points[i+1][key],p=points[Math.max(0,i-1)][key],q=points[Math.min(points.length-1,i+2)][key];return a.map((x,k)=>{const m=.32*(b[k]-p[k]),n=.32*(q[k]-x),t2=t*t,t3=t2*t;return (2*t3-3*t2+1)*x+(t3-2*t2+t)*m+(-2*t3+3*t2)*b[k]+(t3-t2)*n;});}
export function createRearRail(segment,overridePoints){
 const points=Array.isArray(overridePoints)?overridePoints:REAR_POINTS[segment];if(!points)throw Error('Unknown rear route');
 const table=[{distance:0,i:0,t:0}];let length=0,previous=points[0].position;
 for(let i=0;i<points.length-1;i++)for(let j=1;j<=100;j++){const t=j/100,p=cubic(points,i,t,'position');length+=Math.hypot(...p.map((x,k)=>x-previous[k]));previous=p;table.push({distance:length,i,t});}
 function sample(progress){const u=Math.max(0,Math.min(1,progress)),d=u*length;let lo=0,hi=table.length-1;while(lo<hi){const m=(lo+hi)>>1;if(table[m].distance<d)lo=m+1;else hi=m;}const b=table[lo],a=table[Math.max(0,lo-1)],f=(d-a.distance)/(b.distance-a.distance||1),t=a.i===b.i?a.t+(b.t-a.t)*f:b.t*f;return {position:cubic(points,b.i,t,'position'),target:cubic(points,b.i,t,'target'),fov:48,time:3,...(segment<2?{route33:(segment+u)/2}:{}),rearSegment:segment,rearProgress:u};}
 return {length,points,sample,validate(runtime){const hits=[];let a=sample(0);for(let i=1;i<=400;i++){const b=sample(i/400),h=segmentHits(runtime,a.position,b.position,.18);if(h.length)hits.push({segment,progress:i/400,hits:h});a=b;}return hits;}};
}
export const REAR_REFERENCES=[{name:'turn-third',segment:0,progress:.42},{name:'third-dock',segment:0,progress:1},{name:'rear-crossing',segment:1,progress:.5},{name:'fourth-dock',segment:1,progress:1}];
export function rearWeights(progress){const knots=REAR_REFERENCES.map(r=>(r.segment+r.progress)/2),p=Math.max(0,Math.min(1,progress)),weights=knots.map(()=>0);let i=0;while(i<knots.length-2&&p>knots[i+1])i++;const u=smooth(knots[i],knots[i+1],p);weights[i]=1-u;weights[i+1]=u;return {weights,gain:smooth(0,.18,p)};}
