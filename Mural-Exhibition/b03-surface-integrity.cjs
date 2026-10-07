const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..'),baseline='2cae6f06e4055cebf48b3bdd241906ef88a0b161';
const git=(...args)=>cp.execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const tracked=git('-c','core.quotepath=false','ls-files','module-a','Mural-Exhibition/public/b01','Mural-Exhibition/public/gallery','Mural-Exhibition/public/b03','Mural-Exhibition/public/assets').split('\n').filter(Boolean);
const extra=['Mural-Exhibition/server.js','Mural-Exhibition/gallery-store.cjs','Mural-Exhibition/public/character-study.mjs','Mural-Exhibition/public/b01.css','Mural-Exhibition/public/gallery.css','Mural-Exhibition/public/gallery.html','Mural-Exhibition/public/gallery-admin.mjs','Mural-Exhibition/public/gallery-panorama.mjs','Mural-Exhibition/public/figure-stage.mjs','Mural-Exhibition/public/orbit-layout.mjs'];
const report={baseline,protected:[],preexistingRenamedFolder:'Local 08_上层猖兵 maps to baseline 10_上层猖兵; exact bytes compared. No rename is included in this task.',localOnlyFigure:null,archiveRefs:{}};
for(const basePath of [...new Set([...tracked,...extra])]) {
 const localPath=basePath.replace('/assets/10_上层猖兵/','/assets/08_上层猖兵/'),file=path.join(repo,localPath);
 assert.ok(fs.existsSync(file),localPath);const bytes=fs.readFileSync(file);
 // Git blob comparison ignores line-ending conversion only for text source files.
 const current=git('hash-object','--path='+basePath,file),expected=git('rev-parse',`${baseline}:${basePath}`);
 assert.equal(current,expected,`Protected file changed: ${localPath}`);
 report.protected.push({path:localPath,baselinePath:basePath,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),gitBlob:current,unchanged:true});
}
const local=path.join(__dirname,'public/assets/05_北门雷五猖/figure.png');
if(fs.existsSync(local)){const bytes=fs.readFileSync(local);report.localOnlyFigure={path:'Mural-Exhibition/public/assets/05_北门雷五猖/figure.png',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),status:'Preexisting untracked author resource; tested locally, excluded from delivery'};}
for(const ref of ['refs/tags/module-a-lofi-final-v1.0','refs/heads/archive/module-a-lofi']) {const sha=git('rev-parse',ref+'^{commit}');assert.equal(sha,'48f272497e86e4549c5bcd0dee275ff347171a3f');report.archiveRefs[ref]=sha;}
const out=path.join(repo,'docs/validation/b03-hf-03/asset-integrity.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(`Protected ${report.protected.length} files and fixed archive refs: PASS`);
