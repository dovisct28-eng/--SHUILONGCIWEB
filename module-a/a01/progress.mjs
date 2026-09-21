export const SEGMENTS = Object.freeze({
  travelEnd: 0.2,
  growthEnd: 0.65,
  shiftEnd: 0.82,
  animationScreens: 5,
  readingScreens: 1.2,
  transitionScreens: 1,
});

export function clamp01(value) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function rangeProgress(value, start, end) {
  if (end <= start) throw new RangeError('end must be greater than start');
  return clamp01((value - start) / (end - start));
}

export function deriveScrollState(localScroll, viewportHeight) {
  const vh = Math.max(1, viewportHeight);
  const animationDistance = SEGMENTS.animationScreens * vh;
  const readingDistance = SEGMENTS.readingScreens * vh;
  const transitionDistance = SEGMENTS.transitionScreens * vh;
  const animation = clamp01(localScroll / animationDistance);
  const reading = rangeProgress(localScroll, animationDistance, animationDistance + readingDistance);
  const transition = rangeProgress(localScroll, animationDistance + readingDistance, animationDistance + readingDistance + transitionDistance);

  return Object.freeze({
    animation,
    travel: rangeProgress(animation, 0, SEGMENTS.travelEnd),
    growth: rangeProgress(animation, SEGMENTS.travelEnd, SEGMENTS.growthEnd),
    shift: rangeProgress(animation, SEGMENTS.growthEnd, SEGMENTS.shiftEnd),
    copy: rangeProgress(animation, SEGMENTS.shiftEnd, 1),
    reading,
    transition,
    heroStable: animation >= 1 && transition === 0,
    phase: transition > 0 ? 'a02-transition' : animation >= 1 ? 'reading' : animation < SEGMENTS.travelEnd ? 'travel' : animation < SEGMENTS.growthEnd ? 'growth' : animation < SEGMENTS.shiftEnd ? 'shift' : 'copy',
  });
}

export function derivePresentation(state, viewportWidth) {
  const finalShift = viewportWidth < 900 ? 14 : viewportWidth < 1200 ? 16 : 18;
  const centeredForA02 = 1 - state.transition;

  return Object.freeze({
    modelX: finalShift * state.shift * centeredForA02,
    copyVisibility: state.copy * centeredForA02,
    introMarkVisibility: (1 - state.travel) * (1 - state.copy),
    hintVisibility: centeredForA02,
  });
}
