import { createA04Controller } from '../a04/controller.mjs';
import { derivePresentation, deriveScrollState } from './progress.mjs';
import { cinematicState, canvasFrame } from './cinematic-state.mjs';
import { CORE_MURALS, deriveA02State } from '../a02/progress.mjs';
import { deriveA03State } from '../a03/progress.mjs';
import { createA03View } from '../a03/view.mjs';
import { createMuralGuide } from '../guide/controller.mjs';
import { a05Guide } from '../a05/content.mjs';
import { a06Guide } from '../a06/content.mjs';
import { a07Guide } from '../a07/content.mjs';
import { createA08Controller } from '../a08/controller.mjs';
import { directorFrame } from '../visual-director/state.mjs';
import {architecturalRoom,roomFrame,createRoomField} from '../a02/spatial.mjs';

const story = document.querySelector('[data-story]');
const stage = document.querySelector('[data-stage]');
const modelFrame = document.querySelector('[data-model-frame]');
const debug = document.querySelector('[data-debug]');
const debugEnabled = new URLSearchParams(location.search).has('debug');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let framePending = false;
let modelProgress = -1;
let lastScreens = 0;
let narrativeFontsRequested=false;
const a02 = document.querySelector('[data-a02]');
const a02Description = document.querySelector('[data-a02-description]');
const a02Status = document.querySelector('[data-a02-status]');
const a02Hint = document.querySelector('[data-a02-hint]');
const roomField=createRoomField(stage);
const a02Pass=Number(new URLSearchParams(location.search).get('a02-pass')||5);
const roomStyles=document.createElement('link');roomStyles.rel='stylesheet';roomStyles.href=new URL('../a02/styles.css',import.meta.url).href;document.head.append(roomStyles);
story.style.height = `4300vh`;
const renderA04 = createA04Controller(stage, modelFrame, requestRender);
const renderA05 = createMuralGuide(stage, a05Guide, requestRender);
const renderA06 = createMuralGuide(stage, a06Guide, requestRender);
const renderA07 = createMuralGuide(stage, a07Guide, requestRender);
const renderA08 = createA08Controller(stage);
const renderA03 = createA03View(stage);
let renderInkScene=()=>{};
try{const ink=await import('./ink-scene.mjs');renderInkScene=ink.createInkScene(stage);}catch(error){stage.dataset.inkError=String(error);}
const a03Styles = document.createElement('link');
a03Styles.rel = 'stylesheet';
a03Styles.href = new URL('../a03/styles.css', import.meta.url).href;
document.head.append(a03Styles);
const directorStyles=document.createElement('link');directorStyles.rel='stylesheet';directorStyles.href=new URL('../visual-director/styles.css',import.meta.url).href;document.head.append(directorStyles);
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
  const screens = Math.max(0, -bounds.top) / innerHeight;
  if(screens>=6.8&&!narrativeFontsRequested){narrativeFontsRequested=true;const fonts=document.createElement('link');fonts.rel='stylesheet';fonts.href=new URL('../visual-director/fonts/fonts.css',import.meta.url).href;document.head.append(fonts);}
  const framing = cinematicState(state.animation,screens,reducedMotion.matches);
  const room=architecturalRoom(screens);
  const transition = framing.center;
  const presentation = derivePresentation({
    ...state,
    shift: reducedMotion.matches ? 1 : shift,
    copy: reducedMotion.matches ? 1 : copy,
    transition,
    travel: reducedMotion.matches ? 1 : travel,
  }, innerWidth);

  const api = modelFrame.contentWindow?.shuilongTemple;
  const hasLines = api?.setA01Presentation?.(state.animation, reducedMotion.matches);
  stage.style.setProperty('--model-opacity', hasLines ? 1 : Math.min(1, Math.max(0, (state.animation - 0.14) / 0.1)));
  stage.style.setProperty('--hero-weight',framing.hero);
  stage.style.setProperty('--cinematic-weight',framing.cinematic);
  const narrow = innerWidth <= 760;
  stage.style.setProperty('--model-x', `${presentation.modelX*framing.hero + (narrow ? 0 : 19) * theme.composition}vw`);
  stage.style.setProperty('--model-scale',1);
  const previousCanvas=directorFrame(canvasFrame(innerWidth,innerHeight,framing,theme.composition),innerWidth,innerHeight,screens,theme.composition);
  const canvas=roomFrame(previousCanvas,innerWidth,innerHeight,screens);
  stage.style.setProperty('--canvas-width',`${canvas.width}px`);
  stage.style.setProperty('--canvas-height',`${canvas.height}px`);
  modelFrame.parentElement.style.top = `${50+framing.hero*((narrow?-7:0)+(narrow?35:0)*theme.composition)}%`;
  stage.style.setProperty('--copy-opacity', presentation.copyVisibility);
  stage.style.setProperty('--copy-x', `${reducedMotion.matches ? 0 : mix(-12, 0, copy)}px`);
  stage.style.setProperty('--intro-mark-opacity', hasLines ? 0 : presentation.introMarkVisibility);
  stage.style.setProperty('--hint-opacity', presentation.hintVisibility);
  stage.style.setProperty('--a02-opacity', (a02Pass<4?0:room.heading) * (1 - theme.takeover));
  a02.setAttribute('aria-hidden', String(spatial.heading === 0 || theme.takeover === 1));
  const focused = spatial.emphasis > .5;
  a02Description.textContent = '先认识建筑，再看五幅壁画的位置。';
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
  if (!hasLines) setModelProgress(state.growth);
  modelFrame.contentWindow?.shuilongTemple?.setMuralPresentation({
    visibility: a02Pass<5?0:smooth(spatial.markers), emphasis: smooth(spatial.emphasis), coreIds: CORE_MURALS,
    revealWalls: smooth(spatial.revealWalls)*(1-room.weight),
    secondaryVisibility: theme.secondary,
    architecturalWeight:room.weight,
  });
  renderInkScene(screens,reducedMotion.matches);
  roomField(a02Pass>=3?screens:0);
  lastScreens = screens;
  modelFrame.contentWindow?.shuilongTemple?.setVisualProgress?.(screens);
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
reducedMotion.addEventListener('change', requestRender);
addEventListener('resize', () => {
  scrollTo(0,lastScreens*innerHeight);
  requestRender();
});
modelFrame.addEventListener('load', () => { modelProgress = -1; requestRender(); });
addEventListener('message', event => {
  if (event.origin !== location.origin || event.source !== modelFrame.contentWindow || !['shuilong:ready','shuilong:mural-ready'].includes(event.data?.type)) return;
  if(event.data.type==='shuilong:ready')modelProgress = -1;
  requestRender();
});
requestRender();
