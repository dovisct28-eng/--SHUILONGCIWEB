import {test} from 'node:test';
import assert from 'node:assert/strict';
import {surfaceConfig,SURFACE_PRESETS,treatPanel,DecorationBudget,exhibitionTiming} from './public/mural-surface.mjs';
test('Surface defaults preserve recognizability, strong requires explicit choice, controls are bounded',()=>{
 assert.deepEqual(surfaceConfig(),{preset:'standard',...SURFACE_PRESETS.standard});
 assert.equal(surfaceConfig({preset:'unknown'}).preset,'standard');
 assert.equal(surfaceConfig({grain:Infinity}).grain,SURFACE_PRESETS.standard.grain);
 assert.equal(surfaceConfig({erosion:9}).erosion,.08);
 assert.equal(surfaceConfig({cracks:-1}).cracks,0);
 assert.equal(surfaceConfig({preset:'off',grain:1}).grain,0);
 assert.ok(surfaceConfig().cracks>=.0015&&surfaceConfig().cracks<=.0035);
 assert.ok(exhibitionTiming.first<=1.2&&exhibitionTiming.cached<exhibitionTiming.first);
});
test('Dark source lines have lower modulation than pigment fields; transparent RGB stays exact',()=>{
 const make=v=>{const a=new Uint8ClampedArray(64*64*4);for(let i=0;i<a.length;i+=4)a.set([v,v,v,i%12?255:0],i);return a;};
 const dark=make(18),light=make(180),d=treatPanel(dark,64,64,{}),l=treatPanel(light,64,64,{});
 let darkDelta=0,lightDelta=0;
 for(let i=0;i<d.length;i+=4){if(!dark[i+3]){assert.deepEqual(d.slice(i,i+4),dark.slice(i,i+4));assert.deepEqual(l.slice(i,i+4),light.slice(i,i+4));}else{darkDelta+=Math.abs(d[i]-dark[i]);lightDelta+=Math.abs(l[i]-light[i]);}assert.equal(d[i+3],dark[i+3]);}
 assert.ok(darkDelta<lightDelta*.15);
});
test('Panel treatment never changes alpha, preserves source bytes, restores exactly and does not accumulate',()=>{
 const raw=new Uint8ClampedArray(64*64*4);
 for(let i=0;i<raw.length;i+=4)raw.set([220,120,60,(i/4)%3?255:0],i);
 const before=raw.slice(),treated=treatPanel(raw,64,64,{});
 assert.deepEqual(raw,before);assert.deepEqual(treatPanel(raw,64,64,{preset:'off'}),raw);
 assert.deepEqual(treated,treatPanel(raw,64,64,{}));
 let changed=0;
 for(let i=0;i<raw.length;i+=4){assert.equal(treated[i+3],raw[i+3]);if(raw[i+3]){for(let k=0;k<3;k++){assert.ok(Math.abs(treated[i+k]-raw[i+k])<=6);changed+=treated[i+k]!==raw[i+k]?1:0;}}}
 assert.ok(changed>100);
});
test('Decoration budget requires two sustained slow windows, skips hidden/gaps and keeps degradation sticky',()=>{
 const budget=new DecorationBudget();let time=1;
 for(let i=0;i<240;i++){time+=16.7;assert.equal(budget.sample(time),false);}
 budget.sample(time+1000,false);time+=1000;
 for(let i=0;i<241;i++){time+=35;budget.sample(time);}
 assert.equal(budget.degraded,true);
 for(let i=0;i<300;i++){time+=16;budget.sample(time);}assert.equal(budget.degraded,true);
 budget.reset();assert.equal(budget.degraded,false);
});
