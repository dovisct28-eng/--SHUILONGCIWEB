export const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Distances are viewport heights measured from the existing A01 story origin.
export function guideProgress(screens, start, end) {
  return {
    active: screens >= start,
    entry: smooth((screens - start) / 0.8),
    introduction: 1 - smooth((screens - (start + 1.7)) / 0.6),
    scan: screens >= end - 0.6 ? 1 : clamp((screens - (start + 2.2)) / (end - start - 2.8)),
    handoff: smooth((screens - (end - 0.6)) / 0.6),
  };
}

// At progress 0 the image's right edge meets the viewport's right edge.
// At progress 1 its left edge meets the viewport's left edge.
export function horizontalPlacement(imageWidth, viewportWidth, progress) {
  const travel = Math.max(0, imageWidth - viewportWidth);
  return {travel, x: travel ? progress >= 1 ? 0 : -travel * (1 - clamp(progress)) : (viewportWidth - imageWidth) / 2};
}
export function muralTransfer(screens, projection, viewportWidth, viewportHeight, ratio, formalHeight, start=18) {
  const t=smooth((screens-(start-.35))/.35);
  const width=formalHeight*ratio, left=viewportWidth-width;
  const from=projection||{left:viewportWidth*.38,top:viewportHeight*.42,width:viewportWidth*.24,height:viewportHeight*.16};
  const lerp=(a,b)=>a+(b-a)*t;
  return {left:lerp(from.left,left),top:lerp(from.top,(viewportHeight-formalHeight)/2),
    width:lerp(from.width,width),height:lerp(from.height,formalHeight),
    imageOpacity:smooth((screens-(start-.6))/.25),backgroundOpacity:smooth((screens-(start-.28))/.28)};
}
