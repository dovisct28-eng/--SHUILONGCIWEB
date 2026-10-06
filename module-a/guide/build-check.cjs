const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const baseline='20e6cd6deadf73e0c4532205babafe3d48b177f9',out=path.resolve('docs/validation/module-a-navigation-2026-10-06');
const files=['module-a/guide','module-a/a05','module-a/a06','module-a/a07','module-a/a08','module-a/navigation'].flatMap(dir=>fs.readdirSync(dir).filter(f=>/\.(mjs|cjs)$/.test(f)).map(f=>dir+'/'+f));
files.push('module-a/a01/app.mjs');
for(const file of files)execFileSync(process.execPath,['--check',file]);
const protectedPaths=['module-a/a01','module-a/a02','module-a/a03','module-a/a04','module-a/a05','module-a/a06','module-a/a07','module-a/a08','module-a/guide/controller.mjs','module-a/guide/styles.css','module-a/guide/progress.mjs','Mural-Exhibition','shuilong-temple','水龙祠壁画素材'];
// Only app.mjs navigation wiring is authorized in the opening directory.
assert.equal(execFileSync('git',['diff',baseline,'--',...protectedPaths,':(exclude)module-a/a01/app.mjs'],{maxBuffer:40*1024*1024}).toString(),'');
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
const resources=['01','02','05'].map(id=>{const file=`水龙祠壁画素材/网页展示图/mural-${id}-display.webp`,current=fs.readFileSync(file),original=execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:40*1024*1024});assert.equal(hash(current),hash(original));return{file,bytes:current.length,sha256:hash(current),unchanged:true};});
const archiveRefs=execFileSync('git',['rev-parse','module-a-lofi-final-v1.0^{}','archive/module-a-lofi']).toString().trim().split(/\r?\n/);assert.ok(archiveRefs.every(ref=>ref==='48f272497e86e4549c5bcd0dee275ff347171a3f'));
const html=fs.readFileSync('shuilong-temple/水龙祠-交互预览.html','utf8');execFileSync(process.execPath,['--input-type=module','--check'],{input:html.match(/<script type="module">([\s\S]*?)<\/script>/)[1],maxBuffer:30*1024*1024});
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'build-results.json'),JSON.stringify({baseline,syntaxFiles:files,protectedPaths,allowedWiring:'module-a/a01/app.mjs',protectedDiffEmpty:true,resources,archiveRefs,noBundler:true,modelRebuilt:false},null,2));console.log('PASS: native build/syntax, protected chapters/B/model/assets, original display hashes and fixed archive refs');
