import { rangeProgress } from '../a01/progress.mjs';
import { A02_START, A02_SCREENS } from '../a02/progress.mjs';

export const A03_START = A02_START + A02_SCREENS;
export const A03_SCREENS = 3;
const smooth = value => value * value * (3 - 2 * value);

export function deriveA03State(localScroll, viewportHeight) {
  const screens = localScroll / Math.max(1, viewportHeight) - A03_START;
  const enter = smooth(rangeProgress(screens, .35, 1));
  const exit = smooth(rangeProgress(screens, 2.1, 2.65));
  const takeover = smooth(rangeProgress(screens, 0, .55));
  return Object.freeze({
    progress: rangeProgress(screens, 0, A03_SCREENS),
    takeover,
    text: enter * (1 - exit),
    composition: smooth(rangeProgress(screens, 0, 1)) * (1 - exit),
    secondary: 1 - takeover,
    handoff: smooth(rangeProgress(screens, 2.4, 2.85)),
    phase: screens <= 0 ? 'a02' : screens < 1 ? 'a03-enter' : screens <= 2.1 ? 'a03-reading' : 'a03-handoff',
  });
}
