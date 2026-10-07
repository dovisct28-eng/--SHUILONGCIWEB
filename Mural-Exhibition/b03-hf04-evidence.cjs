// Curate actual browser captures; never modifies formal source assets.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/validation/b03-hf-04'),baseline='94e30cebe8ae7ca39235afd8513c86436c0a4bf8';
const sha=(b,type='sha256')=>crypto.createHash(type).update(b).digest('hex');
const blob=b=>sha(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b]),'sha1');
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16e6});
(async()=>{
 const tree=new Map(git(['ls-tree','-r','-z',baseline]).split('\0').filter(Boolean).map(line=>{const [head,p]=line.split('\t');return [p,head.split(' ')[2]];}));
 const prior=JSON.parse(fs.readFileSync(path.join(root,'docs/validation/b03-hf-03/asset-integrity.json')));
 const protectedFiles=prior.protected.map(entry=>{
  const p=entry.path,bytes=fs.readFileSync(path.join(root,p)),expected=tree.get(entry.baselinePath),raw=blob(bytes),normalized=bytes.includes(0)?raw:blob(Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')));
  assert.ok(raw===expected||normalized===expected,p);
  return {path:p,baselinePath:entry.baselinePath,bytes:bytes.length,sha256:sha(bytes),gitBlob:expected,unchanged:true};
 });
 const archives=Object.fromEntries(['module-a-lofi-final-v1.0','archive/module-a-lofi'].map(ref=>{const value=git(['rev-parse',ref+'^{commit}']).trim();assert.equal(value,'48f272497e86e4549c5bcd0dee275ff347171a3f');return [ref,value];}));
 fs.writeFileSync(path.join(out,'asset-integrity.json'),JSON.stringify({baseline,protected:protectedFiles,archives,notes:'Existing ID10→08 local rename is checked against original Git bytes; no user assets included or overwritten. Camera style/lifecycle and exact gesture handler protection run in b03-motion.test.mjs.'},null,2));
 const suites={core:'core/results.json',stage:'core/stage-results.json',b01:'b01/results.json',b02:'b02/results.json',theatre:'theatre-final/results.json',layout:'layout-final/results.json',surface:'surface-final/results.json',motion:'motion/results.json'};
 const summary={baseline,unitTests:25,build:'Native static modules + Express; no bundler. npm test includes HTML/module syntax and protected legacy equations.',suites:{}};
 for(const [name,file]of Object.entries(suites)){const result=JSON.parse(fs.readFileSync(path.join(out,'local',file)));assert.ok(!result.failure,name+': '+result.failure);assert.deepEqual(result.errors||[],[],name);summary.suites[name]={pass:true,views:result.views?.length||result.formal?.length,checks:result.checks||result.functional,source:'local/'+file};if(name==='motion'){summary.material=result.material;summary.motion={sampleCount:result.samples.length,observedMs:result.samples.at(-1).ms,firstDash:result.samples[0].dash,lastDash:result.samples.at(-1).dash,focusObserved:result.samples.some(x=>x.focus),exit:result.exit,switchResources:{textures:result.switchResources?.textures,cache:result.switchResources?.cache,panels:result.switchResources?.panels,svgs:result.switchResources?.svgs}};}}
 fs.writeFileSync(path.join(out,'test-results.json'),JSON.stringify(summary,null,2));
 const sharp=require('sharp');fs.mkdirSync(path.join(out,'selected'),{recursive:true});
 const names={
  'formal-01-default-1920x1080':'default-1920x1080',
  'formal-01-default-1440x900':'default-1440x900',
  'formal-01-panel-focus':'formal-01-panel-focus',
  'formal-01-switching':'formal-01-switching',
  'formal-01-revealed':'revealed-1440x900',
  'material-off':'material-off'
 };
 const files=[];
 for(const [name,source]of Object.entries(names)){
  const src=path.join(out,'local/motion',source+'.png'),dest=path.join(out,'selected',name+'.webp');
  await sharp(src).webp({lossless:true,effort:6}).toFile(dest);
  const a=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(dest).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(a,b);
  const bytes=fs.readFileSync(dest);files.push({file:'selected/'+name+'.webp',source:'local/motion/'+source+'.png',width:a.info.width,height:a.info.height,bytes:bytes.length,sha256:sha(bytes),rgbaIdentical:true});
 }
 fs.writeFileSync(path.join(out,'evidence-publication.json'),JSON.stringify({files,totalBytes:files.reduce((a,b)=>a+b.bytes,0),standard:'Standard reuses formal-01-default-1440x900.webp; no duplicate screenshot. Video and all repeated captures remain local.'},null,2));
 console.log(JSON.stringify({protected:protectedFiles.length,selected:files.length,bytes:files.reduce((a,b)=>a+b.bytes,0),suites:Object.keys(suites).length}));
})().catch(error=>{console.error(error);process.exitCode=1;});
