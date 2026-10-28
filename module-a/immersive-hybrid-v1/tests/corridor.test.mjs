import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleEntry,ENTRY_STOPS} from '../src/entry-path.mjs';
import {sampleGallery,CORRIDOR_KEYS,GALLERY_STOPS,corridorWeights,corridorPhase,createGalleryController,FIRST_MURAL,travelMs} from '../src/corridor-path.mjs';
test('gallery sampler shares the entry rail and all five entry stops',()=>{
 for(let i=0;i<=3000;i++)assert.deepEqual(sampleGallery(i/3000),sampleEntry(i/3000));
 assert.deepEqual(GALLERY_STOPS.slice(0,5),ENTRY_STOPS);assert.equal(travelMs(0,1),12400);assert.equal(travelMs(1,2),5000);
});
test('corridor is C1, reversible, eye level and FOV do not jump',()=>{
 for(const k of CORRIDOR_KEYS)assert.deepEqual(sampleGallery(1+k.t).position.map(n=>+n.toFixed(9)),k.position);
 const eps=1e-6;
 for(const k of [1,...CORRIDOR_KEYS.slice(1,-1).map(k=>1+k.t)])for(const f of ['position','target']){
  const a=sampleGallery(k-eps)[f],b=sampleGallery(k)[f],c=sampleGallery(k+eps)[f];
  for(let j=0;j<3;j++)assert.ok(Math.abs((b[j]-a[j])/eps-(c[j]-b[j])/eps)<.04,`${k} ${f}`);
 }
 for(let i=0;i<=4000;i++){const t=1+i/4000,s=sampleGallery(t),back=sampleGallery(2-(1-i/4000));assert.ok([...s.position,...s.target,s.fov].every(Number.isFinite));assert.ok(s.position[1]>=1.38-1e-12&&s.position[1]<=1.56);assert.equal(s.fov,48);for(const field of ['position','target'])s[field].forEach((n,j)=>assert.ok(Math.abs(n-back[field][j])<1e-10));}
 assert.deepEqual(FIRST_MURAL.position,[4.865,1.55,4.8]);assert.equal(FIRST_MURAL.rotationY,-Math.PI/2);
});
test('one rail clock controls every layer; loading cannot expose enhancement',()=>{
 assert.deepEqual([1,1.43,1.6,1.8,2].map(corridorPhase),['gate-interior','stage-turn','corridor-3d','corridor-hybrid','corridor-2_5d']);
 for(let i=0;i<=2000;i++){const t=i/1000,w=corridorWeights(t);assert.equal(w.foreground,1);assert.ok(w.mid>=0&&w.mid<=1);assert.ok(w.far>=0&&w.far<=1);assert.deepEqual(corridorWeights(t,false),{foreground:1,mid:0,far:0});if(t<=1.6)assert.ok(w.mid+w.far<1e-25);}
 assert.deepEqual(corridorWeights(2),{foreground:1,mid:1,far:1});assert.deepEqual(corridorWeights(0),{foreground:1,mid:0,far:0});
});
test('concurrent input consumed, invalid state rejected, failed move releases lock',async()=>{
 let done;const c=createGalleryController(()=>new Promise(r=>done=r));const pending=c.go('corridor-2_5d');assert.equal(c.busy,true);assert.equal(await c.go('gate-interior'),false);done();await pending;assert.equal(c.state,'corridor-2_5d');assert.equal(await c.go('bad'),false);
 const failed=createGalleryController(()=>{throw Error('test');});await assert.rejects(failed.go('stage-turn'));assert.equal(failed.busy,false);assert.equal(failed.state,'overview');
});
