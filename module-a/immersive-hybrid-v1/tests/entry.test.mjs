import test from 'node:test';
import assert from 'node:assert/strict';
import {ENTRY_STOPS,PATH_KEYS,sampleEntry,createEntryController} from '../src/entry-path.mjs';
test('rail has exact deterministic stops, reversible sampling and continuous derivatives',()=>{
  for(const key of PATH_KEYS){const s=sampleEntry(key.t);for(const field of ['position','target'])s[field].forEach((v,i)=>assert.ok(Math.abs(v-key[field][i])<1e-10));assert.equal(s.fov,key.fov);}
  const epsilon=1e-6;
  for(const key of PATH_KEYS.slice(1,-1)){const a=sampleEntry(key.t-epsilon),b=sampleEntry(key.t),c=sampleEntry(key.t+epsilon);for(const field of ['position','target'])for(let i=0;i<3;i++)assert.ok(Math.abs((b[field][i]-a[field][i])/epsilon-(c[field][i]-b[field][i])/epsilon)<.06,'C1 rail');}
  for(let i=0;i<=1000;i++){const a=sampleEntry(i/1000),b=sampleEntry(1-(1000-i)/1000);a.position.forEach((n,j)=>assert.ok(Math.abs(n-b.position[j])<1e-10));assert.ok([...a.position,...a.target,a.fov].every(Number.isFinite));assert.ok(a.fov>=32&&a.fov<=48);}
});
test('gate eye stays inside actual aperture and stops before stage back wall',()=>{
  for(let i=0;i<=3000;i++){const {position:[x,y,z]}=sampleEntry(i/3000);if(i/3000>=.65&&z>=11.65&&z<=12.4){assert.ok(Math.abs(x)<.6);assert.ok(y>.25&&y<1.53);}}
  const end=sampleEntry(1);assert.ok(end.position[2]>10.155+.5);assert.ok(end.target[0]>end.position[0]);
});
test('controller consumes concurrent input, preserves location on failure and unlocks',async()=>{
  let finish;const c=createEntryController(()=>new Promise(r=>finish=r));const first=c.step(1);assert.equal(c.busy,true);assert.equal(await c.go('threshold'),false);finish();assert.equal(await first,true);assert.equal(c.state,'approach');assert.equal(await c.go('bad'),false);
  const bad=createEntryController(()=>{throw Error('lost context');});await assert.rejects(()=>bad.step(1));assert.equal(bad.state,'overview');assert.equal(bad.busy,false);assert.deepEqual(ENTRY_STOPS.map(s=>s.id),['overview','approach','gate-close','threshold','gate-interior']);
});
