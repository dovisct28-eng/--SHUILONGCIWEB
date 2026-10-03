const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{PNG}=require('pngjs');
const out=path.resolve(process.env.A01_VALIDATION_DIR||'docs/validation/a01-cinematic-v2');
const points=[0,.05,.12,.20,.30,.40,.50,.60,.75,1];
const seek=async(p,s)=>{await p.evaluate(s=>scrollTo(0,s*innerHeight),s);await p.waitForTimeout(350);};
const ready=async p=>{await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});};
const read=p=>p.evaluate(()=>{const f=document.querySelector('iframe'),api=f.contentWindow.shuilongTemple,post=api.getA01PostState(),art=api.getA01ArtState();return {art,environment:api.getA01EnvironmentState(),line:api.getA01LineState(),post:post?{enabled:post.enabled,error:post.error,size:post.size,passes:post.passes}:null,stats:api.getA01RenderStats(),canvas:f.contentDocument.querySelectorAll('canvas').length,dimensions:[f.contentWindow.innerWidth,f.contentWindow.innerHeight]};});
const pure=s=>({art:s.art,environment:s.environment,line:s.line,post:s.post});
function compare(a,b){a=PNG.sync.read(a);b=PNG.sync.read(b);let max=0,sum=0,changed=0;for(let i=0;i<a.data.length;i+=4){const d=Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])));max=Math.max(max,d);if(d){sum+=d;changed++;}}return {max,changed,percent:changed/(a.width*a.height),mean:changed?sum/changed:0};}
(async()=>{fs.mkdirSync(path.join(out,'animation'),{recursive:true});const b=await chromium.launch({channel:'chrome'}),report={viewports:[],failures:[],errors:[]};try{
 for(const [width,height]of [[1440,900],[1920,1080],[1366,768],[1024,768]]){
  const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram|INVALID_FRAMEBUFFER/.test(m.text()))report.errors.push(m.text());});await p.goto('http://127.0.0.1:4173/module-a/a01/');await ready(p);
  const rows=[],forward=[];
  for(const progress of points){await seek(p,progress*5);const s=await read(p);assert.equal(s.canvas,1);assert.equal(s.post.error,null);assert.equal(s.art.aspect,s.dimensions[0]/s.dimensions[1]);const shot=await p.screenshot({path:path.join(out,'animation',`${Math.round(progress*100)}-${width}x${height}.png`)});forward.push({state:pure(s),shot});rows.push({progress,...s});}
  const reversal=[];for(let i=points.length-1;i>=0;i--){await seek(p,points[i]*5);assert.deepEqual(pure(await read(p)),forward[i].state);const reversed=await p.screenshot(),result=compare(reversed,forward[i].shot);
   // Two softly masked matte layers can round one channel differently on repaint.
   const lowRound=result.max<=3&&result.percent<.04&&result.mean<1.1;
   const sparseEdge=(result.max<=64&&result.percent<.001&&result.mean<4)||(result.max<=32&&result.percent<.005&&result.mean<2);
   if(!lowRound&&!sparseEdge&&result.max>1){fs.writeFileSync(path.join(out,'reverse-failed.png'),reversed);fs.writeFileSync(path.join(out,'forward-failed.png'),forward[i].shot);}
   if(width===1440&&points[i]===.60){fs.writeFileSync(path.join(out,'reverse-diagnostic.png'),reversed);fs.writeFileSync(path.join(out,'forward-diagnostic.png'),forward[i].shot);}
   assert.ok(lowRound||sparseEdge||result.max<=1,`reverse pixels ${points[i]} ${JSON.stringify(result)}`);reversal.push({progress:points[i],...result});}
  await seek(p,5.7);const hero=pure(await read(p));await seek(p,6.15);assert.deepEqual(pure(await read(p)),hero);await p.waitForTimeout(700);assert.deepEqual(pure(await read(p)),hero);
  await seek(p,2.5);const mid=pure(await read(p));await p.reload();await ready(p);await p.waitForTimeout(350);assert.deepEqual(pure(await read(p)),mid);
  await seek(p,14.5);assert.ok(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()));const skip=p.locator('[data-skip]');if(await skip.isVisible())await skip.click();await p.waitForTimeout(400);let s=await read(p);assert.equal(s.post.enabled,false);assert.equal(s.environment.visible,false);assert.equal(s.art.fov,34);assert.equal(s.art.heroWeight,0);
  await seek(p,5.7);assert.deepEqual(pure(await read(p)),hero);
  report.viewports.push({viewport:[width,height],rows,reversal,reading:true,reload:true,a04Exit:true});await p.close();
 }
 for(const mode of ['reduced','cinema-environment','post','far-image']){
  const p=await b.newPage({viewport:{width:1024,height:768},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  if(mode==='cinema-environment')await p.route('**/a01-environment.mjs',r=>r.abort());if(mode==='post')await p.route('**/a01-post.mjs',r=>r.abort());if(mode==='far-image')await p.route('**/a01-v2/*.webp',r=>r.abort());
  p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:4173/module-a/a01/');await ready(p);await seek(p,5.7);const s=await read(p);assert.equal(s.line.solid,1);assert.equal(s.canvas,1);if(mode==='reduced')assert.equal(s.line.depth,0);await p.screenshot({path:path.join(out,`${mode}-fallback.png`)});report.failures.push({mode,heroAvailable:true});await p.close();
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'cinematic-results.json'),JSON.stringify(report,null,2));console.log('PASS: 40 animation frames, numerical/pixel reversal, reload/reading/A04 cleanup, four fallbacks');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
