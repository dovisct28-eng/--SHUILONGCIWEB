export const TOUR_DURATION=45;
export const LEGACY_DURATION=58;
export const storyTime=(seconds,length=TOUR_DURATION)=>Math.max(0,Math.min(45,seconds*45/length));
export function routeWeights(growth,index,current,completed=false){
  return {future:completed?0:.11,trace:completed?.8:index===current?.96:.29,current:!completed&&index===current};
}
