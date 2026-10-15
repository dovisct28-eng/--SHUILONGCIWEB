const {test}=require('node:test'),assert=require('node:assert/strict');
const {validate,time}=require('./validate-plan.cjs');
const source=require('../planning/timeline.json'),register=require('../docs/asset-register.json');
test('approved-format proposal covers the complete film',()=>{assert.equal(validate(structuredClone(source),register).length,7);assert.equal(time(3600),'00:02:00,000');assert.equal(time(3588),'00:01:59,600');});
test('a cut overlap is rejected rather than shortening runtime',()=>{const p=structuredClone(source);p.shots[4].start--;assert.throws(()=>validate(p,register),/shot gap\/overlap/);});
test('one undisclosed simulation frame is rejected',()=>{const p=structuredClone(source);p.overlays.find(o=>o.purpose==='simulation-disclosure').start++;assert.throws(()=>validate(p,register),/undisclosed simulation frame 1650/);});
test('local-only or deleted assets cannot silently replace audited visuals',()=>{for(const target of ['Mural-Exhibition/public/assets/08_上层猖兵/org.png','Mural-Exhibition/public/assets/10_上层猖兵/org.png']){const p=structuredClone(source);p.assets.org01=target;assert.throws(()=>validate(p,register),/untracked, deleted, changed, or unaudited/);}});
test('a premature trigger and insufficient release are rejected',()=>{let p=structuredClone(source);p.gestureEvents[0].triggerFrame--;assert.throws(()=>validate(p,register),/one second dwell/);p=structuredClone(source);p.gestureEvents[0].releaseEndFrame=p.gestureEvents[0].releaseStartFrame+7;assert.throws(()=>validate(p,register),/under 250ms/);});
test('reading cannot be followed by another NEXT in the proposed sequence',()=>{const p=structuredClone(source);p.gestureEvents[2].action='NEXT';assert.throws(()=>validate(p,register));});
