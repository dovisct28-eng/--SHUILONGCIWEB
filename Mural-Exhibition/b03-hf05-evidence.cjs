// Publish only selected actual runtime captures; keep recordings/regressions local.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/validation/b03-hf-05'),baseline='9bf45d4e9d9d911a603d40fc590f41563fcdc874';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16e6}).trim();
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const prior=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/b03-hf-04/asset-integrity.json')));
 const protectedFiles=prior.protected.map(entry=>{const bytes=fs.readFileSync(path.join(root,entry.path));assert.equal(sha(bytes),entry.sha256,entry.path);return {...entry,unchanged:true};});
 const archives=Object.fromEntries(['module-a-lofi-final-v1.0','archive/module-a-lofi'].map(ref=>{const value=git(['rev-parse',ref+'^{commit}']);assert.equal(value,'48f272497e86e4549c5bcd0dee275ff347171a3f');return [ref,value];}));
 fs.writeFileSync(path.join(out,'asset-integrity.json'),JSON.stringify({baseline,protected:protectedFiles,archives,notes:'Same local asset bytes as the HF04 evidence, including the preexisting ID10→08 relocation. Module A, source/layout algorithms, camera DOM/CSS/lifecycle protected by unit tests. Existing archive launcher edits remain outside this commit.'},null,2));
 const suites={core:'core/results.json',stage:'core/stage-results.json',b01:'b01/results.json',b02:'b02/results.json',theatre:'theatre/results.json',layout:'layout/results.json',surface:'surface/results.json',motion:'motion/results.json'};
 const summary={baseline,unitTests:28,build:'Native static frontend + Express; no bundler. HTML/module/CJS syntax, actual shader compilation and diff checks.',suites:{}};
 for(const [name,file]of Object.entries(suites)){const result=JSON.parse(fs.readFileSync(path.join(out,'local',file)));assert.ok(!result.failure,name+': '+result.failure);assert.deepEqual(result.errors||[],[],name);summary.suites[name]={pass:true,views:result.views?.length||result.formal?.length,checks:result.checks||result.functional,source:'local/'+file};if(name==='motion'){summary.gestures=result.gestures;summary.motion={firstFocusMs:result.firstFocusMs,sampleCount:result.samples.length,observedMs:result.samples.at(-1).ms,ids:[...new Set(result.samples.map(x=>x.id))],completedSwitches:result.resources.length,resourceSamples:result.resources,exit:result.exit,material:result.material,recording:'local/motion/theatre-next-review-15s.webm',camera:'Synthetic landmarks only; physical hardware not verified.'};}}
 fs.writeFileSync(path.join(out,'test-results.json'),JSON.stringify(summary,null,2));
 const sharp=require('sharp');fs.mkdirSync(path.join(out,'selected'),{recursive:true});
 const names={'01-default':'01-default','01-focus':'01-focus','01-switching':'01-switching','01-revealed':'01-revealed','01-peak-1366x768':'peak-1366x768','01-default-1280x800':'default-1280x800'};
 const files=[];
 for(const [name,source]of Object.entries(names)){const src=path.join(out,'local/motion',source+'.png'),dest=path.join(out,'selected',name+'.webp');await sharp(src).webp({lossless:true,effort:6}).toFile(dest);const a=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(dest).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(a,b);const bytes=fs.readFileSync(dest);files.push({file:'selected/'+name+'.webp',source:'local/motion/'+source+'.png',width:a.info.width,height:a.info.height,bytes:bytes.length,sha256:sha(bytes),rgbaIdentical:true});}
 fs.writeFileSync(path.join(out,'evidence-publication.json'),JSON.stringify({files,totalBytes:files.reduce((a,b)=>a+b.bytes,0),video:'Only local; browser-only 01/05 sequence and synthetic hand input are explicitly documented.'},null,2));
 console.log(JSON.stringify({protected:protectedFiles.length,selected:files.length,bytes:files.reduce((a,b)=>a+b.bytes,0),suites:Object.keys(suites).length}));
})().catch(error=>{console.error(error);process.exitCode=1;});
