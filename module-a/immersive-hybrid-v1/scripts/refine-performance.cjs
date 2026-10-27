// Same browser, viewport and navigation for the immutable V2.2 and current code.
// Diagnostic instrumentation is separate from uninstrumented timing runs.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'docs/validation/immersive-hybrid-v2-2-1');
fs.mkdirSync(path.join(out,'local'),{recursive:true});
const url='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/';
const baselineFiles=['src/corridor-layers.mjs','src/entry-main.mjs','src/temple-runtime.mjs','index.html'];
async function baseline(page){for(const f of baselineFiles){const body=execFileSync('git',['show','933a353:module-a/immersive-hybrid-v1/'+f],{cwd:root,maxBuffer:5e6});await page.route('**/immersive-hybrid-v1/'+f,r=>r.fulfill({contentType:f.endsWith('.html')?'text/html':'text/javascript',body}));}}
async function run(browser,version,diagnostic=false,warmCache=false){
 const context=await browser.newContext({viewport:{width:1440,height:900}}),p=await context.newPage();
 // Both routed and cache-disabled: no asymmetric route/cache policy.
 await p.route('**/*',r=>r.continue());if(version==='v22')await baseline(p);
 if(diagnostic)await context.addInitScript(()=>{
  window.__decodeEvents=[];const decode=createImageBitmap;window.createImageBitmap=async function(...a){const start=performance.now(),image=await decode(...a);window.__decodeEvents.push({start,ms:performance.now()-start,width:image.width,height:image.height});return image;};
  window.__glEvents=[];for(const name of ['compileShader','linkProgram','texImage2D','texSubImage2D','bufferData','getProgramParameter','getActiveUniform','getUniformLocation','getActiveAttrib','getShaderParameter']){
   const original=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...a){const start=performance.now();const result=original.apply(this,a);const ms=performance.now()-start;window.__glEvents.push({name,start,ms});return result;};
  }
  window.__longTasks=[];new PerformanceObserver(list=>window.__longTasks.push(...list.getEntries().map(e=>({start:e.startTime,ms:e.duration})))).observe({type:'longtask',buffered:true});
 });
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const started=Date.now();await p.goto(url);await p.waitForFunction(()=>window.hybrid?.ready&&hybrid.model.hybrid.status==='ready',{timeout:60000});
 if(warmCache){await p.reload();await p.waitForFunction(()=>window.hybrid?.ready&&hybrid.model.hybrid.status==='ready',{timeout:60000});}
 await p.evaluate(()=>hybrid.go('gate-interior'));
 const rows=[];for(let cycle=0;cycle<2;cycle++){
  for(const state of ['corridor-3d','corridor-hybrid','corridor-2_5d']){
   const start=await p.evaluate(()=>document.querySelector('iframe').contentWindow.performance.now());await p.evaluate(s=>hybrid.go(s),state);
   rows.push({cycle:cycle+1,state,start,end:await p.evaluate(()=>document.querySelector('iframe').contentWindow.performance.now()),metrics:await p.evaluate(()=>hybrid.metrics())});
  }
  await p.evaluate(()=>hybrid.go('gate-interior'));
 }
 const result={version,diagnostic,warmCache,cachePolicy:'HTTP cache disabled in both variants; warmCache reload uses browser process GPU/OS caches only',elapsedMs:Date.now()-started,rows,errors,
  details:await p.evaluate(()=>{const w=document.querySelector('iframe').contentWindow,r=w.shuilongTemple.getSharedWorldIdentity().renderer,gl=r.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {gpu:ext&&gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),stats:hybrid.model.stats(),glEvents:w.__glEvents,decodeEvents:w.__decodeEvents,longTasks:w.__longTasks,resources:w.performance.getEntriesByType('resource').filter(e=>/hybrid-v2-2/.test(e.name)).map(e=>({name:e.name,start:e.startTime,ms:e.duration,transferSize:e.transferSize}))};})};
 await context.close();return result;
}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const versions=process.argv.includes('--baseline-only')?['v22']:['v22','v221'],results=[];
 for(let i=0;i<3;i++)for(const v of (i%2?[...versions].reverse():versions)){const r=await run(browser,v,false,i===2);results.push(r);console.log(v,i+1,r.rows.filter(x=>x.state==='corridor-hybrid').map(x=>x.metrics));}
 for(const v of versions){const r=await run(browser,v,true);results.push(r);console.log('diagnostic',v,r.rows.filter(x=>x.state==='corridor-hybrid').map(x=>x.metrics));}
 fs.writeFileSync(path.join(out,process.argv.includes('--baseline-only')?'baseline-performance.json':'09-performance.json'),JSON.stringify({browser:browser.version(),viewport:[1440,900],recording:false,results},null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
