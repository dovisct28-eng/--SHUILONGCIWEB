import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gestureState,events} from '../motion-graphics/gesture-v4-state.ts';
import timing from './v4-timing.cjs';
import {check} from './validate-v4.cjs';
test('single event table drives native SFX and deterministic hand actions',()=>{
 assert.deepEqual(events,timing.gestureEvents);
 for(const e of events){assert.equal(gestureState(e.at-30).progress,0);assert.ok(gestureState(e.at-1).progress<1);assert.equal(gestureState(e.at).progress,1);assert.ok(gestureState(e.at).confirmed);assert.equal(gestureState(e.release+12).lock,0);}
});
test('all 34 seconds retain continuous hand, cursor and panel geometry',()=>{
 for(let f=1;f<1020;f++){const a=gestureState(f-1),b=gestureState(f);assert.ok(Math.abs(a.figureLeft-b.figureLeft)<23);assert.ok(Math.abs(a.figureWidth-b.figureWidth)<8);assert.ok(Math.abs(a.handX-b.handX)<20);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<100);}
 assert.equal(gestureState(660).expand,0);assert.equal(gestureState(684).expand,1);assert.equal(gestureState(930).expand,1);assert.equal(gestureState(954).expand,0);
});
test('new V4 graph has no removed text nodes or display properties',()=>{const code=fs.readFileSync(new URL('../motion-graphics/GestureStageV4.tsx',import.meta.url),'utf8');for(const token of ['simulationLabel','digitalLabel','交互效果模拟演示','数字化演绎内容'])assert.ok(!code.includes(token));});
test('A04 source time is strictly increasing and preserves both turns and summary',()=>{let prev=-1;for(const [f,t]of timing.tourKeys){assert.ok(f>prev);prev=f;assert.ok(t>=0&&t<=45);}assert.deepEqual(timing.tourKeys.map(x=>x[1]),[0,4,8,18,22,32,36,41,45]);});
const planFile=new URL('../planning/timeline-v4.json',import.meta.url),stateFile=new URL('../planning/production-state-v4.json',import.meta.url);
test('actual native timeline and negative acceptance cases', {skip:!fs.existsSync(stateFile)},()=>{
 const p=JSON.parse(fs.readFileSync(planFile)),m=JSON.parse(fs.readFileSync(stateFile));assert.equal(check(m,p).status,'EDITORIAL_STRUCTURE_PASS');
 for(const change of [x=>{x.state.timeline.entries.find(e=>e.kind==='item'&&e.trackAlias==='V1').startFrame=1;},x=>{x.state.timeline.entries.find(e=>e.kind==='item'&&e.trackAlias==='A2').startFrame++;},x=>{x.itemDetails=[{item:{propertyOverrides:{text:'字幕属性可编辑核验'}}}];}]){const bad=structuredClone(m);change(bad);assert.throws(()=>check(bad,p,{files:false}));}
 const long=structuredClone(p);long.durationFrames=180*30+1;assert.throws(()=>check(m,long));
});
