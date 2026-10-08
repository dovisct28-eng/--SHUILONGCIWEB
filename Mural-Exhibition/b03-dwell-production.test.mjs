import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraHarness,sustain,release,hand,person} from './b03-dwell-harness.mjs';
test('production onResults: OPEN, CLOSE, release, NEXT and last wrap; no old gestures or double actions',()=>{
 const h=cameraHarness(7);sustain(h,.28,.545,1400);assert.equal(h.snapshot().reading,true);assert.equal(h.snapshot().reveals,1);
 sustain(h,.28,.545,2000);assert.equal(h.snapshot().closes,0);release(h);sustain(h,.28,.545,1400);assert.equal(h.snapshot().closes,1);
 sustain(h,.28,.545,2000);assert.equal(h.snapshot().reveals,1);release(h);sustain(h,.72,.545,1400);assert.equal(h.snapshot().calls,1);assert.equal(h.snapshot().index,0);
 sustain(h,.72,.545,3000);assert.equal(h.snapshot().calls,1);
});
test('production omitted/empty frames, stale session and stale pose never replay dwell or drawing',()=>{
 const h=cameraHarness();sustain(h,.28,.545,600);const before=h.snapshot();h.staleResult([hand(.28,.545)],h.time+40);assert.equal(h.snapshot().previewClears,before.previewClears);
 h.result(undefined,h.time+40);assert.equal(h.snapshot().state,'TRACKING_PAUSED');sustain(h,null,.5,400);sustain(h,.28,.545,600);assert.equal(h.snapshot().reveals,0);
 for(let n=0;n<40;n++)h.result([hand(.28,.545)],h.time+40,{poseAt:h.time-400});assert.equal(h.snapshot().reveals,0);
});
test('production preview skeleton is preserved, both-hand target competition blocks, resting hand and reordered detection retain control',()=>{
 const h=cameraHarness(),a=hand(.28,.545),b=hand(.65,.75),poses=[person({hands:[a,b],upper:true})];
 for(let n=0;n<40;n++)h.result(n%2?[a,b]:[b,a],h.time+40,{poses});assert.equal(h.snapshot().reveals,1);assert.ok(h.snapshot().previewLines>=80);
 const c=cameraHarness(),other=hand(.72,.545),both=[a,other],body=person({hands:both,upper:true});for(let n=0;n<50;n++)c.result(both,c.time+40,{poses:[body]});assert.equal(c.snapshot().calls+c.snapshot().reveals,0);assert.equal(c.snapshot().blockedReason,'AMBIGUOUS_HAND');
});
test('production rejects bystanders behind/side, extra hands, overlap and replacement without transferring progress',()=>{
 for(const x of [.5,.74,.9]){const h=cameraHarness(),a=hand(.28,.545),bh=[hand(.68,.5),hand(.72,.545)],poses=[person({hands:[a],upper:true}),person({x,hands:bh,upper:true,width:.34})];const id=h.snapshot().operator;for(let n=0;n<20;n++)h.result([...bh,a],h.time+40,{poses});assert.equal(h.snapshot().calls+h.snapshot().reveals,0);assert.equal(h.snapshot().operator,id);}
 const h=cameraHarness();sustain(h,.28,.545,700);const id=h.snapshot().operator;sustain(h,null,.5,1200,{poses:[]});assert.equal(h.snapshot().operator,undefined);sustain(h,null,.5,1200,{poses:[person({x:.7,upper:true})]});assert.notEqual(h.snapshot().operator,id);assert.equal(h.snapshot().calls+h.snapshot().reveals,0);
});
test('production hidden/manual/reading scroll lifecycle preserves exclusive UI state and stops on invalid input',()=>{
 const h=cameraHarness();h.manual(true);sustain(h,.62,.57,1200);const sc=h.snapshot().scrollTop;assert.ok(sc>0);sustain(h,null,.5,400);assert.equal(h.snapshot().scrollTop,sc);sustain(h,.72,.545,1500);assert.equal(h.snapshot().calls,0);
 h.manual(false);sustain(h,.28,.545,1200);assert.equal(h.snapshot().reveals,1);h.hidden(true);assert.equal(h.snapshot().person,'SEARCHING');h.hidden(false);assert.equal(h.snapshot().releaseRequired,false);assert.equal(h.snapshot().reading,false);
});
test('production ten full cycles, ownership stays stable and actions remain exactly once',()=>{
 const h=cameraHarness();const id=h.snapshot().operator;for(let n=0;n<10;n++){release(h);sustain(h,.28,.545,1500);assert.equal(h.snapshot().reveals,n+1);release(h);sustain(h,.28,.545,1500);assert.equal(h.snapshot().closes,n+1);release(h);sustain(h,.72,.545,1500);assert.equal(h.snapshot().calls,n+1);assert.equal(h.snapshot().operator,id);}
});
test('production reading velocity depends on elapsed time across 50/25/10 callback FPS',()=>{
 const scroll=[];for(const step of [20,40,100]){const h=cameraHarness();h.manual(true);for(let at=0;at<2400;at+=step)h.result([hand(.62,.57)],h.time+step);scroll.push(h.snapshot().scrollTop);}assert.ok(Math.max(...scroll)-Math.min(...scroll)<60,JSON.stringify(scroll));assert.ok(Math.min(...scroll)>100);
});
test('production two hands at the same target cannot share or inherit dwell; left/right alternation starts fresh',()=>{
 const h=cameraHarness(),a=hand(.28,.545);for(let n=0;n<40;n++)h.result([a,structuredClone(a)],h.time+40,{poses:[person({hands:[a,a],upper:true})]});assert.equal(h.snapshot().reveals,0);assert.match(h.snapshot().blockedReason,/AMBIGUOUS/);
});
