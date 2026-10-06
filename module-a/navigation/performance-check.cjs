const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const baseline='20e6cd6deadf73e0c4532205babafe3d48b177f9',out=path.resolve('docs/validation/module-a-navigation-2026-10-06');
const seek=async(p,s)=>{await p.evaluate(s=>scrollTo(0,s*innerHeight),s);await p.waitForTimeout(250);};
const distribution=values=>{const v=[...values].sort((a,b)=>a-b);return{samples:v.length,median:v[Math.floor(v.length/2)],p95:v[Math.floor(v.length*.95)],max:v.at(-1)};};
async function sample(p,from,to){
 const intervals=await p.evaluate(async({from,to})=>{
  window.__renderCosts=[];const values=[];let last;
  for(let i=0;i<90;i++)await new Promise(resolve=>requestAnimationFrame(now=>{if(last!==undefined)values.push(now-last);last=now;scrollTo(0,(from+(to-from)*i/89)*innerHeight);resolve();}));
  await new Promise(resolve=>requestAnimationFrame(resolve));return values;
 },{from,to});
 return {frameIntervalMs:distribution(intervals),mainRenderScriptMs:distribution(await p.evaluate(()=>window.__renderCosts))};
}
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),report={baseline,viewport:'1440x900',runs:[]};
 try{
  for(let repeat=0;repeat<3;repeat++)for(const mode of repeat%2?['after','before']:['before','after']){
   const context=await b.newContext({viewport:{width:1440,height:900}}),p=await context.newPage();
   // Identical measurement wrappers, injected only into the test response.
   let app=mode==='before'?execFileSync('git',['show',baseline+':module-a/a01/app.mjs']).toString():fs.readFileSync('module-a/a01/app.mjs','utf8');
   app=app.replace('function render() {','function renderCore() {').replace('function requestRender() {','function render() {const start=performance.now();renderCore();(window.__renderCosts ||= []).push(performance.now()-start);}\nfunction requestRender() {');
   await p.route('**/module-a/a01/app.mjs',r=>r.fulfill({body:app,contentType:'text/javascript'}));
   const start=Date.now();await p.goto('http://127.0.0.1:4175/module-a/a01/');await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);const modelReadyMs=Date.now()-start;
   await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));
   const firstResources=await p.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/woff2|mural-.*webp/.test(r.name)).map(r=>({name:r.name,bytes:r.transferSize})));
   assert.equal(firstResources.filter(r=>/narrative-.*woff2/.test(r.name)).length,0);
   // Allocate the existing cinematic line layers in both versions. A direct
   // Hero jump skips their transient visibility and gives 56 versus 66 lazy
   // GPU geometry counts depending on startup timing. Visit the same phases.
   for(let screen=0;screen<=6;screen+=.25)await seek(p,screen);
   for(const s of [5.6,14.5,18.8,25.9,32.9]){await seek(p,s);if(s===5.6)await p.waitForTimeout(600);if(s===14.5){await p.locator('[data-skip]').click();await p.waitForTimeout(600);}if(s>=18)await p.waitForFunction(()=>[...document.querySelectorAll('.mural-guide')].filter(e=>!e.hidden).every(e=>e.querySelector('img').naturalWidth));}
   const scan=await sample(p,36.2,39.4),handoff=await sample(p,39.9,41.25);
   const heapBefore=await p.evaluate(()=>performance.memory?.usedJSHeapSize);
   const toggles=[];
   if(mode==='after'){
    await seek(p,11.5);
    for(let i=0;i<20;i++)toggles.push(await p.evaluate(()=>{const t=performance.now();document.querySelector('.story-nav__toggle').click();document.querySelector('.story-nav__directory').getBoundingClientRect();return performance.now()-t;}));
   }
   for(let i=0;i<4;i++)for(const s of [7.5,11.2,18.8,26,33,42])await seek(p,s);
   const resources=await p.evaluate(()=>[window,document.querySelector('iframe').contentWindow].flatMap(w=>w.performance.getEntriesByType('resource').filter(r=>/mural-(01|02|05)-display|detail.webp|woff2|glb/.test(r.name)).map(r=>({name:r.name,bytes:r.transferSize,encoded:r.encodedBodySize}))));
   assert.equal(resources.filter(r=>r.name.includes('detail.webp')).length,0);
   // Lazy GPU allocations count only after geometry is actually drawn. Draw
   // identical stable Hero and completed overview again before comparing.
   await seek(p,5.6);await p.waitForTimeout(600);
   await seek(p,14.5);const skip=p.locator('[data-skip]');if(await skip.isVisible())await skip.click();await p.waitForFunction(()=>document.body.dataset.a04Mode==='completed');await p.waitForTimeout(600);
   const stats=await p.evaluate(()=>({renderer:document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats(),canvases:document.querySelector('iframe').contentDocument.querySelectorAll('canvas').length,heapAfter:performance.memory?.usedJSHeapSize}));
   assert.equal(stats.canvases,1);assert.equal(stats.renderer.post.enabled,false);
   report.runs.push({repeat,mode,modelReadyMs,firstResources,scan,handoff,menuScriptAndForcedLayoutMs:toggles.length?distribution(toggles):null,heapBefore,...stats,resources});
   await context.close();console.log(`${repeat+1}/3 ${mode} complete`);
  }
  fs.writeFileSync(path.join(out,'performance-measured.json'),JSON.stringify(report,null,2));
  console.log('settled allocation pairs',report.runs.map(r=>({repeat:r.repeat,mode:r.mode,geometry:r.renderer.geometries,textures:r.renderer.textures})));
  for(let i=0;i<3;i++){
   const runs=report.runs.filter(r=>r.repeat===i);assert.equal(runs[0].renderer.geometries,runs[1].renderer.geometries);assert.equal(runs[0].renderer.textures,runs[1].renderer.textures);
  }
  report.limit='Same host Chrome/headless, 1440×900; 3 fresh context pairs, alternating order, serial warmup and measurements. Main-render timings cover synchronous parent render only, not iframe renderer/GPU. rAF intervals include scheduling/render/composition, not script cost. Opaque preflight only tests B connectivity. JS heap snapshots are not proof of leak freedom or full browser/GPU memory. No cross-device conclusion.';
  fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify(report,null,2));console.log('PASS repeated timings, resource/canvas/renderer allocation checks');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
