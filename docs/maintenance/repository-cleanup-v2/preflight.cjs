// Read-only, complete recoverability preflight. Run before requesting deletion approval.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'../../..');process.chdir(root);
const plan=JSON.parse(fs.readFileSync(path.join(__dirname,'cleanup-plan.json'))),original=JSON.parse(fs.readFileSync(path.join(__dirname,'original-work-protection.json'))),status=new Map(original.map(f=>[f.path,f]));
const tagCommit=cp.execFileSync('git',['rev-parse',plan.tag+'^{commit}'],{encoding:'utf8'}).trim();if(tagCommit!==plan.head)throw Error('Tag mismatch');
const tree=new Map(cp.execFileSync('git',['ls-tree','-rlz',plan.tag],{encoding:'utf8',maxBuffer:20e6}).split('\0').filter(Boolean).map(line=>{const [meta,p]=line.split('\t');return[p,meta.split(/\s+/)[2]];}));
const deleting=new Set(plan.DELETE.map(f=>f.path)),verified=[],errors=[];
for(const f of plan.DELETE){const abs=path.resolve(root,f.path);try{
 if(!abs.startsWith(root+path.sep)||f.path.split('/').some(x=>['.git','.lofi-preview','.lofi-runtime'].includes(x)))throw Error('path out of authorized scope');
 const data=fs.readFileSync(abs),sha256=crypto.createHash('sha256').update(data).digest('hex');if(sha256!==f.sha256||data.length!==f.bytes)throw Error('file changed');
 let proof;
 if(f.git==='tracked'){
  const blob=crypto.createHash('sha1').update(Buffer.from('blob '+data.length+'\0')).update(data).digest('hex');let filtered=false;if(tree.get(f.path)!==blob){if(!f.path.endsWith('.html'))throw Error('pre-cleanup tag does not reproduce exact bytes');const restored=cp.execFileSync('git',['cat-file','--filters',plan.tag+':'+f.path],{maxBuffer:1e6});if(!restored.equals(data))throw Error('checkout filters do not reproduce exact bytes');filtered=true;}if(status.has(f.path))throw Error('original tracked user change');proof={method:'exact git blob at remotely verified tag',blob:tree.get(f.path),tag:plan.tag,checkoutFiltersForCRLF:filtered};
 }else if(f.source==='verified-identical-validation-copy'){
  if(deleting.has(f.recovery.path))throw Error('survivor scheduled for deletion');const copy=fs.readFileSync(f.recovery.path),copyHash=crypto.createHash('sha256').update(copy).digest('hex');if(sha256!==copyHash||copy.length!==data.length)throw Error('survivor mismatch');proof={method:'surviving exact copy',path:f.recovery.path,sha256:copyHash};
 }else if(f.source==='regenerable-v35-raw-capture'){
  if(f.git!=='ignored'||!f.path.startsWith('docs/validation/interior-visual-v3-5/local/'))throw Error('not an ignored generated V3.5 capture');proof={method:'generated local browser output',scripts:['browser-v3.5.cjs','integration-v3.5.cjs','audit-v3.5.cjs','switch-cases-v3.5.cjs'],retainedReports:'docs/validation/interior-visual-v3-5/',exactOriginalPixelsRecoverable:false};
 }else if(f.source==='rebuildable-cache'){
  if(!/^\.cache\/webpack\/remotion-development-4\.0\.535\/[^/]+\/(0|index)\.pack$/.test(f.path))throw Error('not specifically reviewed webpack pack');proof={method:'Webpack generated cache only',sourceNotDeleted:true,exactCacheBytesNeeded:false};
 }else throw Error('unknown recovery basis');
 verified.push({path:f.path,bytes:f.bytes,sha256,proof});
 }catch(e){errors.push({path:f.path,error:e.message});}}
const report={pass:errors.length===0,head:plan.head,tag:plan.tag,verifiedFiles:verified.length,logicalBytes:verified.reduce((n,f)=>n+f.bytes,0),survivorsAlsoDeleted:verified.filter(f=>f.proof.method==='surviving exact copy'&&deleting.has(f.proof.path)),originalTrackedUserChangesDeleted:verified.filter(f=>f.proof.method.startsWith('exact git')&&status.has(f.path)),errors,verified};
fs.writeFileSync(path.join(__dirname,'recoverability-preflight.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,verified:undefined},null,2));if(errors.length)process.exitCode=1;
