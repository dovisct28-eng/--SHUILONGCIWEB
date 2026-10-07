const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js');
const label=process.env.B03_PERF_LABEL||'candidate';
const out=path.resolve(__dirname,'../docs/validation/b03-hf-03/local');fs.mkdirSync(out,{recursive:true});
const instrument=`window.__perf={select:loadSeriesData,reveal:setRevealed,snapshot(){return {id:currentItemData?.id,opacity:lineMesh?.material.opacity,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,rendererCount:document.querySelectorAll('#webgl-container canvas').length,heap:performance.memory?.usedJSHeapSize}}};`;
(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});const report={label,browser:browser.version(),viewport:{width:1440,height:900},limits:'Headless Chrome with camera boundary stub, no real camera/GPU/exhibition acceptance',errors:[]};
 try{
  const p=await browser.newPage({viewport:report.viewport});p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await p.addInitScript(()=>window.Camera=class{async start(){}stop(){}});
  await p.goto(`http://localhost:${server.address().port}/index.html`);await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await p.locator('#quick-switch-btn').click();
  await p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading')&&__perf.snapshot().opacity>=.999);await p.waitForTimeout(1200);
  report.start=await p.evaluate(()=>__perf.snapshot());
  report.timing=await p.evaluate(()=>new Promise(resolve=>{
   const times=[],start=performance.now();let last=start;
   function step(now){times.push(now-last);last=now;if(now-start<10000)requestAnimationFrame(step);else {times.shift();const sorted=[...times].sort((a,b)=>a-b);resolve({samples:times.length,elapsed:now-start,fps:times.length*1000/times.reduce((a,b)=>a+b,0),mean:times.reduce((a,b)=>a+b,0)/times.length,p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)});}}requestAnimationFrame(step);
  }));
  report.switches=[];
  for(let i=0;i<12;i++){
   const index=i%2?0:4,start=Date.now();await p.evaluate(i=>__perf.select(i),index);
   await p.waitForFunction(()=>!document.getElementById('webgl-container').hasAttribute('data-loading'));const resourceMs=Date.now()-start;
   await p.waitForFunction(()=>__perf.snapshot().opacity>=.999);report.switches.push({index,resourceMs,stableMs:Date.now()-start,...await p.evaluate(()=>__perf.snapshot())});
   await p.evaluate(i=>__perf.reveal(i%2===0),i);await p.waitForTimeout(800);
  }
  report.end=await p.evaluate(()=>__perf.snapshot());
  const soak=Number(process.env.B03_SOAK_SECONDS||0);
  if(soak>0){const cdp=await p.context().newCDPSession(p);report.soak={seconds:soak,samples:[]};await cdp.send('HeapProfiler.collectGarbage');report.soak.start=await cdp.send('Runtime.getHeapUsage');for(let elapsed=0;elapsed<soak;elapsed+=20){await p.waitForTimeout(Math.min(20,soak-elapsed)*1000);report.soak.samples.push({elapsed:Math.min(elapsed+20,soak),...await p.evaluate(()=>__perf.snapshot())});console.log(`Soak ${Math.min(elapsed+20,soak)}/${soak}s`);}await cdp.send('HeapProfiler.collectGarbage');report.soak.end=await cdp.send('Runtime.getHeapUsage');}
  if(report.errors.length)throw Error(report.errors.join('\n'));
 }finally{fs.writeFileSync(path.join(out,`performance-${label}.json`),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
