// Display state for one temple world. All values are art-direction candidates.
// Geometry, mural anchors and the A04 route are deliberately outside this module.
const unit=n=>Math.max(0,Math.min(1,Number(n)||0));
const ease=n=>{const t=unit(n);return t*t*(3-2*t);};
export function deriveSharedWorldState(screens=0,tour=null){
  const room=ease((screens-6.2)/1),poster=ease((screens-10.2)/.75);
  const exit=ease((screens-12.65)/.55),route=Boolean(tour)||screens>=13.2;
  const environment=route?0:(1-.38*room-.18*poster)*(1-exit);
  return {chapter:route?'A04':screens>10.2?'A03':screens>6.2?'A02':'A01',
    environment,foreground:environment*(1-.5*room),vegetation:environment,
    mountains:route?0:(1-.42*room-.06*poster)*(1-exit),
    fog:environment*(1-.55*room),room:room*(1-.35*poster),
    posterClearance:poster*(1-exit),routeSpace:route?1:exit,
    architecture:1,cutaway:ease((screens-10.75)/.55),visible:environment>.04};
}
// DOM coordinates are converted into the actual iframe viewport, top-down.
// Values outside [0,1] are useful for partially cropped poster text.
export function normalizeTitleRects(rects,frame){
  if(!frame||frame.width<=0||frame.height<=0)return [];
  return rects.slice(0,2).map(r=>({left:(r.left-frame.left)/frame.width,
    top:(r.top-frame.top)/frame.height,right:(r.right-frame.left)/frame.width,
    bottom:(r.bottom-frame.top)/frame.height}));
}
