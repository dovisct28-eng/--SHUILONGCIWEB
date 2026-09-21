import { derivePresentation, deriveScrollState } from './progress.mjs';

const story = document.querySelector('[data-story]');
const stage = document.querySelector('[data-stage]');
const modelFrame = document.querySelector('[data-model-frame]');
const debug = document.querySelector('[data-debug]');
const debugEnabled = new URLSearchParams(location.search).has('debug');
let framePending = false;
let modelProgress = -1;

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
  stage.style.setProperty('--model-x', `${presentation.modelX}vw`);
  stage.style.setProperty('--model-scale', mix(0.72, 0.83, state.growth));
  stage.style.setProperty('--copy-opacity', presentation.copyVisibility);
  stage.style.setProperty('--copy-x', `${mix(-34, 0, copy)}px`);
  stage.style.setProperty('--intro-mark-opacity', presentation.introMarkVisibility);
  stage.style.setProperty('--hint-opacity', presentation.hintVisibility);
  stage.style.setProperty('--a02-opacity', transition);
  stage.dataset.phase = state.phase;
  document.body.dataset.phase = state.phase;
  document.body.dataset.animationProgress = state.animation.toFixed(4);
  document.body.dataset.modelProgress = state.growth.toFixed(4);
  document.body.dataset.readingProgress = state.reading.toFixed(4);
  document.body.dataset.transitionProgress = state.transition.toFixed(4);
  setModelProgress(state.growth);
  if (debugEnabled) {
    debug.textContent = `${state.phase} · 动画 ${(state.animation * 100).toFixed(1)}% · 模型 ${(state.growth * 100).toFixed(1)}% · 阅读 ${(state.reading * 100).toFixed(1)}%`;
  }
}

function requestRender() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(render);
}

addEventListener('scroll', requestRender, { passive: true });
addEventListener('resize', requestRender);
modelFrame.addEventListener('load', () => { modelProgress = -1; requestRender(); });
addEventListener('message', event => {
  if (event.source !== modelFrame.contentWindow || event.data?.type !== 'shuilong:ready') return;
  modelProgress = -1;
  requestRender();
});
requestRender();
