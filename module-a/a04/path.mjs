export const clamp = n => Math.max(0, Math.min(1, n));
export const smooth = n => { const t = clamp(n); return t*t*(3-2*t); };
export const mixVector = (a,b,t) => t<=0?[...a]:t>=1?[...b]:a.map((v,i)=>v+(b[i]-v)*t);
export const mixCamera = (a,b,t) => ({position:mixVector(a.position,b.position,t),target:mixVector(a.target,b.target,t)});
// Model coordinates, not surveyed dimensions. Walking points are separate from wall centres.
export const walls = {'mural-05':[-4.515,1.85,-11.75],'mural-01':[4.865,1.55,4.8],'mural-02':[4.515,1.85,-11.75]};
export const route = [
  [[-2.7,.56,-11.75]],
  [[-2.7,.56,-11.75],[-2.7,.56,-8.05],[-2.7,.13,-7.4],[-2.7,.13,4.8],[2.7,.13,4.8],[3.8,.36,4.8]],
  [[3.8,.36,4.8],[2.7,.13,4.8],[2.7,.13,-7.4],[2.7,.56,-8.05],[2.7,.56,-11.75]],
];
export const cameras = {
  departure:{position:[-2.7,3.8,-11.75],target:[-2.7,2,4.8]},
  fifth:{position:[1.2,5.8,-11.75],target:walls['mural-05']},
  forward:{position:[-2.7,3.8,-10],target:[-2.7,2,5]},
  turn:{position:[-2.7,3.8,4.8],target:[3.8,1.55,4.8]},
  first:{position:[-1.2,2.3,4.8],target:walls['mural-01']},
  returnTurn:{position:[2.7,3.8,4.8],target:[2.7,2,-11.75]},
  second:{position:[-1.2,5.8,-11.75],target:walls['mural-02']},
  lift:{position:[1,12,-10],target:[0,0,-3]},
  fifthApproach:{position:[1.2,9,-8],target:walls['mural-05']},
  fifthClose:{position:[-1.5,5.2,-10.5],target:walls['mural-05']},
};
export const duration = 58;
// Each arrival includes a stationary interval. Elevated interpretation avoids roof/beam intersections.
export function sampleTour(seconds, overview) {
  const keys = [[0,overview],[4,cameras.departure],[5,cameras.departure],[8,cameras.fifth],[11,cameras.fifth],
    [13,cameras.forward],[19,{position:cameras.turn.position,target:[-2.7,2,8]}],[21,cameras.turn],
    [23,cameras.first],[26,cameras.first],[28,cameras.returnTurn],[34,{position:cameras.second.position,target:[2.7,2,-14]}],
    [36,cameras.second],[39,cameras.second],[42,cameras.lift],[45,overview],[58,overview]];
  const t=Math.max(0,Math.min(duration,seconds));
  const index=keys.findIndex(([time])=>time>=t);
  const [end,b]=keys[Math.max(0,index)], [start,a]=keys[Math.max(0,index-1)];
  const camera=mixCamera(a,b,end===start?1:smooth((t-start)/(end-start)));
  const phase=t<13?0:t<28?1:t<40?2:t<45?3:4;
  const growth=t<46?[0,0,0]:[1,clamp((t-48)/4),clamp((t-54)/4)];
  return {camera,phase,growth,target:phase===0||(phase===4&&t<48)?'mural-05':phase===1||(phase===4&&t<54)?'mural-01':'mural-02'};
}
export function chapter(screens) {
  return {active:screens>13.202,entry:smooth((screens-13.2)/.8),guideStart:smooth((screens-16)/2),stable:screens>=14};
}
export function handoff(screens, overview) {
  const approach=smooth(screens-16),close=smooth(screens-17);
  return {camera:screens<=17?mixCamera(overview,cameras.fifthApproach,approach):mixCamera(cameras.fifthApproach,cameras.fifthClose,close),
    routeOpacity:1-.72*smooth((screens-16)/1.7),secondaryOpacity:1-.8*smooth((screens-16)/1.5),
    modelOpacity:1-smooth((screens-17.65)/.35)};
}
