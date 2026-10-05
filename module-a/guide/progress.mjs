export const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Distances are viewport heights measured from the existing A01 story origin.
export function guideProgress(screens, start, end) {
  const introEnd = start + 3.2;
  return {
    active: screens >= start && screens < end,
    visible: screens >= start && screens < end + 0.4,
    opacity: screens < start ? 0 : screens < start + 0.4 ? smooth((screens - start) / 0.4) : screens < end ? 1 : 1 - smooth((screens - end) / 0.4),
    entry: smooth((screens - start) / 0.8),
    introduction: 1 - smooth((screens - (introEnd - 0.25)) / 0.25),
    introProgress: clamp((screens - start - 0.55) / 2.4),
    scan: smooth((screens - introEnd) / (end - 0.6 - introEnd)),
    handoff: smooth((screens - (end - 0.6)) / 0.6),
  };
}

// Reading layers use the story scroll position, including on reverse/reload.
// At least one layer remains legible during each short crossfade.
export function introReading(progress, count) {
  const position = clamp(progress) * count;
  return Array.from({length: count}, (_, index) => {
    const enter = index === 0 ? 1 : smooth((position - index + 0.12) / 0.24);
    const leave = index === count - 1 ? 1 : 1 - smooth((position - index - 1 + 0.12) / 0.24);
    return {opacity: enter * leave, y: (1 - enter) * 10 - (1 - leave) * 10};
  });
}

export function guideHeight(viewportWidth, viewportHeight, reduced = false) {
  return viewportHeight * (reduced ? 0.82 : viewportWidth <= 1100 ? 0.86 : 0.88);
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
  const bounds=projection||{left:viewportWidth*.38,top:viewportHeight*.42,width:viewportWidth*.24,height:viewportHeight*.16};
  const fromWidth=Math.min(bounds.width,bounds.height*ratio),fromHeight=fromWidth/ratio;
  const from={left:bounds.left+(bounds.width-fromWidth)/2,top:bounds.top+(bounds.height-fromHeight)/2,width:fromWidth,height:fromHeight};
  const lerp=(a,b)=>a+(b-a)*t;
  return {left:lerp(from.left,left),top:lerp(from.top,(viewportHeight-formalHeight)/2),
    width:lerp(from.width,width),height:lerp(from.height,formalHeight),
    imageOpacity:smooth((screens-(start-.6))/.25),backgroundOpacity:smooth((screens-(start-.28))/.28),
    corners:projection?.quad?.map((p,i)=>{const target=[{x:left,y:(viewportHeight-formalHeight)/2},{x:left+width,y:(viewportHeight-formalHeight)/2},{x:left+width,y:(viewportHeight+formalHeight)/2},{x:left,y:(viewportHeight+formalHeight)/2}][i];return {x:lerp(p.x,target.x),y:lerp(p.y,target.y)};})};
}

export function mapMuralProjection(projection, frameRect, frameWidth, frameHeight, stageRect) {
  if (!projection || !(frameWidth > 0) || !(frameHeight > 0)) return null;
  const scaleX = frameRect.width / frameWidth, scaleY = frameRect.height / frameHeight;
  return {
    left: frameRect.left - stageRect.left + projection.left * scaleX,
    top: frameRect.top - stageRect.top + projection.top * scaleY,
    width: projection.width * scaleX,
    height: projection.height * scaleY,
    ...(projection.quad?{quad:projection.quad.map(p=>({x:frameRect.left-stageRect.left+p.x*scaleX,y:frameRect.top-stageRect.top+p.y*scaleY}))}:{}),
  };
}
