import test from 'node:test';
import assert from 'node:assert/strict';
import {ANCHORS, navigationState} from './state.mjs';
import {deriveScrollState} from '../a01/progress.mjs';
import {deriveA03State} from '../a03/progress.mjs';
import {architecturalRoom} from '../a02/spatial.mjs';
import {guideProgress} from '../guide/progress.mjs';
import {a05Guide} from '../a05/content.mjs';
import {explorationAvailable, EXPLORATION_URL} from './exploration.mjs';

test('anchors reach actual stable Hero, centered architecture, poster and fifth mural INTRO', () => {
  assert.equal(deriveScrollState(ANCHORS.hero, 1).heroStable, true);
  assert.equal(deriveScrollState(ANCHORS.space, 1).transition, 1);
  assert.equal(architecturalRoom(ANCHORS.space).heading, 1);
  assert.equal(architecturalRoom(ANCHORS.space).arrival, 1);
  const theme = deriveA03State(ANCHORS.theme, 1);
  assert.equal(theme.text, 1); assert.equal(theme.composition, 1); assert.equal(theme.purpose, 1);
  const guide = guideProgress(ANCHORS.guide, a05Guide.start, a05Guide.end, a05Guide.introLength);
  assert.equal(guide.active, true); assert.equal(guide.entry, 1); assert.equal(guide.opacity, 1);
  assert.equal(guide.introduction, 1); assert.equal(guide.galleryExpand, 0);
});
const nav = (phase, screens = 20) => navigationState({phase, room:architecturalRoom(screens), transition:deriveScrollState(screens, 1).transition});
test('A01 and recenter remain inaccessible; A02 waits for readable heading', () => {
  for (const phase of ['travel','growth','shift','copy','reading','a02-transition']) assert.equal(nav(phase, 6.8).visible, false);
  assert.equal(nav('a02-space', 7.2).visible, false);
  assert.equal(nav('a02-space', ANCHORS.space).visible, true);
});
test('forward and reverse chapter phases map to position, never accumulated completion', () => {
  const phases = ['a02-overview','a03-reading','a04-playing','a05-introduction','a06-scan','a07-handoff','a08'];
  const expected = [0,1,2,3,3,3,3];
  phases.forEach((phase, index) => assert.equal(nav(phase).stage, expected[index]));
  [...phases].reverse().forEach((phase,index) => assert.equal(nav(phase).stage, [...expected].reverse()[index]));
  assert.equal(nav('a04-playing').layout, 'route');
  assert.equal(nav('a05-introduction').quiet, false);
  assert.equal(nav('a07-scan').quiet, true);
  assert.equal(nav('a08').label, '图像导读结束，可进入探索');
});
test('full mural scans hide the brand while INTRO and A08 retain the return entry', () => {
  for (const phase of ['a05-scan','a06-scan','a07-scan','a07-handoff','a05-expanding']) assert.equal(nav(phase).brandVisible, false);
  for (const phase of ['a05-introduction','a06-introduction','a07-introduction','a08']) assert.equal(nav(phase).brandVisible, true);
  assert.equal(nav('reading',5.6).brandVisible, false);
});
test('exploration preflight uses B existing independent entry, no CORS dependency', async () => {
  let request;
  assert.equal(await explorationAvailable(async (...args) => {request=args;return {type:'opaque'};}), true);
  assert.equal(request[0], EXPLORATION_URL);
  assert.equal(request[1].mode, 'no-cors'); assert.equal(request[1].cache, 'no-store');
});
test('unavailable B and timeout resolve without leaving A', async () => {
  assert.equal(await explorationAvailable(async () => {throw new TypeError('connection refused');}), false);
  const hanging = (_, {signal}) => new Promise((_,reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  assert.equal(await explorationAvailable(hanging, 10), false);
});
