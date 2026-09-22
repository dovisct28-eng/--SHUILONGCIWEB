import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveA03State, A03_START, A03_SCREENS } from './progress.mjs';
import { createMuralPresentation } from '../../shuilong-temple/narrative-markers.mjs';

test('A03 leaves the accepted A01 and entire A02 interval unchanged', () => {
  for (const height of [768,900,1024,1080]) for (const screens of [0,5.7,6.7,8.7,A03_START]) {
    const state = deriveA03State(screens*height,height);
    assert.equal(state.takeover,0);
    assert.equal(state.text,0);
    assert.equal(state.composition,0);
    assert.equal(state.handoff,0);
    assert.equal(state.secondary,1);
  }
});

test('theme has a stable reading interval before preparing the next route', () => {
  const at = offset => deriveA03State((A03_START+offset)*1000,1000);
  for (const offset of [1.1,1.5,2]) {
    const s=at(offset);
    assert.equal(s.text,1); assert.equal(s.composition,1);
    assert.equal(s.secondary,0); assert.equal(s.handoff,0);
    assert.equal(s.phase,'a03-reading');
  }
  const end=at(A03_SCREENS);
  assert.equal(end.text,0); assert.equal(end.composition,0);
  assert.equal(end.handoff,1); assert.equal(end.phase,'a03-handoff');
  assert.ok(at(.7).text>0 && at(.7).text<1);
  assert.ok(at(2.5).text>0 && at(2.5).text<1);
});

test('arbitrary forward/reverse jumps and viewport changes are deterministic', () => {
  const stops=[0,10.2,10.4,10.9,11.5,12.7,13.2];
  const states=stops.map(s=>deriveA03State(s*900,900));
  assert.deepEqual(stops.toReversed().map(s=>deriveA03State(s*900,900)).reverse(),states);
  for(const height of [768,1024,1080]) {
    const s=deriveA03State(11.7*height,height);
    assert.equal(s.text,1); assert.equal(s.secondary,0);
  }
});

test('marker API hides secondary labels AND their SVG lines/dots, then restores them', () => {
  const original=globalThis.document;
  const element=()=>({style:{},dataset:{},attrs:{},setAttribute(k,v){this.attrs[k]=String(v);}});
  globalThis.document={body:{classList:{toggle(){}}}};
  try {
    const pins=Array.from({length:5},(_,i)=>({m:{id:`mural-0${i+1}`,label:`${i+1}`},button:element(),line:element(),dot:element()}));
    const api=createMuralPresentation(pins,element());
    const points=pins.map((p,i)=>({id:p.m.id,x:200,y:150+i*55}));
    const base={visibility:1,emphasis:1,coreIds:['mural-01','mural-02','mural-05']};
    api.set({...base,secondaryVisibility:0});api.update(points,800,700);
    for(const p of [pins[2],pins[3]]) {
      assert.equal(p.button.hidden,true);assert.equal(p.button.attrs['aria-hidden'],'true');
      assert.equal(p.line.style.display,'none');assert.equal(p.dot.style.display,'none');
    }
    api.set(base);api.update(points,800,700);
    assert.ok(pins.every(p=>!p.button.hidden && p.line.style.display==='' && p.dot.style.display===''));
  } finally { globalThis.document=original; }
});
