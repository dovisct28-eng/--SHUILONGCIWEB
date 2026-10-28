export function cameraFor(view,metrics,{recenter=false}={}){
 const x=metrics.cameraCentreX;
 const views={
  aerial:{position:[25,26,31],target:[0,1,-1.75],fov:38,orthoHeight:28.5},
  front:{position:[0,2,38],target:[0,2,-2],fov:38,orthoHeight:12},
  interior:{position:[.12,1.38,11.15],target:[1.5,1.55,9.7],fov:48},
  'stage-front':{position:[0,1.8,.5],target:[0,1.9,8.4],fov:48},
  'stage-right':{position:[3.6,1.55,10.55],target:[3.9,1.5,5.6],fov:48},
  corridor:{position:[recenter?x:3.85,1.55,8.4],target:[recenter?x:3.85,1.55,-3.5],fov:48},
  discovery:{position:[recenter?x:3.55,1.55,7.65],target:[4.865,1.55,4.8],fov:48},
  'mural-front':{position:[recenter?metrics.floorInner+.125:3.3,1.55,4.8],target:[4.865,1.55,4.8],fov:48},
  'hall-front':{position:[0,2.6,-.8],target:[0,2.9,-11.75],fov:48},
  'hall-side':{position:[30,2.7,-11.75],target:[0,2.7,-11.75],fov:40,orthoHeight:9},
  top:{position:[0,60,-1.75],target:[0,0,-1.75],up:[0,0,-1],fov:45,orthoHeight:32},
  'left-corridor':{position:[-(recenter?x:3.85),1.55,8.4],target:[-(recenter?x:3.85),1.55,-3.5],fov:48}
 };
 if(!views[view])throw Error('Unknown view '+view);return structuredClone(views[view]);
}
// Piecewise quintic easing stays within each clear segment. Camera and gaze
// share one deterministic clock; forward and reverse use the same samples.
export function routeKeys(metrics){const x=metrics.cameraCentreX;return [
 {position:[0,1.38,18],target:[0,1.38,10.5],fov:48,label:'大门外'},
 {position:[0,1.38,12.6],target:[.1,1.38,9.9],fov:48,label:'穿过大门'},
 {position:[.12,1.38,11.15],target:[1.5,1.45,9.8],fov:48,label:'门内'},
 {position:[1.9,1.48,10.85],target:[x,1.55,8.2],fov:48,label:'绕过戏台后方'},
 {position:[x,1.55,10.55],target:[x,1.55,5],fov:48,label:'戏台右转'},
 {position:[x,1.55,8.4],target:[x,1.55,1],fov:48,label:'右廊行进'},
 {position:[x,1.55,7.65],target:[4.865,1.55,4.8],fov:48,label:'第一幅发现'},
 {position:[metrics.floorInner+.125,1.55,4.8],target:[4.865,1.55,4.8],fov:48,label:'第一幅正视停靠'}
];}
export function sampleRoute(t,metrics){const keys=routeKeys(metrics),p=Math.max(0,Math.min(1,t))*(keys.length-1),i=Math.min(keys.length-2,Math.floor(p)),u=p-i,e=u*u*u*(10+u*(-15+6*u)),a=keys[i],b=keys[i+1];return {position:a.position.map((v,j)=>v+(b.position[j]-v)*e),target:a.target.map((v,j)=>v+(b.target[j]-v)*e),fov:48,label:u<.5?a.label:b.label};}
