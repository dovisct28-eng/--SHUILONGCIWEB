import { createA04Controller } from '../a04/controller.mjs';
import { derivePresentation, deriveScrollState } from './progress.mjs';
import { CORE_MURALS, deriveA02State } from '../a02/progress.mjs';
import { deriveA03State } from '../a03/progress.mjs';
import { createA03View } from '../a03/view.mjs';
import { createMuralGuide } from '../guide/controller.mjs';
import { a05Guide } from '../a05/content.mjs';
import { a06Guide } from '../a06/content.mjs';
import { a07Guide } from '../a07/content.mjs';
import { createA08Controller } from '../a08/controller.mjs';

const story = document.querySelector('[data-story]');
const stage = document.querySelector('[data-stage]');
const modelFrame = document.querySelector('[data-model-frame]');
const debug = document.querySelector('[data-debug]');
const debugEnabled = new URLSearchParams(location.search).has('debug');
let framePending = false;
let modelProgress = -1;
let lastScreens = 0;
const a02 = document.querySelector('[data-a02]');
const a02Description = document.querySelector('[data-a02-description]');
const a02Status = document.querySelector('[data-a02-status]');
const a02Hint = document.querySelector('[data-a02-hint]');
story.style.height = `4300vh`;
const renderA04 = createA04Controller(stage, modelFrame, requestRender);
const renderA05 = createMuralGuide(stage, a05Guide, requestRender);
const renderA06 = createMuralGuide(stage, a06Guide, requestRender);
const renderA07 = createMuralGuide(stage, a07Guide, requestRender);
const renderA08 = createA08Controller(stage);
const renderA03 = createA03View(stage);
const a03Styles = document.createElement('link');
a03Styles.rel = 'stylesheet';
a03Styles.href = new URL('../a03/styles.css', import.meta.url).href;
document.head.append(a03Styles);
document.title = '水龙祠｜A01–A08 空间与壁画叙事';

debug.hidden = !debugEnabled;

const smooth = value => value * value * (3 - 2 * value);
const mix = (from, to, value) => from + (to - from) * smooth(value);

function setModelProgress(progress) {
  if (Math.abs(progress - modelProgress) < 0.0005) return;
  const api = modelFrame.contentWindow?.shuilongTemple;
  if (!api?.setIntroProgress) return;
  api.setIntroProgress(progress);
  modelProgress = progress;
}

function render() {
  framePending = false;
  const bounds = story.getBoundingClientRect();
  const state = deriveScrollState(Math.max(0, -bounds.top), innerHeight);
  const spatial = deriveA02State(Math.max(0, -bounds.top), innerHeight);
  const theme = deriveA03State(Math.max(0, -bounds.top), innerHeight);
  renderA03(theme);
  const travel = smooth(state.travel);
  const shift = smooth(state.shift);
  const copy = smooth(state.copy);
  const transition = smooth(state.transition);
  const presentation = derivePresentation({
    ...state,
    shift,
    copy,
    transition,
    travel,
  }, innerWidth);

  stage.style.setProperty('--travel', travel);
  stage.style.setProperty('--model-opacity', Math.min(1, Math.max(0, (state.animation - 0.14) / 0.1)));
  const narrow = innerWidth <= 760;
  stage.style.setProperty('--model-x', `${presentation.modelX + (narrow ? 0 : 19) * theme.composition}vw`);
  stage.style.setProperty('--model-scale', mix(0.72, 0.83, state.growth) - (narrow ? .35 : .17) * theme.composition);
  modelFrame.parentElement.style.top = `${(narrow ? 43 : 50) + (narrow ? 35 : 0) * theme.composition}%`;
  stage.style.setProperty('--copy-opacity', presentation.copyVisibility);
  stage.style.setProperty('--copy-x', `${mix(-34, 0, copy)}px`);
  stage.style.setProperty('--intro-mark-opacity', presentation.introMarkVisibility);
  stage.style.setProperty('--hint-opacity', presentation.hintVisibility);
  stage.style.setProperty('--a02-opacity', smooth(spatial.heading) * (1 - theme.takeover));
  a02.setAttribute('aria-hidden', String(spatial.heading === 0 || theme.takeover === 1));
  const focused = spatial.emphasis > .5;
  a02Description.textContent = focused ? '第一幅、第二幅、第五幅，是后续观看的核心位置。' : spatial.markers > 0 ? '五幅壁画，分布于不同的建筑壁面。' : '先认识建筑，再看五幅壁画的位置。';
  a02Status.textContent = focused ? '核心三幅 · 共同强调' : spatial.markers > 0 ? '五幅位置 · 总览' : '建筑空间';
  a02Hint.textContent = spatial.phase === 'a02-reading' ? '继续向下，了解出兵·入将' : '向下滚动，查看壁画位置';
  const phase = theme.phase !== 'a02' ? theme.phase : spatial.phase === 'a01' ? state.phase : spatial.phase;
  stage.dataset.phase = phase;
  document.body.dataset.phase = phase;
  document.body.dataset.a02Progress = spatial.progress.toFixed(4);
  document.body.dataset.a03Progress = theme.progress.toFixed(4);
  document.body.dataset.animationProgress = state.animation.toFixed(4);
  document.body.dataset.modelProgress = state.growth.toFixed(4);
  document.body.dataset.readingProgress = state.reading.toFixed(4);
  document.body.dataset.transitionProgress = state.transition.toFixed(4);
  setModelProgress(state.growth);
  modelFrame.contentWindow?.shuilongTemple?.setMuralPresentation({
    visibility: smooth(spatial.markers), emphasis: smooth(spatial.emphasis), coreIds: CORE_MURALS,
    revealWalls: smooth(spatial.revealWalls),
    secondaryVisibility: theme.secondary,
  });
  const screens = Math.max(0, -bounds.top) / innerHeight;
  lastScreens = screens;
  renderA04(screens);
  renderA05(screens);
  renderA06(screens);
  renderA07(screens);
  renderA08(screens);
  if (debugEnabled) {
    debug.textContent = `${phase} · A01 ${(state.animation * 100).toFixed(1)}% · A02 ${(spatial.progress * 100).toFixed(1)}% · A03 ${(theme.progress * 100).toFixed(1)}%`;
  }
}

function requestRender() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(render);
}

addEventListener('scroll', requestRender, { passive: true });
addEventListener('resize', () => {
  scrollTo(0,lastScreens*innerHeight);
  requestRender();
});
modelFrame.addEventListener('load', () => { modelProgress = -1; requestRender(); });
addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== modelFrame.contentWindow || event.data?.type !== 'shuilong:ready') return;
  modelProgress = -1;
  requestRender();
});
requestRender();
