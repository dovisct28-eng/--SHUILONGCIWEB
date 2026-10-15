const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const {check}=require('./validate-v4-final.cjs');
test('native final timeline preserves all stable clips and rejects source, timing and audio regressions',()=>{
 const candidate=JSON.parse(fs.readFileSync(path.join(base,'planning/production-state-v4-final.json')));
 const baseline=JSON.parse(fs.readFileSync(path.join(base,'planning/production-state-v4.json')));
 assert.equal(check(candidate,baseline).status,'EDITORIAL_STRUCTURE_PASS');
 for(const mutate of [
  c=>{c.state.timeline.entries.find(x=>x.kind==='item'&&x.startFrame===270).sourceRange.start++;},
  c=>{c.state.timeline.entries.find(x=>x.kind==='item'&&x.startFrame===2340&&x.trackAlias==='V1').asset.id='674431d473';},
  c=>{c.itemDetails.find(x=>x.item.type==='audio').item.decibelAdjustment=-6;},
  c=>{c.closingAsset.properties.find(x=>x.key==='title').defaultValue='wrong';},
 ]){const bad=structuredClone(candidate);mutate(bad);assert.throws(()=>check(bad,baseline));}
});
test('final capture changes response text only and preserves V4 actions',()=>{
 const code=fs.readFileSync(path.join(__dirname,'capture-b02-final.cjs'),'utf8');
 assert.ok(code.includes("readFileSync(path.join(__dirname,'capture-b02-v4.cjs')"));
 assert.ok(code.includes("route.fulfill({response,body:modified})"));
 assert.ok(code.includes("replaceAll('数字化演绎内容','')"));
 assert.ok(!code.includes('blur('));assert.ok(!code.includes('writeFileSync(path.join(__dirname'));
});
test('closing overlay is transparent, staged and preserves original mural component',()=>{
 const code=fs.readFileSync(path.join(base,'motion-graphics/ClosingTitleV4.tsx'),'utf8');
 assert.ok(code.includes("background:'transparent'"));
 for(const n of [1,2,3])assert.ok(code.includes(`reveal(${n})`));
 assert.ok(code.includes('[d-fps,d-1]'));assert.ok(!code.includes('<Img'));assert.ok(!code.includes('filter:'));
});
test('compression is two-pass from the editor master without resize or frame-rate reduction',()=>{
 const code=fs.readFileSync(path.join(__dirname,'encode-v4-submission.py'),'utf8');
 for(const token of ["'-pass','1'","'-pass','2'","'-preset','slow'","'-profile:v','high'","'-level:v','4.1'","'-c','copy'","'-map_metadata','-1'","'-n'"])assert.ok(code.includes(token));
 assert.ok(!code.includes('scale='));assert.ok(code.includes("'-r','30'"));
 assert.ok(code.includes('assert not compressed.exists()'));
});
