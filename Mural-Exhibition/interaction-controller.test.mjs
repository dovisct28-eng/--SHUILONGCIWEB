import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraHarness,hand,person,hold,swipe,pair,openReading,closeReading,releaseReading,idle} from './b03-gesture-harness.mjs';

test('G/H: static spread is not an open action; neutral → spread → hold enters only once',()=>{
 const h=cameraHarness();pair(h,.6,.5,2000);assert.equal(h.snapshot().reveals,0);
 openReading(h);assert.equal(h.snapshot().reading,true);assert.equal(h.snapshot().reveals,1);
 pair(h,.48,.5,1000);assert.equal(h.snapshot().reveals,1);
});
test('I/J: close → separate → remove hand never reopens or NEXTs before stable release',()=>{
 const h=cameraHarness();openReading(h);pair(h,.48,.7,160);assert.ok(h.snapshot().scrollTop>0);
 closeReading(h);assert.equal(h.snapshot().reading,false);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
 pair(h,.3);pair(h,.5,.5,500);hold(h);swipe(h);
 assert.equal(h.snapshot().reveals,1);assert.equal(h.snapshot().calls,0);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
 releaseReading(h);assert.equal(h.snapshot().mode,'NAVIGATION');hold(h);swipe(h);
 assert.equal(h.snapshot().calls,1);assert.equal(h.snapshot().closes,1);
});
test('Release: one hand in NEXT zone cannot release; neutral one-hand requires 500ms',()=>{
 const h=cameraHarness();openReading(h);closeReading(h);hold(h,1500);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
 for(let i=0;i<14;i++)h.result([hand(.4)],h.time+40);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
 for(let i=0;i<12;i++)h.result([hand(.4)],h.time+40);assert.equal(h.snapshot().mode,'NAVIGATION');
});
test('B/C/D/K: bystander hands cannot NEXT, open, scroll or close the active visitor archive',()=>{
 const h=cameraHarness(),a=person();let b;
 for(let i=0;i<70;i++){
  const ah=hand(.65),bh=[hand(.05+i%3*.02),hand(.18)];b=person({x:.88,width:.4,hands:bh});
  h.result([ah,...bh],h.time+40,{poses:[person({hands:[ah]}),b]});
  assert.equal(h.snapshot().operator,'visitor-1');assert.ok(h.snapshot().assigned<=1);
 }
 assert.equal(h.snapshot().reveals,0);assert.equal(h.snapshot().calls,0);
 idle(h);openReading(h);const scroll=h.snapshot().scrollTop;
 for(let i=0;i<25;i++){const bh=[hand(.1,.8),hand(.2,.8)];h.result(bh,h.time+40,{poses:[a,person({x:.88,hands:bh})]});}
 assert.equal(h.snapshot().reading,true);assert.equal(h.snapshot().scrollTop,scroll);
});
test('L: confirmed own second hand cancels ARMED, cannot steal intent; new neutral/open required',()=>{
 const h=cameraHarness();hold(h);assert.equal(h.snapshot().state,'ARMED');pair(h,.55,.5,360);
 assert.equal(h.snapshot().calls,0);assert.equal(h.snapshot().reading,false);
 openReading(h);assert.equal(h.snapshot().reading,true);
});
test('Page transition / hidden ownership / stale timestamp cannot produce any gesture',()=>{
 const h=cameraHarness();h.busy(true);openReading(h);assert.equal(h.snapshot().reveals,0);hold(h);swipe(h);assert.equal(h.snapshot().calls,0);
 h.busy(false);for(let i=0;i<40;i++)h.result([hand()],h.time+40,{poseAt:h.time-400});assert.equal(h.snapshot().calls,0);
});
test('late Hands callback from an earlier camera session cannot mutate interaction',()=>{
 const h=cameraHarness();hold(h);const before=h.snapshot();
 h.staleResult([hand(.2),hand(.8)],h.time+20);
 assert.equal(h.snapshot().assigned,before.assigned);assert.equal(h.snapshot().state,'ARMED');assert.equal(h.snapshot().reveals,0);
});
test('ordinary preview draws detected hand skeleton and points; missing hands clear it and old callbacks cannot draw',()=>{
 const h=cameraHarness(),before=h.snapshot();h.result([hand(.25),hand(.75)],h.time+40);
 const drawn=h.snapshot();assert.equal(drawn.previewLines-before.previewLines,2);assert.equal(drawn.previewPoints-before.previewPoints,2);
 h.result([],h.time+40);assert.equal(h.snapshot().previewClears,drawn.previewClears+1);
 const cleared=h.snapshot();h.staleResult([hand()],h.time+40);assert.equal(h.snapshot().previewClears,cleared.previewClears);assert.equal(h.snapshot().previewLines,cleared.previewLines);
});
test('Manual I/Escape uses the same reading lifecycle; person loss closes and clears every intent',()=>{
 const h=cameraHarness();h.manual(true);assert.equal(h.snapshot().mode,'READING_ENTER');h.manual(false);
 hold(h);assert.equal(h.snapshot().mode,'POST_READING_LOCK');assert.equal(h.snapshot().calls,0);
 releaseReading(h);openReading(h);for(let i=0;i<30;i++)h.result([],h.time+40,{poses:[]});
 assert.equal(h.snapshot().reading,false);assert.equal(h.snapshot().state,'IDLE');assert.equal(h.snapshot().person,'SEARCHING');
});
test('M: ten complete lock/NEXT/NEXT/read/close/release/NEXT/exit/reacquire cycles',()=>{
 let attempts=0;for(let n=0;n<10;n++){
  const h=cameraHarness();for(let j=0;j<2;j++){hold(h);swipe(h,j?-.04:.04);attempts++;idle(h);}
  openReading(h);closeReading(h);pair(h,.55,.5,400);assert.equal(h.snapshot().reveals,1);
  assert.equal(h.snapshot().calls,2);releaseReading(h);hold(h);swipe(h);attempts++;
  assert.equal(h.snapshot().calls,3);assert.equal(h.snapshot().index,5);
  for(let i=0;i<30;i++)h.result([],h.time+40,{poses:[]});assert.equal(h.snapshot().person,'SEARCHING');
  for(let i=0;i<25;i++)h.result([],h.time+40,{poses:[person({x:.65})]});assert.equal(h.snapshot().person,'PERSON_LOCKED');
  assert.equal(h.snapshot().reveals,1);assert.equal(h.snapshot().closes,1);
 }assert.equal(attempts,30);
});

test('V3.1 K: ten cycles each with left/right/both missing wrists; upper-body reading and NEXT never relock',()=>{
 for(const missingWrists of [['left'],['right'],['left','right']]){
 const h=cameraHarness(2,{upper:true,missingWrists}),id=h.snapshot().operator;
 for(let n=0;n<10;n++){
  openReading(h);assert.equal(h.snapshot().reading,true);
  for(const side of missingWrists)assert.equal(h.snapshot().diagnostics[side+'Source'],'fallback');
  const scroll=h.snapshot().scrollTop;pair(h,.48,.7,160);assert.ok(h.snapshot().scrollTop>scroll);
  closeReading(h);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
  pair(h,.5,.5,400);assert.equal(h.snapshot().reading,false);assert.equal(h.snapshot().reveals,n+1);
  assert.equal(h.snapshot().calls,n);releaseReading(h);assert.equal(h.snapshot().mode,'NAVIGATION');
  hold(h);swipe(h);assert.equal(h.snapshot().calls,n+1);idle(h);
  assert.equal(h.snapshot().operator,id);assert.equal(h.snapshot().person,'PERSON_LOCKED');
  assert.equal(h.snapshot().index,(3+n)%8);assert.equal(h.snapshot().closes,n+1);
 }
 }
});
test('V3.1: ambiguous body observations cannot count as hands-absent post-reading release',()=>{
 const h=cameraHarness(2,{upper:true}),id=h.snapshot().operator;openReading(h);closeReading(h);
 for(let n=0;n<18;n++)h.result([],h.time+40,{poses:[person({upper:true}),person({x:.52,upper:true})]});
 assert.equal(h.snapshot().operator,id);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
 assert.equal(h.snapshot().diagnostics.operatorObservable,false);
 releaseReading(h);assert.equal(h.snapshot().mode,'NAVIGATION');
});
test('V3.1 H: ambiguous ownership cancels NEXT and freezes open, close, scrolling and post-reading release',()=>{
 const h=cameraHarness(2,{upper:true}),id=h.snapshot().operator;
 const blocked=(hands,ms=600)=>{for(let n=0;n<=ms;n+=40)h.result(hands,h.time+40,{poses:[person({upper:true,hands}),person({x:.82,width:.4,upper:true,hands})]});};
 hold(h);blocked([hand()]);assert.equal(h.snapshot().calls,0);assert.equal(h.snapshot().state,'IDLE');
 blocked([hand(.25),hand(.75)]);assert.equal(h.snapshot().reveals,0);assert.equal(h.snapshot().operator,id);
 idle(h);openReading(h);const scroll=h.snapshot().scrollTop;blocked([hand(.45,.7),hand(.55,.7)]);
 assert.equal(h.snapshot().reading,true);assert.equal(h.snapshot().scrollTop,scroll);assert.equal(h.snapshot().operator,id);
 closeReading(h);blocked([hand(.45),hand(.55)]);assert.equal(h.snapshot().mode,'POST_READING_LOCK');
 assert.equal(h.snapshot().reveals,1);assert.equal(h.snapshot().closes,1);
 releaseReading(h);assert.equal(h.snapshot().mode,'NAVIGATION');
});
