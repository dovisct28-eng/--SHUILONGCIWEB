import {SEGMENTS, deriveScrollState} from '../a01/progress.mjs';
import {A02_START, A02_SCREENS} from '../a02/progress.mjs';
import {architecturalRoom} from '../a02/spatial.mjs';
import {A03_START, A03_SCREENS, deriveA03State} from '../a03/progress.mjs';
import {a05Guide} from '../a05/content.mjs';
import {guideProgress} from '../guide/progress.mjs';

// Resolve reading frames against the actual chapter functions, in screen units.
// No navigation timeline: the main renderer remains the only story clock.
function firstStable(from, to, predicate) {
  for (let i = 0; i <= Math.round((to - from) * 100); i++) {
    const screen = Number((from + i / 100).toFixed(2));
    if (predicate(screen)) return screen;
  }
  throw new Error('No stable narrative anchor');
}
export const ANCHORS = Object.freeze({
  hero: SEGMENTS.animationScreens + SEGMENTS.readingScreens / 2,
  space: firstStable(A02_START, A02_START + A02_SCREENS, screen => {
    const room = architecturalRoom(screen);
    return deriveScrollState(screen, 1).transition === 1 && room.arrival === 1 && room.heading === 1;
  }),
  theme: firstStable(A03_START, A03_START + A03_SCREENS, screen => {
    const theme = deriveA03State(screen, 1);
    return theme.text === 1 && theme.composition === 1 && theme.purpose === 1;
  }),
  guide: firstStable(a05Guide.start, a05Guide.end, screen => {
    const guide = guideProgress(screen, a05Guide.start, a05Guide.end, a05Guide.introLength);
    return guide.opacity === 1 && guide.entry === 1 && guide.galleryExpand === 0;
  }),
});

export const STAGES = Object.freeze(['建筑空间', '主题', '观看路径', '图像导读']);
// Consume the phase already selected by the chapter controllers, not a second
// set of chapter thresholds. A02 appearance additionally waits for readable UI.
export function navigationState({phase, room, transition}) {
  const chapter = /^a0([2-8])(?:-|$)/.exec(phase)?.[1];
  const visible = Boolean(chapter) && transition === 1 && room.heading === 1;
  const stage = !visible ? -1 : chapter === '2' ? 0 : chapter === '3' ? 1 : chapter === '4' ? 2 : 3;
  const scan = /a0[5-7]-(?:scan|handoff|expanding)/.test(phase);
  const layout = chapter === '4' ? 'route' : chapter === '8' ? 'terminal' : ['5','6','7'].includes(chapter) ? scan ? 'scan' : 'guide' : 'default';
  return {visible, stage, layout, quiet: scan, brandVisible: visible && !scan, label: chapter === '8' ? '图像导读结束，可进入探索' : STAGES[stage] || ''};
}
