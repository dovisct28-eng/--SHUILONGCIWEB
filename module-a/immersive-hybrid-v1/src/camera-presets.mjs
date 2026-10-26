// Coordinates belong to the existing design model; these are not survey measurements.
export const PRESETS={
 R01:{file:'R01-overview.png',region:'建筑总览',position:[23,27,34],target:[0,0,-1.75],fov:42},
 R02:{file:'R02-gate-approach.png',region:'靠近大门',position:[4,6,21],target:[0,1.25,10.5],fov:48},
 R03:{file:'R03-gate-exterior.png',region:'大门外部',position:[1.0,1.65,20.8],target:[0,1.4,11.9],fov:48},
 R04:{file:'R04-gate-interior.png',region:'门内向右绕过戏台、院落方向',position:[1.95,1.65,10.65],target:[1,1.3,-4],fov:52},
 R05:{file:'R05-right-gallery.png',region:'右侧廊道',position:[3.9,1.65,8.5],target:[4.3,1.45,3.4],fov:52},
 R06:{file:'R06-first-mural-stop.png',region:'第一铺停靠',position:[0,1.75,6.9],target:[4.865,1.55,4.8],fov:50}
};
export const lerp=(a,b,t)=>t<=0?[...a]:t>=1?[...b]:a.map((n,i)=>n+(b[i]-n)*t);
export function interpolate(a,b,t){return {position:lerp(a.position,b.position,t),target:lerp(a.target,b.target,t),fov:a.fov+(b.fov-a.fov)*t};}
