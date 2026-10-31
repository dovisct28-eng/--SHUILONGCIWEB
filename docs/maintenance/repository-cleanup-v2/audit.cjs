// File-level audit. No directory deletion, Git clean, object pruning or history rewrite.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),out=__dirname,tag='pre-repository-cleanup-v2-2026-10-31';
process.chdir(root);
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8',maxBuffer:100e6}).trimEnd();
const list=(...a)=>git(...a).split('\0').filter(Boolean);
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const json=(f,v)=>fs.writeFileSync(path.join(out,f),JSON.stringify(v,null,2)+'\n');
function category(p){const e=path.extname(p).toLowerCase();return /\.(png|jpe?g|webp|gif|tiff?|svg|avif)$/.test(e)?'image':/\.(mp4|webm|mov|mkv)$/.test(e)?'video':/\.(glb|gltf|obj|fbx|blend)$/.test(e)?'model':/\.(m?js|cjs|css|html|py|ps1|bat|ts|tsx|jsx)$/.test(e)?'code':/\.(md|txt|json|pdf|docx|pptx|csv)$/.test(e)?'document':'other';}
function scan(){const result=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name),r=path.relative(root,p).replaceAll('\\','/');if(['.git','.lofi-preview','.lofi-runtime'].includes(r)||e.isSymbolicLink())continue;if(e.isDirectory())walk(p);else if(e.isFile())result.push({path:r,bytes:fs.statSync(p).size,category:category(r)});}}walk(root);return result;}
function summarize(files,tracked){const cats={};for(const f of files){const c=cats[f.category]??={count:0,bytes:0};c.count++;c.bytes+=f.bytes;}return{fileCount:files.length,logicalBytes:files.reduce((n,f)=>n+f.bytes,0),trackedPresentCount:files.filter(f=>tracked.has(f.path)).length,trackedPresentBytes:files.filter(f=>tracked.has(f.path)).reduce((n,f)=>n+f.bytes,0),nonGitFileCount:files.filter(f=>!tracked.has(f.path)).length,nonGitLogicalBytes:files.filter(f=>!tracked.has(f.path)).reduce((n,f)=>n+f.bytes,0),categories:cats};}
if(process.argv[2]==='inventory'){
 if(fs.existsSync(path.join(out,'before.json')))throw Error('Baseline exists; do not overwrite original state');
 const tracked=new Set(list('ls-files','-z')),untracked=new Set(list('ls-files','--others','--exclude-standard','-z')),ignored=new Set(list('ls-files','--others','--ignored','--exclude-standard','-z'));
 const status=list('status','--porcelain=v1','-z','--untracked-files=no'),changed=new Set(status.map(s=>s.slice(3)));
 const files=scan().map(f=>({...f,git:tracked.has(f.path)?'tracked':ignored.has(f.path)?'ignored':'untracked'}));
 const protectedFiles=[...changed,...untracked].filter(p=>!p.startsWith('docs/maintenance/repository-cleanup-v2/')).map(p=>fs.existsSync(p)?{path:p,exists:true,bytes:fs.statSync(p).size,sha256:hash(p)}:{path:p,exists:false});
 const dirs={};for(const f of files){const k=f.path.startsWith('docs/validation/')?f.path.split('/').slice(0,3).join('/'):f.path.split('/')[0];const d=dirs[k]??={count:0,bytes:0};d.count++;d.bytes+=f.bytes;}
 const before={head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),remote:git('rev-parse','origin/feature/shuilongci-hybrid-gallery-v1'),divergence:git('rev-list','--left-right','--count','HEAD...origin/feature/shuilongci-hybrid-gallery-v1'),worktrees:git('worktree','list','--porcelain'),status,trackedIndexCount:tracked.size,missingTracked:[...tracked].filter(p=>!fs.existsSync(p)),summary:summarize(files,tracked),directories:dirs,files};
 json('before.json',before);json('original-work-protection.json',protectedFiles);
 console.log(JSON.stringify({summary:before.summary,largestDirectories:Object.entries(dirs).sort((a,b)=>b[1].bytes-a[1].bytes).slice(0,20)},null,2));
}else if(process.argv[2]==='plan'){
 const b=JSON.parse(fs.readFileSync(path.join(out,'before.json'))),protectedFiles=new Set(JSON.parse(fs.readFileSync(path.join(out,'original-work-protection.json'))).map(f=>f.path));
 const currentKeep=new Set(['02-third-after.webp','04-fourth-after.webp','05-second-dark.webp','06-second-title.webp','07-a03-entry.webp','09-fifth-full.webp','10-case-b-third.webp','11-case-b-fourth.webp','12-route-selector.webp']);
 const sourceFiles=b.files.filter(f=>['code','document'].includes(f.category)&&!f.path.startsWith('docs/validation/')&&!f.path.startsWith('docs/maintenance/')&&!f.path.includes('node_modules/')&&!f.path.startsWith('tmp/')&&f.bytes<4e6);
 const sources=sourceFiles.map(f=>({path:f.path,text:fs.readFileSync(f.path,'utf8').replaceAll('\\\\','/')}));
 const keep=[],del=[],review=[];
 const oldEntries=new Set(['v32.html','v33.html','v34.html'].map(n=>'module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/'+n));
 const representatives=new Set();
 // Retain one already-selected historical image per stage as a compact design evolution record.
 for(const f of b.files){if(f.git==='tracked'&&f.path.startsWith('docs/validation/')&&f.category==='image'&&/\/selected\//.test(f.path)&&!f.path.includes('interior-visual-v3-5/')){const stage=f.path.split('/')[2];if(!representatives.has(stage))representatives.add(stage);else continue;keep.push({path:f.path,reason:'historical selected design evolution representative'});}}
 const selected=new Set(keep.map(f=>f.path));
 for(const f of b.files){let reason,refs=[];
  if(protectedFiles.has(f.path)){review.push({...f,reason:'pre-existing user work/untracked file; preserved unless separately proven reproducible or identical recoverable duplicate'});continue;}
  if(f.path.startsWith('docs/maintenance/repository-cleanup-v2/'))continue;
  if(f.git==='tracked'&&f.path.startsWith('docs/validation/')&&['image','video'].includes(f.category)&&!f.path.endsWith('.svg')){
   if(selected.has(f.path)||f.path.includes('interior-visual-v3-5/selected/')&&currentKeep.has(path.basename(f.path))){if(!selected.has(f.path))keep.push({...f,reason:'current V3.5 selected evidence'});continue;}
   // Literal runtime/build inputs are protected. Test output paths alone do not imply a runtime dependency.
   refs=sources.filter(s=>!/(?:check|capture|evidence|browser|contact|performance|audit|test|prepare|build|boards)/i.test(path.basename(s.path))&&(s.text.includes(f.path)||s.text.includes('../'+f.path))).map(s=>s.path);
   if(refs.length){keep.push({...f,reason:'source reference requires retention',refs});continue;}
   reason='superseded/redundant browser validation media; technical reports retained; restored from pre-cleanup tag';
  }else if(oldEntries.has(f.path)){reason='retired standalone V3.2–V3.4 HTML; V3.5 formal entry and reusable controllers retained';}
  if(reason){del.push({...f,sha256:hash(f.path),reason,source:f.path.startsWith('docs/validation/')?'tracked-validation':'retired-prototype',recovery:{tag,commit:b.head,path:f.path},refs});}
  else if(!selected.has(f.path))keep.push({...f,reason:f.path.startsWith('Mural-Exhibition/')?'module B protected':f.path.startsWith('module-a/')||f.path.startsWith('shuilong-temple/')?'runtime/build/reusable source protected; no version-name deletion':'source/research/reference retained'});
 }
 // Cache paths are generated by webpack and not runtime inputs. Preserve all other untracked files.
 for(const f of b.files.filter(f=>f.path.startsWith('.cache/webpack/')&&f.path.endsWith('.pack'))){const p=review.findIndex(x=>x.path===f.path);if(p>=0)review.splice(p,1);del.push({...f,sha256:hash(f.path),source:'rebuildable-cache',reason:'Webpack Remotion development cache; regenerated by development build',recovery:{method:'restart Remotion development build; no unique source data'}});}
 const plan={head:b.head,tag,KEEP:keep,DELETE:del,REVIEW:review,expectedLogicalBytes:del.reduce((n,f)=>n+f.bytes,0),scope:'No .git, .lofi-preview, .lofi-runtime, original/user source deletion; prototype-specific tests are retired only with replacement current-entry coverage'};
 json('cleanup-plan.json',plan);json('preserved-files.json',{important:[{path:'.lofi-preview/',reason:'immutable fixed worktree excluded'},{path:'.lofi-runtime/',reason:'launcher state excluded'},{path:'module-a/',reason:'all formal controllers, images, imports and legacy runtime retained except explicitly retired HTML'},{path:'shuilong-temple/',reason:'Combined B GLB and complete build chain'},{path:'Mural-Exhibition/',reason:'all B source and character assets; original user edits excluded from commit'},{path:'水龙祠壁画素材/',reason:'original masters and real mural derivatives'},{path:'相关文献/',reason:'original research'}],files:keep,review});
 console.log(JSON.stringify({KEEP:keep.length,DELETE:del.length,REVIEW:review.length,bytes:plan.expectedLogicalBytes,deletedCategories:summarize(del,new Set())},null,2));
}else if(process.argv[2]==='delete'){
 const p=JSON.parse(fs.readFileSync(path.join(out,'cleanup-plan.json')));if(git('rev-parse',tag+'^{commit}')!==p.head)throw Error('Recovery tag mismatch');const remote=git('ls-remote','origin','refs/tags/'+tag,'refs/tags/'+tag+'^{}');if(!remote.includes(p.head))throw Error('Remote tag not verified');
 const proof=JSON.parse(fs.readFileSync(path.join(out,'recoverability-preflight.json')));if(!proof.pass||proof.head!==p.head||proof.verifiedFiles!==p.DELETE.length)throw Error('Complete preflight required');const verified=new Map(proof.verified.map(f=>[f.path,f]));for(const f of p.DELETE){if(verified.get(f.path)?.sha256!==f.sha256)throw Error('Plan differs from preflight '+f.path);}
 const deleting=new Set(p.DELETE.map(f=>f.path));for(const f of p.DELETE.filter(f=>f.source==='verified-identical-validation-copy')){if(deleting.has(f.recovery.path)||hash(f.recovery.path)!==f.sha256)throw Error('Duplicate survivor invalid '+f.path);}
 const deleted=[];try{for(const f of p.DELETE){const absolute=path.resolve(root,f.path);if(!absolute.startsWith(root+path.sep)||f.path.split('/').some(x=>['.git','.lofi-preview','.lofi-runtime'].includes(x)))throw Error('Unsafe path '+f.path);if(hash(absolute)!==f.sha256)throw Error('File changed '+f.path);fs.unlinkSync(absolute);deleted.push(f);}}finally{json('deleted-files.json',deleted);}
 console.log('Deleted files',deleted.length,'logical bytes',deleted.reduce((n,f)=>n+f.bytes,0));
}else if(process.argv[2]==='verify-protection'){
 const p=JSON.parse(fs.readFileSync(path.join(out,'original-work-protection.json'))),d=new Set(JSON.parse(fs.readFileSync(path.join(out,'deleted-files.json'))).map(f=>f.path));let n=0;for(const f of p){if(d.has(f.path))continue;if(fs.existsSync(f.path)!==f.exists||f.exists&&hash(f.path)!==f.sha256)throw Error('Original user work changed '+f.path);n++;}console.log('PASS original work protected',n);
}else if(process.argv[2]==='statistics'){
 const b=JSON.parse(fs.readFileSync(path.join(out,'before.json'))),d=JSON.parse(fs.readFileSync(path.join(out,'deleted-files.json'))),files=scan(),tracked=new Set(list('ls-files','-z'));
 const beforePaths=new Set(b.files.map(f=>f.path)),deletedBytes=d.reduce((n,f)=>n+f.bytes,0),statsPath='docs/maintenance/repository-cleanup-v2/statistics.json';
 let self=files.find(f=>f.path===statsPath);if(!self){self={path:statsPath,bytes:0,category:'document'};files.push(self);}
 const tree=git('ls-tree','-rl',tag).split('\n').filter(Boolean),beforeIndexBytes=tree.reduce((n,line)=>n+Number(line.split('\t')[0].trim().split(/\s+/)[3]),0);
 const index=git('ls-files','-s').split('\n').filter(Boolean),hashes=index.map(line=>line.split(/\s+/)[1]);const sizes=cp.execFileSync('git',['cat-file','--batch-check=%(objectsize)'],{input:hashes.join('\n')+'\n',encoding:'utf8',maxBuffer:5e6}).trim().split('\n').map(Number),indexBytes=sizes.reduce((a,b)=>a+b,0);
 let result;for(let i=0;i<10;i++){const after=summarize(files,tracked),added=files.filter(f=>!beforePaths.has(f.path));result={scope:'logical regular-file sizes excluding .git, .lofi-preview and .lofi-runtime; includes dependencies, ignored and untracked local files; not NTFS allocated bytes',before:{...b.summary,trackedIndexCount:b.trackedIndexCount,trackedIndexBlobBytes:beforeIndexBytes,missingTracked:b.missingTracked},after:{...after,trackedIndexCount:tracked.size,trackedIndexBlobBytes:indexBytes,missingTracked:[...tracked].filter(p=>!fs.existsSync(p))},deleted:{...summarize(d,new Set()),logicalBytes:deletedBytes},added:{files:added.length,logicalBytes:added.reduce((n,f)=>n+f.bytes,0),reportsAndValidationBytes:files.filter(f=>f.path.startsWith('docs/maintenance/repository-cleanup-v2/')).reduce((n,f)=>n+f.bytes,0)},netLogicalBytesFreed:b.summary.logicalBytes-after.logicalBytes,history:'Git objects, refs for existing tags/archives and worktrees were not removed or rewritten. Current checkout size only; no Git history size saving claimed.',measurementNote:'Includes statistics.json by stable byte count. Index metrics use Git blob sizes; trackedPresent uses actual worktree bytes. Existing user-deleted files remain unstaged and are not attributed to cleanup.'};const encoded=JSON.stringify(result,null,2)+'\n',bytes=Buffer.byteLength(encoded);if(self.bytes===bytes){fs.writeFileSync(path.join(out,'statistics.json'),encoded);break;}self.bytes=bytes;}
 console.log(JSON.stringify({before:b.summary.logicalBytes,after:result.after.logicalBytes,deletedBytes,netFreed:result.netLogicalBytesFreed},null,2));
}else throw Error('Use inventory | plan | delete | verify-protection | statistics');
