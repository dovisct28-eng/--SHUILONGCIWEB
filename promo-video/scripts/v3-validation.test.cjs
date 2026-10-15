const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {check}=require('./validate-v3.cjs');const base=path.resolve(__dirname,'..');
const plan=JSON.parse(fs.readFileSync(path.join(base,'planning/timeline-v3-150s.json'))),manifest=JSON.parse(fs.readFileSync(path.join(base,'planning/production-state-v3.json')));
test('actual V3 native readback validates independently of the 130-second plan',()=>assert.equal(check(manifest,plan).durationFrames,4500));
test('old 3900-frame assumption and a real main-track gap are rejected',()=>{
 const m=structuredClone(manifest);m.state.state.durationFrames=3900;assert.throws(()=>check(m,plan),/version duration/);
 const g=structuredClone(manifest);const e=g.state.timeline.entries.find(e=>e.kind==='item'&&e.trackAlias==='V1'&&e.startFrame===1830);e.timelineRange.fromFrame++;assert.throws(()=>check(g,plan),/visual gap/);
});
test('source trim drift and confirmation sound offset cannot silently pass',()=>{
 const m=structuredClone(manifest);m.state.timeline.entries.find(e=>e.kind==='item'&&e.trackAlias==='V1'&&e.startFrame===1830).sourceRange.start+=33333;assert.throws(()=>check(m,plan),/source in/);
 const a=structuredClone(manifest);a.state.timeline.entries.find(e=>e.kind==='item'&&e.trackAlias==='A2').startFrame++;assert.throws(()=>check(a,plan));
});
