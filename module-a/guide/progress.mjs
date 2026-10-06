export const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

// Distances are viewport heights measured from the existing A01 story origin.
export function guideProgress(screens, start, end, introLength = 3.2) {
  const introEnd = start + introLength;
  return {
    active: screens >= start && screens < end,
    visible: screens >= start && screens < end + 0.4,
    opacity: screens < start ? 0 : screens < start + 0.4 ? smooth((screens - start) / 0.4) : screens < end ? 1 : 1 - smooth((screens - end) / 0.4),
    entry: smooth((screens - start) / 0.8),
    introduction: 1 - smooth((screens - (introEnd - 0.55)) / 0.15),
    introProgress: clamp((screens - start - 0.55) / (introLength - 1.1)),
    galleryExpand: smooth((screens - (introEnd - 0.4)) / 0.4),
    scan: smooth((screens - introEnd) / (end - 0.6 - introEnd)),
    handoff: smooth((screens - (end - 0.6)) / 0.6),
  };
}

// Reading layers use the story scroll position, including on reverse/reload.
// At least one layer remains legible during each short crossfade.
export function introReading(progress, count) {
  const weights = Array.isArray(count) ? count : Array(count).fill(1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const position = clamp(progress) * total;
  let boundary = 0;
  return weights.map((weight, index) => {
    const from = boundary;
    boundary += weight;
    const fade = Math.min(...weights) * 0.12;
    const enter = index === 0 ? 1 : smooth((position - from + fade) / (fade * 2));
    const leave = index === weights.length - 1 ? 1 : 1 - smooth((position - boundary + fade) / (fade * 2));
    return {opacity: enter * leave, y: (1 - enter) * 10 - (1 - leave) * 10};
  });
}

// One geometry contract for CSS type placement, complete INTRO, and projection.
// Width wins for these very wide originals; 60vh is a ceiling, never a crop.
export function introGeometry(width, height, ratio) {
  const narrow = width <= 760;
  const gutter = narrow ? width * .05 : Math.min(52, Math.max(40, width / 30));
  const editorialTop = height <= 700 ? 26 : height <= 800 ? 32 : 48;
  const editorialHeight = narrow ? 330 : 216;
  const areaTop = editorialTop + editorialHeight + 24;
  const areaBottom = height - 84;
  const imageHeight = Math.min((width - 2 * gutter) / ratio, height * .6, Math.max(80, areaBottom - areaTop));
  return {left: (width - imageHeight * ratio) / 2, top: areaTop + Math.max(0, (areaBottom - areaTop - imageHeight) / 2),
    width: imageHeight * ratio, height: imageHeight, editorialTop, editorialHeight};
}

const mix = (from, to, t) => from + (to - from) * t;
export function galleryGeometry(width, height, ratio, state, reduced = false) {
  const intro = introGeometry(width, height, ratio);
  const scanHeight = guideHeight(width, height, reduced), scanWidth = scanHeight * ratio;
  const placement = horizontalPlacement(scanWidth, width, state.scan);
  const expand = state.galleryExpand;
  return {left: mix(intro.left, placement.x, expand), top: mix(intro.top, (height - scanHeight) / 2, expand),
    width: mix(intro.width, scanWidth, expand), height: mix(intro.height, scanHeight, expand), travel: placement.travel};
}

// Recompose the SAME image only after the complete left endpoint is reached.
// With mural-02's 4.42:1 ratio, 70vw implies ~25vh at 1440x900, not 74vh.
export function explorationGeometry(width, height, ratio, screens, reduced = false) {
  const scanHeight = guideHeight(width, height, reduced);
  const targetWidth = width * (width <= 760 ? .94 : .70);
  const progress = smooth((screens - 40) / .65);
  const imageHeight = mix(scanHeight, targetWidth / ratio, progress);
  return {left: 0, top: (height - imageHeight) / 2, width: imageHeight * ratio, height: imageHeight, progress};
}

export function ambientProgress(screens) {
  const weight = 1 - .2 * smooth((screens - 25) / .4) - .15 * smooth((screens - 32) / .4);
  return {visible: screens > 17.72 && screens <= 42.1, opacity: smooth((screens - 17.72) / .28), weight};
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
  const target = typeof formalHeight === 'number'
    ? {left:viewportWidth-formalHeight*ratio, top:(viewportHeight-formalHeight)/2, width:formalHeight*ratio, height:formalHeight}
    : formalHeight;
  const {width, left, top, height} = target;
  const bounds=projection||{left:viewportWidth*.38,top:viewportHeight*.42,width:viewportWidth*.24,height:viewportHeight*.16};
  const fromWidth=Math.min(bounds.width,bounds.height*ratio),fromHeight=fromWidth/ratio;
  const from={left:bounds.left+(bounds.width-fromWidth)/2,top:bounds.top+(bounds.height-fromHeight)/2,width:fromWidth,height:fromHeight};
  const lerp=(a,b)=>a+(b-a)*t;
  return {left:lerp(from.left,left),top:lerp(from.top,top),
    width:lerp(from.width,width),height:lerp(from.height,height),
    imageOpacity:smooth((screens-(start-.6))/.25),backgroundOpacity:smooth((screens-(start-.28))/.28),
    corners:projection?.quad?.map((p,i)=>{const corner=[{x:left,y:top},{x:left+width,y:top},{x:left+width,y:top+height},{x:left,y:top+height}][i];return {x:lerp(p.x,corner.x),y:lerp(p.y,corner.y)};})};
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
