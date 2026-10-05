const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const baseline='33f3cfdd2a766c1673662666da07ad58c50be624',out=path.resolve('docs/validation/a04-full-roof-2026-10-05');
const files=['module-a/a03/cutaway.mjs','module-a/a04/cutaway-state.mjs','module-a/a04/state.test.mjs','module-a/a04/full-roof-check.cjs'];
(async()=>{
  for(const file of files)execFileSync(process.execPath,['--check',file]);
  const html=fs.readFileSync('shuilong-temple/水龙祠-交互预览.html','utf8');
  execFileSync(process.execPath,['--input-type=module','--check'],{input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],maxBuffer:30*1024*1024});
  const {inlineA02}=await import('../../shuilong-temple/inline-a02.mjs');
  let director=fs.readFileSync('shuilong-temple/director-light.mjs','utf8');
  director=director.replace(/import \{([^}]+)\} from '\.\.\/module-a\/visual-director\/state\.mjs';/,(_,names)=>`const {${names}}=(()=>{${fs.readFileSync('module-a/visual-director/state.mjs','utf8').replaceAll('export ','')}\nreturn {${names}};})();`);
  assert.equal(JSON.parse(html.match(/const inlineDirector=("(?:\\.|[^"\\])*");/)[1]),inlineA02(director),'offline preview matches current cutaway source');
  const protectedFiles=['shuilong-temple/shuilong-temple.glb','shuilong-temple/model-source.js','shuilong-temple/model-info.json','shuilong-temple/mural-locations.json','module-a/a04/path.mjs','module-a/a04/controller.mjs','module-a/a04/styles.css','module-a/a04/timing.mjs','module-a/a01','module-a/a02','module-a/a05','module-a/a06','module-a/a07','module-a/a08','module-a/guide','Mural-Exhibition','水龙祠壁画素材'];
  assert.equal(execFileSync('git',['diff',baseline,'--',...protectedFiles]).toString(),'');
  const archiveRefs=execFileSync('git',['rev-parse','module-a-lofi-final-v1.0^{}','archive/module-a-lofi']).toString().trim().split(/\r?\n/);
  assert.ok(archiveRefs.every(s=>s==='48f272497e86e4549c5bcd0dee275ff347171a3f'));
  fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'build-results.json'),JSON.stringify({baseline,syntaxFiles:files,htmlModule:true,offlineSourceMatches:true,protectedFiles,protectedDiffEmpty:true,archiveRefs,noBundler:true,modelRebuilt:false},null,2));
  console.log('PASS: module/inline syntax, offline source, protected resources and archive references.');
})().catch(e=>{console.error(e);process.exitCode=1});
