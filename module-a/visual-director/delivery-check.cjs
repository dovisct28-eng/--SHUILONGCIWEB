const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const docs=['docs/A02_A08_VISUAL_DIRECTOR_BRIEF.md','docs/HIFI_VISUAL_SPEC.md','docs/DESIGN_SPEC.md','docs/CONTENT_MAP.md','docs/MODULE_A_ROADMAP.md',...['03','04','05','06','07','08'].map(n=>`docs/A${n}_PROTOTYPE.md`),'module-a/visual-director/fonts/README.md','docs/validation/module-a-visual-director-v2/README.md'];
let links=0;for(const file of docs){const data=fs.readFileSync(file),text=data.toString('utf8');assert.ok(Buffer.from(text).equals(data),`${file}: UTF-8`);assert.ok(!/^<<<<<<<|^>>>>>>>/m.test(text),`${file}: conflict`);for(const match of text.matchAll(/\]\(([^)]+)\)/g)){const target=match[1].replace(/^<|>$/g,'').split('#')[0];if(!target||/^[a-z]+:/i.test(target))continue;assert.ok(fs.existsSync(path.resolve(path.dirname(file),decodeURIComponent(target))),`${file}: missing ${target}`);links++;}}
const base='docs/validation/module-a-visual-director-v2',read=n=>JSON.parse(fs.readFileSync(path.join(base,n),'utf8'));
assert.equal(read('after/real-tour.json').length,20);assert.equal(read('review/results.json').sizes.length,4);assert.deepEqual(read('review/results.json').errors,[]);
for(const p of read('integrity.json').pixels){assert.equal(p.changed,0);assert.equal(p.maxDelta,0);}assert.ok(read('integrity.json').files.every(f=>f.unchanged));
assert.equal(fs.readdirSync(path.join(base,'boards')).filter(f=>f.endsWith('.png')).length,11);
assert.match(fs.readFileSync(path.join(base,'unit-results.txt'),'utf8'),/tests 75/);assert.match(fs.readFileSync(path.join(base,'unit-results.txt'),'utf8'),/fail 0/);
for(const n of ['a01','a02','a03','a04','a05','a06','a07','a08','guides','resilience','isolation'])assert.ok(fs.readdirSync(path.join(base,'regression',n)).some(f=>f.endsWith('.json')),n);
console.log(`PASS: ${docs.length} UTF-8 documents, ${links} local links, 11 boards, 20 real tour frames, four viewport reviews and complete validation evidence`);
