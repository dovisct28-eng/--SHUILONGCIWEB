import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cameraHarness,hand,hold,swipe,openReading,closeReading,releaseReading,pair,idle} from './b03-gesture-harness.mjs';

test('A/B: ordinary movement, edge pass, pointing and 200ms hold cannot NEXT',()=>{
 for(const x of [.2,.7]) {
  const h=cameraHarness();for(let i=0;i<100;i++)h.result([hand(x+i%3*.07,.5)],h.time+30);
  assert.equal(h.snapshot().calls,0);
 }
 const h=cameraHarness();hold(h,200);swipe(h);assert.equal(h.snapshot().calls,0);
 for(let i=0;i<20;i++)h.result([hand(.7,.5,false)],h.time+30);
 assert.equal(h.snapshot().calls,0);assert.equal(h.snapshot().state,'IDLE');
});
test('C: 600ms stable hold arms, timeout returns IDLE; no trajectory accumulated before ARMED',()=>{
 const h=cameraHarness();hold(h,400);assert.equal(h.snapshot().state,'HOVER');assert.equal(h.snapshot().points,0);
 hold(h,300);assert.equal(h.snapshot().state,'ARMED');
 for(let i=0;i<100&&h.snapshot().state==='ARMED';i++)h.result([hand()],h.time+20);
 assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().calls,0);
});
for(const [name,dx,dy] of [['left',-.04,0],['right',.04,0],['up-left',-.035,-.025],['down-left',-.035,.025],['up-right',.035,-.025],['down-right',.035,.025]]) {
 test(`D/E/F: production callback ${name} is NEXT exactly once`,()=>{
  const h=cameraHarness();hold(h);assert.equal(h.snapshot().state,'ARMED');swipe(h,dx,dy);
  assert.equal(h.snapshot().index,3);assert.equal(h.snapshot().calls,1);assert.equal(h.snapshot().state,'LOCKED');
 });
}
test('G/H/I: long held-open stroke never repeats; completion requires a fresh hold, ten independent sessions work',()=>{
 const h=cameraHarness();
 for(let n=0;n<10;n++) {
  hold(h);assert.equal(h.snapshot().state,'ARMED');swipe(h);
  assert.equal(h.snapshot().calls,n+1);
  h.busy(true);for(let i=0;i<100;i++)h.result([hand(i%2?.2:.8)],h.time+30);
  assert.equal(h.snapshot().state,'LOCKED');assert.equal(h.snapshot().calls,n+1);
  h.busy(false);h.tick(h.time+20);assert.equal(h.snapshot().state,'IDLE');
  swipe(h);assert.equal(h.snapshot().calls,n+1);
 }
});
test('Presence: production empty AND omitted results preserve short HOVER/ARMED gaps and clear sustained loss',()=>{
 const h=cameraHarness();hold(h,300);const before=h.snapshot().holdMs;
 h.result([],h.time+20);assert.equal(h.snapshot().state,'HOVER');h.result([hand()],h.time+40);
 assert.equal(h.snapshot().state,'HOVER');assert.ok(h.snapshot().holdMs-before<60);
 hold(h,400);assert.equal(h.snapshot().state,'ARMED');h.result(undefined,h.time+20);h.result([],h.time+20);
 assert.equal(h.snapshot().state,'ARMED');h.result([hand(.66)],h.time+40);swipe(h,-.04);
 assert.equal(h.snapshot().calls,1);
 idle(h);hold(h);assert.equal(h.snapshot().state,'ARMED');h.result([],h.time+20);h.result(undefined,h.time+220);
 assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().points,0);
 hold(h);swipe(h);assert.equal(h.snapshot().calls,2);
});
test('Stationary palm for 10s, jitter, landmark jumps and backtracking produce zero NEXT',()=>{
 for(const jitter of [0,.015,.04]) {
  const h=cameraHarness();for(let i=0;i<500;i++)h.result([hand(.7+Math.sin(i)*jitter,.5+Math.cos(i)*jitter)],h.time+20);
  assert.equal(h.snapshot().calls,0);
 }
 const h=cameraHarness();hold(h);h.result([hand(.1)],h.time+20);h.result([hand(.9)],h.time+20);
 assert.equal(h.snapshot().calls,0);
 for(let i=0;i<40;i++)h.result([hand(.7+i%2*.06)],h.time+30);
 assert.equal(h.snapshot().calls,0);
});
test('Open hysteresis tolerates one closed frame; sustained closed cancels, without requiring a fist',()=>{
 const h=cameraHarness();hold(h,300);h.result([hand(.7,.5,false)],h.time+20);h.result([hand()],h.time+20);
 assert.equal(h.snapshot().state,'HOVER');hold(h,400);assert.equal(h.snapshot().state,'ARMED');
 for(let i=0;i<8;i++)h.result([hand(.7,.5,false)],h.time+20);
 assert.equal(h.snapshot().state,'IDLE');hold(h);swipe(h);assert.equal(h.snapshot().calls,1);
});
test('Owned two hands cancel NEXT; deliberate open/read/close requires release before NEXT',()=>{
 const h=cameraHarness();hold(h);
 const small=hand(.73);small[0].y=.51;
 for(let i=0;i<8;i++)h.result([hand(),small],h.time+20);assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().calls,0);
 releaseReading(h);openReading(h);assert.equal(h.snapshot().reading,true);
 pair(h,.48,.7,120);assert.ok(h.snapshot().scrollTop>0);
 for(let i=0;i<30;i++)h.result([hand(.7+i%2*.2,.8)],h.time+40);
 assert.equal(h.snapshot().calls,0);
 closeReading(h);assert.equal(h.snapshot().reading,false);assert.equal(h.snapshot().state,'IDLE');
 swipe(h);assert.equal(h.snapshot().calls,0);releaseReading(h);hold(h);swipe(h);assert.equal(h.snapshot().calls,1);
});
test('600ms intent is independent of frame rate; normal, fast and slow trajectory windows',()=>{
 for(const step of [16,33,66,100]) {
  const h=cameraHarness();hold(h,850,.7,.5,step);assert.equal(h.snapshot().state,'ARMED');swipe(h);assert.equal(h.snapshot().calls,1);
 }
 for(const [dx,step]of [[.04,40],[.07,25],[.035,60]]) {
  const h=cameraHarness();hold(h);swipe(h,dx,0,step);assert.equal(h.snapshot().calls,1);
 }
});
test('Last loops forward; no PREVIOUS endpoint; mouse/keyboard preserved; no new RAF/camera instances',()=>{
 const h=cameraHarness(7);hold(h);swipe(h,-.04);assert.equal(h.snapshot().index,0);
 const html=fs.readFileSync(new URL('public/index.html',import.meta.url),'utf8');
 const endpoint=html.slice(html.indexOf('function goToNextCharacterFromGesture'),html.indexOf('function triggerSwipeFlash'));
 assert.equal((endpoint.match(/loadSeriesData\(currentSeriesIndex \+ 1\)/g)||[]).length,1);
 assert.ok(!/currentSeriesIndex\s*-\s*1|PREVIOUS|deltaX/.test(endpoint));
 assert.ok(html.includes('button.onclick = () => stepCharacter(Number(button.dataset.step))'));
 assert.ok(html.includes("e.key === 'ArrowLeft' || e.key === 'ArrowRight'"));
 assert.equal((html.match(/new Hands\(/g)||[]).length,1);assert.equal((html.match(/new Camera\(/g)||[]).length,1);
});

test('Diagnostic reasons distinguish timeout, tracking loss and palm closure; traces stay bounded',()=>{
 const h=cameraHarness();hold(h);
 for(let i=0;i<100&&h.snapshot().state==='ARMED';i++)h.result([hand()],h.time+20);
 assert.equal(h.snapshot().reason,'armed-timeout');
 hold(h);h.result([],h.time+20);h.tick(h.time+210);
 assert.equal(h.snapshot().reason,'tracking-gap');
 hold(h);for(let i=0;i<8;i++)h.result([hand(.7,.5,false)],h.time+20);
 assert.equal(h.snapshot().reason,'palm-closed');assert.equal(h.snapshot().calls,0);
});

test('Physical failure regression: a transient second detection pauses NEXT; sustained two hands cancel intent',()=>{
 const h=cameraHarness();hold(h);const extra=hand(.72);extra[0].y=.51;
 h.result([hand(),extra],h.time+30);h.result([hand(.65),extra],h.time+30);
 assert.equal(h.snapshot().state,'ARMED');assert.equal(h.snapshot().calls,0);
 h.result([hand(.66)],h.time+30);swipe(h,-.04);assert.equal(h.snapshot().calls,0);
 releaseReading(h);hold(h);swipe(h,-.04);assert.equal(h.snapshot().calls,1);
 idle(h);hold(h);
 for(let i=0;i<7;i++)h.result([hand(.7+i*.04),extra],h.time+30);
 assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().calls,1);
 assert.equal(h.snapshot().reading,false);
});

test('False-trigger regression: a held palm cannot silently arm again after timeout or NEXT',()=>{
 const h=cameraHarness();hold(h);
 for(let i=0;i<200;i++)h.result([hand()],h.time+20);
 assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().releaseRequired,true);
 swipe(h,.015,0,40,8);assert.equal(h.snapshot().calls,0);
 h.result([hand(.55)],h.time+20);hold(h);swipe(h);
 assert.equal(h.snapshot().calls,1);
 idle(h);
 // Deliberately keep a palm inside the activation area; do not use hold()'s return helper.
 for(let i=0;i<200;i++)h.result([hand()],h.time+20);
 assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().releaseRequired,true);
 swipe(h,.015,0,40,8);assert.equal(h.snapshot().calls,1);
 h.result([hand(.55)],h.time+20);hold(h);swipe(h,-.04);assert.equal(h.snapshot().calls,2);
});
