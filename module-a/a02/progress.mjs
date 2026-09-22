import { SEGMENTS, rangeProgress } from '../a01/progress.mjs';

// Includes the existing one-screen A01 return to center.
export const A02_SCREENS = 4;
export const A02_START = SEGMENTS.animationScreens + SEGMENTS.readingScreens;
export const CORE_MURALS = Object.freeze(['mural-01', 'mural-02', 'mural-05']);

export function deriveA02State(localScroll, viewportHeight) {
  const screens = localScroll / Math.max(1, viewportHeight) - A02_START;
  return Object.freeze({
    progress: rangeProgress(screens, 0, A02_SCREENS),
    heading: rangeProgress(screens, .65, 1.15),
    revealWalls: rangeProgress(screens, 1.15, 1.65),
    markers: rangeProgress(screens, 1.7, 2.25),
    emphasis: rangeProgress(screens, 2.8, 3.3),
    phase: screens <= 0 ? 'a01' : screens < 1 ? 'a02-transition' : screens < 1.7 ? 'a02-space' : screens < 2.8 ? 'a02-overview' : screens < 3.3 ? 'a02-focus' : 'a02-reading',
  });
}
