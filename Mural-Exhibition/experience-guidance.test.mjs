import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gestureGuidance } from './public/experience-guidance.mjs';
const base = { cameraState:'RUNNING', reason:'TARGET_OUTSIDE', pointer:{valid:true}, reading:false, overflow:false, now:2000, experienced:false };
test('Guidance follows real acquisition, cursor, dwell, release and pause states', () => {
 for (const [reason,text] of [['NO_PERSON','①'],['WAIT_HAND','②'],['HAND_ACQUIRING','③'],['TARGET_OUTSIDE','④'],['DWELLING','1 秒'],['WAIT_RELEASE','移开光标'],['HAND_LOCKED_PAUSED','已暂停'],['POSE_STALE','已暂停']]) {
  assert.ok(gestureGuidance({...base,reason}).message.includes(text), reason);
 }
 assert.equal(gestureGuidance({...base,experienced:true}).tone,'quiet');
 assert.equal(gestureGuidance({...base,experienced:true,reason:'HAND_LOCKED_PAUSED'}).tone,'status');
 assert.ok(gestureGuidance({...base,cameraState:'ERROR'}).message.includes('鼠标、键盘'));
 assert.ok(gestureGuidance({...base,cameraState:'WARMING_UP'}).message.includes('准备'));
 assert.equal(gestureGuidance({...base,pointer:{valid:false}}).tone,'status');
 assert.ok(gestureGuidance({...base,reason:'HAND_LOCKED_PAUSED',lastAction:{at:1900}}).message.includes('暂停'));
});
test('Reading instructions appear only with an actual overflowing reading region', () => {
 assert.ok(!gestureGuidance({...base,reading:true}).message.includes('上下移动'));
 assert.ok(gestureGuidance({...base,reading:true,overflow:true}).message.includes('上下移动'));
 assert.equal(gestureGuidance({...base,lastAction:{at:1900}}).tone,'active');
});
test('V4.3 preserves camera, inference, pointer filtering, target layout and stage timeline', () => {
 const ref = '98d8d6362858681ff904ffe022af6d68eee96f71';
 // V4.3 explicitly changes ownership, dwell cancellation and horizontal calibration.
 // Their behavioral safety remains covered by the ownership/dwell/trajectory suites.
 for (const file of ['gesture-pointer.mjs','camera-lifecycle.mjs','pose-pipeline.mjs','pose-worker.js','dwell-feedback.mjs','figure-stage.mjs','orbit-stage.mjs','orbit-layout.mjs','mural-surface.mjs']) {
  const expected = execFileSync('git',['show',`${ref}:Mural-Exhibition/public/${file}`],{encoding:'utf8'});
  assert.equal(fs.readFileSync(new URL(`./public/${file}`,import.meta.url),'utf8').replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'),file);
 }
 const html=fs.readFileSync(new URL('./public/index.html',import.meta.url),'utf8').replace(/\r\n/g,'\n');
 const original=execFileSync('git',['show',`${ref}:Mural-Exhibition/public/index.html`],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 for (const [start,end] of [['function initMediaPipe','const dwellFeedback ='],['function setRevealed','const cameraStatus =']]) {
  const slice=s=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
  assert.ok(original.includes(start)&&original.includes(end));assert.equal(slice(html),slice(original),start);
 }
 const config=fs.readFileSync(new URL('./public/interaction-config.mjs',import.meta.url),'utf8').replace(/\r\n/g,'\n');
 const oldConfig=execFileSync('git',['show',`${ref}:Mural-Exhibition/public/interaction-config.mjs`],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 assert.equal(config.replace('left:.28,right:.72','left:.2,right:.8'),oldConfig);
 assert.ok(!/requestAnimationFrame|setInterval|setTimeout/.test(fs.readFileSync(new URL('./public/experience-guidance.mjs',import.meta.url),'utf8')));
});
