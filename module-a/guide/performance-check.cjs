const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const baseline='ac30175e3346ac5903cae0e0dc539c8dbb908c42',out=path.resolve('docs/validation/a05-a08-refinement-2026-10-06');
const overrides=['module-a/guide/controller.mjs','module-a/guide/progress.mjs','module-a/guide/styles.css','module-a/a05/content.mjs','module-a/a06/content.mjs','module-a/a07/content.mjs','module-a/a08/controller.mjs','module-a/a08/progress.mjs','module-a/a08/styles.css','module-a/visual-director/styles.css','module-a/visual-director/fonts/narrative-serif.woff2','module-a/visual-director/fonts/narrative-sans.woff2'];
async function sample(page,from,to){return page.evaluate(async({from,to})=>{const intervals=[];let last;for(let i=0;i<90;i++){await new Promise(resolve=>requestAnimationFrame(now=>{if(last)intervals.push(now-last);last=now;scrollTo(0,(from+(to-from)*i/89)*innerHeight);resolve()}));}intervals.sort((a,b)=>a-b);const api=document.querySelector('iframe').contentWindow.shuilongTemple;return{samples:intervals.length,median:intervals[Math.floor(intervals.length/2)],p95:intervals[Math.floor(intervals.length*.95)],stats:api.getA01RenderStats(),canvases:document.querySelector('iframe').contentDocument.querySelectorAll('canvas').length};},{from,to});}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={baseline,runs:[]};try{for(const mode of ['before','after']){const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();if(mode==='before')for(const file of overrides){const body=execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:20*1024*1024});await page.route('**/'+file,r=>r.fulfill({body,contentType:file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'text/javascript'}));}
 await page.goto('http://127.0.0.1:4175/module-a/a01/');await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));const firstScreenFontBytes=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('narrative-')&&r.name.endsWith('.woff2')).reduce((s,r)=>s+r.transferSize,0));assert.equal(firstScreenFontBytes,0);
 // GPU memory counters include geometry only after it has actually been drawn.
 // Visit the same stable A01 Hero and completed A04 overview in BOTH contexts,
 // rather than racing from modelReady straight into a hidden renderer.
 await page.evaluate(()=>scrollTo(0,5.2*innerHeight));await page.waitForTimeout(600);
 for(const point of [14.5,18.95,25.95,32.85]){await page.evaluate(p=>scrollTo(0,p*innerHeight),point);await page.waitForTimeout(300);if(point===14.5){await page.locator('[data-skip]').click();await page.waitForTimeout(400);}if(point>=18)await page.waitForFunction(()=>[...document.querySelectorAll('.mural-guide')].filter(g=>!g.hidden).every(g=>g.querySelector('img').naturalWidth>0));}
 const timing=await sample(page,36.2,39.4);const handoffTiming=await sample(page,39.9,41.25);
 const heapBefore=await page.evaluate(()=>performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null);
 const muralBefore=await page.evaluate(()=>{window.__testedMural=document.querySelector('.mural-guide[data-chapter="07"] img');return performance.getEntriesByName(window.__testedMural.currentSrc).length;});
 await page.evaluate(()=>scrollTo(0,42*innerHeight));await page.waitForTimeout(250);
 const carry=await page.evaluate(()=>({sameNode:window.__testedMural===document.querySelector('.mural-guide[data-chapter="07"] img'),requests:performance.getEntriesByName(window.__testedMural.currentSrc).length}));
 const heapAfter=await page.evaluate(()=>performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null);
 assert.equal(carry.sameNode,true);assert.equal(carry.requests,muralBefore,'A08 does not request the image again');
 const resources=await page.evaluate(()=>[window,document.querySelector('iframe').contentWindow].flatMap(w=>w.performance.getEntriesByType('resource').filter(r=>/mural-(01|02|05)-display\.webp|detail\.webp|woff2|glb|karst-valley/.test(r.name)).map(r=>({name:r.name,transferBytes:r.transferSize,encodedBytes:r.encodedBodySize,durationMs:r.duration}))));assert.equal(resources.filter(r=>r.name.includes('detail.webp')).length,0);assert.equal(timing.canvases,1);assert.equal(timing.stats.post.enabled,false);
 if(mode==='after'){
   const bytes=fs.statSync('shuilong-temple/environment-assets/a01-v3/karst-valley.webp').size;
   const downloads=resources.filter(r=>r.name.includes('karst-valley')).reduce((sum,r)=>sum+r.transferBytes,0);
   assert.ok(downloads>=bytes&&downloads<=bytes+2048,'A01 and shared gallery download the same background only once');
 }
 // A full-page HTML gallery can suspend rendering in the occluded iframe.
 // Return both contexts to the same visible A04 overview before comparing GPU allocations.
 await page.evaluate(()=>scrollTo(0,14.5*innerHeight));await page.waitForTimeout(300);
 const skip=page.locator('[data-skip]');if(await skip.isVisible())await skip.click();
 await page.waitForTimeout(600);
 const settledModelStats=await page.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats());
 report.runs.push({mode,firstScreenFontBytes,timing,handoffTiming,heapBefore,heapAfter,settledModelStats,resources,carry});await context.close();console.log('performance '+mode+' captured');}
 const [before,after]=report.runs;console.log('visible overview counters',before.settledModelStats,after.settledModelStats);assert.equal(after.settledModelStats.geometries,before.settledModelStats.geometries);assert.equal(after.settledModelStats.textures,before.settledModelStats.textures);
 report.fontFiles=JSON.parse(fs.readFileSync('module-a/visual-director/fonts/manifest.json')).fonts.map(f=>({file:f.file,bytes:f.bytes}));report.limit='Single Chrome/headless host, 1440×900, two fresh contexts, 89 moving-frame intervals each. Reports JS heap snapshots and existing renderer counters, not full browser/GPU memory. Does not measure GPU duration or establish cross-device performance.';
 fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify(report,null,2));console.log('PASS: same renderer/canvas, geometry and GPU texture counts; no new mural or first-screen font requests');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
