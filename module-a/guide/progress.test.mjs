import test from 'node:test';
import assert from 'node:assert/strict';
import {guideProgress, horizontalPlacement, muralTransfer, introReading, guideHeight, introGeometry, galleryGeometry, explorationGeometry, ambientProgress} from './progress.mjs';
import {a05Guide} from '../a05/content.mjs';
import {a06Guide} from '../a06/content.mjs';
import {a07Guide} from '../a07/content.mjs';

test('A05 follows the unchanged A04 endpoint and has a stable reading interval', () => {
  assert.equal(guideProgress(18, 18, 25).active, true);
  assert.equal(guideProgress(18.8, 18, 25).entry, 1);
  assert.equal(guideProgress(19.2, 18, 25).introduction, 1);
  assert.equal(guideProgress(21.2, 18, 25).scan, 0);
  assert.equal(guideProgress(24.4, 18, 25).scan, 1);
  assert.equal(guideProgress(25, 18, 25).handoff, 1);
  assert.equal(guideProgress(25, 18, 25).active, false);
  assert.equal(guideProgress(25, 18, 25).visible, true);
});

test('A05 and A06 have bounded lifetimes with only a short transition overlap', () => {
  for (const p of [18, 20, 24.99]) assert.equal(guideProgress(p,18,25).active,true);
  for (const p of [25, 28, 31.99]) assert.equal(guideProgress(p,25,32).active,true);
  assert.equal(guideProgress(25.2,18,25).visible,true);
  assert.equal(guideProgress(25.2,25,32).visible,true);
  assert.equal(guideProgress(25.4,18,25).visible,false);
  assert.equal(guideProgress(32,25,32).active,false);
});

test('A07 follows A06 and remains at the left edge through the story end', () => {
  assert.equal(guideProgress(31.99,25,32).active,true);
  assert.equal(guideProgress(32,25,32).active,false);
  assert.equal(guideProgress(32.2,25,32).visible,true);
  assert.equal(guideProgress(32.2,32,40).visible,true);
  assert.equal(guideProgress(32.4,25,32).visible,false);
  for (const p of [32,34,39.99]) assert.equal(guideProgress(p,32,40).active,true);
  assert.equal(guideProgress(39.4,32,40).scan,1);
  assert.equal(guideProgress(40,32,40).scan,1);
});

test('the same scroll position restores the same viewing position in either direction', () => {
  for (const screens of [21.2, 21.8, 22.8, 23.8, 24.4]) {
    const progress = guideProgress(screens, 18, 25).scan;
    const {x, travel} = horizontalPlacement(2600, 1440, progress);
    assert.equal(travel, 1160);
    assert.ok(Math.abs(x + 1160 * (1 - progress)) < 1e-9);
  }
  assert.deepEqual(horizontalPlacement(2600, 1440, 0), {travel:1160, x:-1160});
  assert.deepEqual(horizontalPlacement(2600, 1440, 1), {travel:1160, x:0});
});

test('reading groups preserve every paragraph and finish before the scan begins', () => {
  for (const guide of [a05Guide,a06Guide,a07Guide]) {
    const weights = [1, ...guide.introBeats.map(beat => beat.weight)];
    const count = weights.length;
    const length = guide.introLength || 3.2;
    const paragraphs = guide.introBeats.flatMap(beat => beat.paragraphs);
    assert.deepEqual(paragraphs, guide.introduction.split('\n\n').map((_, i) => i), 'every paragraph exactly once, in original order');
    for(let stage=0;stage<count;stage++){
      const progress=(weights.slice(0, stage).reduce((a,b)=>a+b,0)+weights[stage]/2)/weights.reduce((a,b)=>a+b,0);
      const reading=introReading(progress,weights);
      assert.equal(reading[stage].opacity,1);
      assert.equal(reading.filter(r=>r.opacity>0).length,1);
      assert.equal(guideProgress(guide.start+.55+progress*(length-1.1),guide.start,guide.end,length).scan,0);
      assert.deepEqual(reading,introReading(progress,weights));
    }
    for(let p=0;p<=1;p+=.001){
      const reading=introReading(p,weights);
      assert.ok(reading.reduce((sum,r)=>sum+r.opacity,0)>.99,'no blank reading gap');
      assert.ok(reading.every(r=>r.opacity>=0&&r.opacity<=1&&Math.abs(r.y)<=10));
    }
    assert.equal(guideProgress(guide.start+length,guide.start,guide.end,length).introduction,0);
    assert.equal(guideProgress(guide.start+length,guide.start,guide.end,length).scan,0);
    assert.ok(Math.abs(guideProgress((guide.start+length+guide.end-.6)/2,guide.start,guide.end,length).scan-.5)<1e-12);
    assert.equal(guideProgress(guide.end-.6,guide.start,guide.end,length).scan,1);
  }
});

test('complete INTRO, text exit, expansion, then right-to-left scan are separate states', () => {
  for (const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768],[1440,650]]) {
    for (const [index,ratio] of [6000/1617,2880/990,6000/1357].entries()) {
      const guide = [a05Guide,a06Guide,a07Guide][index], length = guide.introLength || 3.2;
      const intro = introGeometry(width,height,ratio);
      assert.ok(intro.left >= 0 && intro.left + intro.width <= width + 1e-9);
      assert.ok(intro.top >= intro.editorialTop + intro.editorialHeight);
      assert.ok(intro.top + intro.height < height - 60);
      assert.ok(Math.abs(intro.width/intro.height-ratio) < 1e-9);
      for(let i=0;i<=100;i++) {
        const state = guideProgress(guide.start+length-.7+i*.007,guide.start,guide.end,length);
        const layout = galleryGeometry(width,height,ratio,state);
        assert.equal(state.scan,0);
        if(state.galleryExpand>1e-9) assert.ok(state.introduction<1e-9,'no type while image expands');
        assert.ok(Math.abs(layout.width/layout.height-ratio)<1e-9);
      }
      const right=galleryGeometry(width,height,ratio,guideProgress(guide.start+length,guide.start,guide.end,length));
      const left=galleryGeometry(width,height,ratio,guideProgress(guide.end-.6,guide.start,guide.end,length));
      assert.ok(Math.abs(right.left+right.width-width)<1e-9);
      assert.ok(Math.abs(left.left)<1e-9);
      const transfer=muralTransfer(18,null,width,height,ratio,intro);
      for (const key of ['left','top','width','height']) assert.ok(Math.abs(transfer[key]-intro[key])<1e-9);
    }
  }
});

test('A08 creates actual right-side room with a fixed left-center anchor, never a crop', () => {
  const ratio=6000/1357;
  for(const reduced of [false,true]) for(const [w,h] of [[1440,900],[1024,768]]) {
    const start=explorationGeometry(w,h,ratio,40,reduced);
    assert.equal(start.height,guideHeight(w,h,reduced));
    let previous=start.width;
    for(let p=40;p<=41;p+=.01) {
      const layout=explorationGeometry(w,h,ratio,p,reduced);
      assert.equal(layout.left,0);
      assert.ok(Math.abs(layout.top+layout.height/2-h/2)<1e-9);
      assert.ok(Math.abs(layout.width/layout.height-ratio)<1e-9);
      assert.ok(layout.width<=previous+1e-9);previous=layout.width;
    }
    assert.ok(Math.abs(explorationGeometry(w,h,ratio,42,reduced).width-w*.7)<1e-9);
  }
  assert.equal(ambientProgress(18).weight,1);
  assert.equal(ambientProgress(26).weight,.8);
  assert.equal(ambientProgress(42).weight,.65);
  for(const p of [17,18,25.2,32.2,42]) assert.deepEqual(ambientProgress(p),ambientProgress(p));
});

test('gallery scale is shared across all three murals and reduced motion',()=>{
  for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
    assert.equal(guideHeight(width,height),height*(width<=1100?.86:.88));
    assert.equal(guideHeight(width,height,true),height*.82);
  }
});

test('an image already narrower than the viewport remains centered without invented travel', () => {
  assert.deepEqual(horizontalPlacement(1000, 1440, 0.5), {travel:0, x:220});
});
test('mural image grows from the projected wall to its formal right-edge placement',()=>{
  const wall={left:400,top:200,width:500,height:300};
  const from=muralTransfer(17.4,wall,1440,900,3,720);
  const end=muralTransfer(18,wall,1440,900,3,720);
  assert.deepEqual([from.left,from.top,from.width,from.height],[400,266.6666666666667,500,166.66666666666666]);
  assert.equal(from.width/from.height,3);
  assert.equal(end.left+end.width,1440);assert.equal(end.height,720);
  assert.equal(end.imageOpacity,1);assert.equal(end.backgroundOpacity,1);
});
