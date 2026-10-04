const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const out=path.resolve('docs/validation/a03-high-fidelity-2026-10-04');
const baseline='b6ce49f90383534bb85c30d1251d8d2dab6cec7f';
const files=['module-a/a01/app.mjs','module-a/a03/composition.mjs','module-a/a03/lighting.mjs','module-a/a03/progress.mjs','module-a/a03/view.mjs','module-a/a03/composition.test.mjs','module-a/a03/browser-check.cjs','module-a/a03/remaster-check.cjs','module-a/a03/build-check.cjs','module-a/a03/performance-check.cjs','module-a/a03/sync-preview.mjs','shuilong-temple/director-light.mjs','shuilong-temple/narrative-markers.mjs','shuilong-temple/inline-a02.mjs'];
for(const file of files)execFileSync(process.execPath,['--check',file]);
const html=fs.readFileSync('shuilong-temple/水龙祠-交互预览.html','utf8'),script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];execFileSync(process.execPath,['--input-type=module','--check'],{input:script,maxBuffer:30*1024*1024});
// A03 source and its controlled hooks are the only intentional chapter changes.
const protectedFiles=['shuilong-temple/shuilong-temple.glb','shuilong-temple/model-source.js','shuilong-temple/model-info.json','shuilong-temple/mural-locations.json','shuilong-temple/a01-environment.mjs','shuilong-temple/a02-light.mjs','module-a/a01/styles.css','module-a/a01/cinematic-state.mjs','module-a/a01/ink-scene.mjs','module-a/a02','module-a/a04','module-a/a05','module-a/a06','module-a/a07','module-a/a08','module-a/guide','Mural-Exhibition','水龙祠壁画素材'];
assert.equal(execFileSync('git',['diff',baseline,'--',...protectedFiles]).toString(),'');
const refs=execFileSync('git',['rev-parse','module-a-lofi-final-v1.0^{}','archive/module-a-lofi']).toString().trim().split(/\r?\n/);assert.ok(refs.every(s=>s==='48f272497e86e4549c5bcd0dee275ff347171a3f'));
fs.writeFileSync(path.join(out,'build-results.json'),JSON.stringify({syntaxFiles:files,htmlModule:true,protectedFiles,protectedDiffEmpty:true,archiveRefs:refs,noBundler:true,modelRebuilt:false},null,2));console.log('PASS: source syntax, inline module parse, protected resources and archive references.');
