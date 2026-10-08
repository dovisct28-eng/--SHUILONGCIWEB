const {syntheticCamera}=require('./b03-gesture-fixtures.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js');
const out=path.resolve(process.env.B03_HF_VALIDATION_DIR || path.join(__dirname,'../docs/validation/b03-hf-01/local/theatre'));fs.mkdirSync(out,{recursive:true});
const report={environment:'Actual Chrome / Three.js / GSAP. Camera stream and Hands/Pose model outputs synthetic; physical camera and real-model cold start not certified.',views:[],functional:[],errors:[]};
const instrument=`window.__hf={select:loadSeriesData,reveal:setRevealed,snapshot(){lineMesh?.updateMatrixWorld();return {id:currentItemData?.id,figureMode,revealed:isRevealed,effective:stageLayout?.effective,occupancy:figureMeasurement?.geometry?.grid,projection:figureMode&&figureMeasurement&&stageLayout?{x:stageLayout.x,y:stageLayout.y,width:figureMeasurement.width*stageLayout.scale,height:figureMeasurement.height*stageLayout.scale}:null,layout:orbitStage?.currentLayout,geometry:orbitStage?Object.fromEntries(Object.entries(orbitStage.geometry).filter(([k])=>k!=='_gsap')):null,active:orbitStage?.active,rendererCount:document.querySelectorAll('#webgl-container canvas').length,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,opacity:lineMesh?.material.opacity}}};`;
const ready=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading')&&__hf.snapshot().opacity>=.999);
const shot=(p,name)=>p.screenshot({path:path.join(out,name+'.png')});
async function verify(p) {
 const a=await p.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
  const s=__hf.snapshot(),panels=[...document.querySelectorAll('.orbit-panel')].filter(e=>Number(getComputedStyle(e).opacity)>.1).map(e=>({...rect(e),id:e.dataset.panel,pointer:getComputedStyle(e).pointerEvents}));
  return {s,panels,archive:rect(document.getElementById('floating-info')),title:rect(document.getElementById('stage-name')),controls:rect(document.querySelector('.cyber-controls')),hint:rect(document.querySelector('.gesture-hint')),overflow:document.documentElement.scrollWidth>innerWidth,height:innerHeight};
 });
 const e=a.s.effective;assert.equal(a.overflow,false);assert.equal(a.s.rendererCount,1);
 assert.equal(await p.locator('#entry-mode-notice').isHidden(),true,'Unintended startup/error panel obscures visual acceptance');
 const grid=a.s.occupancy,projection=a.s.projection;
 for(const r of a.panels){assert.equal(r.pointer,'none');if(grid)for(let y=0;y<grid.size;y++)for(let x=0;x<grid.size;x++)if(grid.counts[y*grid.size+x]>0){const c={x:projection.x+x/grid.size*projection.width,y:projection.y+y/grid.size*projection.height,width:projection.width/grid.size,height:projection.height/grid.size};assert.ok(r.right<c.x-8||r.x>c.x+c.width+8||r.bottom<c.y-8||r.y>c.y+c.height+8,JSON.stringify({r,c}));}assert.ok(r.y>=96&&r.bottom<a.height-165);if(a.s.revealed)assert.ok(r.right<a.archive.x-12);}
 assert.equal(a.panels.length,a.s.layout.panels.length);assert.ok(a.panels.length>=2&&a.panels.length<=(a.s.revealed?3:5));assert.ok(e.y+e.height<a.controls.y-70);
 if(!a.s.revealed)assert.ok(e.y+e.height<a.title.y-3);
 assert.ok(a.hint.bottom<a.controls.y);assert.ok(a.controls.bottom<=a.height-10);
 if(a.s.revealed)assert.ok(e.x+e.width<a.archive.x-32);
 return a;
}
(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const origin=`http://localhost:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));const requests=[];p.on('request',r=>requests.push(r.url()));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await syntheticCamera(p);
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org');await p.locator('#quick-switch-btn').click();await ready(p);
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,800]]) {
   await p.setViewportSize({width,height});await p.waitForTimeout(180);
   const before=await verify(p);await shot(p,`default-${width}x${height}`);
   await p.locator('#reveal-toggle').click();await p.waitForTimeout(900);const opened=await verify(p);await shot(p,`revealed-${width}x${height}`);
   assert.ok(opened.s.effective.x+opened.s.effective.width/2<before.s.effective.x+before.s.effective.width/2-60);assert.ok(opened.s.effective.height<before.s.effective.height);
   await p.keyboard.press('Escape');await p.waitForTimeout(900);const restored=await verify(p);await shot(p,`closed-${width}x${height}`);assert.deepEqual(restored.s.effective,before.s.effective);
   report.views.push({width,height,before,opened,restored});
  }
  await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(150);
  await p.locator('#stage-name').click();
  const initial=await p.evaluate(()=>__hf.snapshot()),n=requests.length;
  for(let i=0;i<12;i++){await p.keyboard.press('i');await p.waitForTimeout(35);await p.keyboard.press('Escape');await p.waitForTimeout(35);}
  await p.waitForTimeout(900);await verify(p);const after=await p.evaluate(()=>__hf.snapshot());assert.deepEqual(after.effective,initial.effective);assert.equal(after.textures,initial.textures);assert.equal(after.geometries,initial.geometries);assert.equal(requests.slice(n).filter(u=>/\.(png|webp)/.test(u)).length,0);
  report.functional.push('Four sizes × default, revealed, restored; actual rotated panel rectangles avoid conservative alpha occupancy cells; rapid keyboard reversals restore identical layout without image requests or additional GL resources');
  const data=(await(await p.request.get(origin+'/api/scan-assets')).json()).data;
  await p.locator('[data-step="1"]').last().click();await p.waitForFunction(()=>__hf.snapshot().id==='02'&&!document.getElementById('webgl-container').hasAttribute('data-loading'));assert.equal((await p.evaluate(()=>__hf.snapshot())).figureMode,!!data.find(x=>x.id==='02').figurePath);await shot(p,'character-02');
  const legacy=data.findIndex(x=>!x.figurePath&&x.linePath&&x.colorPath);
  if(legacy>=0){await p.evaluate(i=>__hf.select(i),legacy);await p.waitForFunction(()=>!document.getElementById('webgl-container').hasAttribute('data-loading'));assert.equal(await p.locator('#orbit-stage').isHidden(),true);await shot(p,'legacy-fallback');}
  await p.locator('[data-step="-1"]').last().click();await ready(p);await verify(p);
  report.figures=[];
  for(const [index,item]of data.entries())if(item.figurePath){
   await p.evaluate(i=>__hf.select(i),index);await ready(p);
   for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
    await p.setViewportSize({width,height});await p.waitForTimeout(180);const before=await verify(p);
    if(width===1440)await shot(p,`figure-${item.id}-default`);
    await p.locator('#reveal-toggle').click();await p.waitForTimeout(900);const opened=await verify(p);
    if(width===1440)await shot(p,`figure-${item.id}-reading`);
    await p.keyboard.press('Escape');await p.waitForTimeout(900);const restored=await verify(p);assert.deepEqual(restored.s.effective,before.s.effective);
    report.figures.push({id:item.id,width,height,before,opened,restored,status:'PASS'});
   }
  }
  report.functional.push('Every supplied figure tested at four viewports in default/reading/restored states, with alpha-aware panel collision checks; remaining legacy fallback tested by available data');
  await p.evaluate(()=>__hf.select(0));await ready(p);
  // Only author summary in an API fixture; never writes author metadata.
  await p.route('**/api/scan-assets',r=>r.fulfill({json:{success:true,data:data.map((x,i)=>i===0?{...x,cyber:{summary:'仅用于测试长简介排版，不是人物史料。'.repeat(100)+'<script>window.__unsafe=true</script>'}}:x),diagnostics:[]}}));
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org');await p.locator('#quick-switch-btn').click();await ready(p);await p.locator('#reveal-toggle').click();await p.waitForTimeout(900);
  assert.ok(await p.locator('#info-text').evaluate(e=>e.scrollHeight>e.clientHeight));assert.equal(await p.evaluate(()=>window.__unsafe),undefined);await shot(p,'synthetic-long-summary');
  await p.unroute('**/api/scan-assets');await p.locator('#quick-switch-btn').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');assert.equal(await p.locator('#orbit-stage').isHidden(),true);
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#quick-switch-btn').click();await ready(p);await p.locator('#reveal-toggle').click();await verify(p);await shot(p,'reduced-motion');
  report.functional.push('Legacy fallback hides figure-specific image devices; mode exit clears canvases; long author summary scrolls and HTML stays plain text; reduced motion reaches the same safe composition');assert.deepEqual(report.errors,[]);
 } finally {try {fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}finally {await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}}
 console.log('B03 HF theatre browser: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
