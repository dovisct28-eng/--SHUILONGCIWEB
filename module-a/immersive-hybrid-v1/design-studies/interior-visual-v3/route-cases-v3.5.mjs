import {createRearRail,REAR_DOCKS} from './route-v3.3.mjs';
import {FIFTH_DOCK} from './route-v3.4.mjs';

// Confirmed right-first route; old layout URLs resolve to the same route.
export const ROUTE_CASES=Object.freeze({model:{id:'model',label:'参观路线',summary:'③麒麟在右 → ④盘龙在左 → ⑤左侧墙',modelFallback:false}});
export const routeCase=()=>ROUTE_CASES.model;
export function applyRouteCase(murals){
 const result=structuredClone(murals);
 // Preserve photographs and provenance together, and retain the spatial stops.
 for(const key of ['image','source','registration','note','approvedDisplay']) [result[2][key],result[3][key]]=[result[3][key],result[2][key]];
 // Formal replacements use the confirmed stop numbering, independent of the old asset names.
 for (const mural of result.slice(2, 4)) {
  const display = mural.formalDisplay;
  if (!display) continue;
  Object.assign(mural, {
   image: display.image,
   source: display.source,
   registration: display.processing,
   note: display.note,
  });
 }
 return result;
}
const pose=(x,z,tx,tz)=>({position:[x,1.85,z],target:[tx,1.85,tz],fov:48});
export const REPORT_POINTS=[
 [REAR_DOCKS[0],pose(-.9,-11.1,-1.5,-13.2),pose(-1.65,-10.65,-2.25,-14.865),pose(-2.25,-10.6,-2.25,-14.865)],
 [pose(-2.25,-10.6,-2.25,-14.865),pose(-1,-10.45,-1,-14.865),pose(1,-10.45,1.6,-14.865),pose(2.25,-10.6,2.25,-14.865)],
 [pose(2.25,-10.6,2.25,-14.865),pose(1.65,-10.8,-.4,-14),pose(.95,-11.3,-4.515,-12.4),FIFTH_DOCK],
];
export function reportRails(){return REPORT_POINTS.map((points,i)=>createRearRail(i,points));}
export const returnMarker=id=>`mural-05:${routeCase(id).id}`;
export const returnMatchesCase=(marker,id)=>marker===returnMarker(id)||(marker==='mural-05'&&id==='model');
