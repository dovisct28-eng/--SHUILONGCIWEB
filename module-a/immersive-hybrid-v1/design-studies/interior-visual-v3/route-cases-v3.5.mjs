import {createRearRail,REAR_DOCKS} from './route-v3.3.mjs';
import {FIFTH_DOCK} from './route-v3.4.mjs';

// Comparison proposals, not a resolution of the historical/site discrepancy.
export const ROUTE_CASES=Object.freeze({
 model:{id:'model',label:'A · 现有模型',summary:'③盘龙在右 → ④麒麟在左 → ⑤左侧墙',modelFallback:false},
 report:{id:'report',label:'B · 报告对照',summary:'③盘龙在左 → ④麒麟在右 → 回到⑤左侧墙',modelFallback:true},
});
export const routeCase=id=>ROUTE_CASES[id]??ROUTE_CASES.model;
export function applyRouteCase(murals,id){
 const result=structuredClone(murals);if(id!=='report')return result;
 for(const [index,x,side]of[[2,-2.25,'左'],[3,2.25,'右']]){
  result[index].position[0]=x;result[index].wall=`主殿正面${side}侧 · 方案B`;
  result[index].camera={id:`report-${index+1}`,position:[x,1.85,-10.6],target:[x,1.85,-14.865],fov:48};
  result[index].wallStatus='comparison-proposal-awaiting-advisor';
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
