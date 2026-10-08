const {stubPose,fixtureInstrument}=require('./b03-gesture-fixtures.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js');
const out=path.resolve(process.env.B03_VALIDATION_DIR || path.join(__dirname,'../docs/validation/b03-v2-2026-10-06'));fs.mkdirSync(out,{recursive:true});
const report={functional:[],synthetic:'Colored rectangles are geometry fixtures, not heritage/person artwork. Formal stage cases here use author ID01; additional local figures are outside this synthetic suite.',errors:[]};
const instrument=`window.__stage={select(index){if(currentTrack==='gallery')showScreen('gallery-detail');loadSeriesData(index)},reveal:setRevealed,snapshot(){return {id:currentItemData?.id,figureMode,revealed:isRevealed,measurement:figureMeasurement,layout:stageLayout,grid:colorPoints?.geometry.attributes.position.count,rendererCount:document.querySelectorAll('#webgl-container canvas').length,config:calibrationOverrides.get(currentItemData?.id),textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries}}};`;
const ready=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading'),null,{timeout:40000});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
(async()=>{
 const server=createApp({admin:true}).listen(0,'localhost');await new Promise(r=>server.once('listening',r));
 const origin=`http://localhost:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await stubPose(p);await p.addInitScript(()=>window.Camera=class{async start(){}stop(){}});
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org');
  await p.locator('#quick-switch-btn').click();await ready(p);await p.waitForTimeout(1750);
  await p.locator('#calibration-toggle').click();assert.equal(await p.locator('#calibration-character option').count(),8);
  await p.locator('[data-calibration="scale"]').fill('.8');await p.locator('[data-calibration="offsetX"]').fill('.1');await p.locator('[data-calibration="anchorX"]').fill('.7');
  await p.locator('#preview-revealed').click();await p.waitForTimeout(850);
  const config=JSON.parse(await p.locator('#calibration-json').inputValue());assert.equal(config.cyber.layout.scale,.8);assert.equal(config.cyber.layout.offsetX,.1);
  const initial=await p.evaluate(()=>__stage.snapshot());assert.ok(initial.figureMode);assert.ok(initial.layout.effective.x+initial.layout.effective.width<await p.locator('#floating-info').evaluate(e=>e.getBoundingClientRect().left));
  await p.locator('#calibration-copy').click();await shot(p,'author-calibration');
  for(let i=0;i<8;i++)await p.evaluate(()=>{__stage.reveal(false);__stage.reveal(true);});await p.waitForTimeout(850);assert.deepEqual((await p.evaluate(()=>__stage.snapshot())).layout,initial.layout);
  await p.setViewportSize({width:1280,height:800});const resized=await p.evaluate(()=>__stage.snapshot());assert.equal(resized.config.layout.offsetX,.1);assert.equal(resized.geometries,initial.geometries);assert.equal(resized.textures,initial.textures);
  await p.locator('#calibration-reset').click();assert.equal(JSON.parse(await p.locator('#calibration-json').inputValue()).cyber.layout.scale,1);await p.locator('#calibration-close').click();
  report.functional.push('Author-only preview, character selection, normalized scale/offset/anchor, copy JSON, reset, 8 fast reversals without drift, resize without texture reconstruction');
  const data=(await(await p.request.get(origin+'/api/scan-assets')).json()).data;
  const images=await p.evaluate(()=>{
   const result={};for(const [name,w,h,x,y,bw,bh,opaque] of [['tall',96,720,43,12,10,696,false],['wide',960,90,12,35,936,20,false],['opaque',80,80,0,0,80,80,true],['empty',80,80,0,0,0,0,false]]){
    const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle='#a78355';if(opaque)ctx.fillRect(0,0,w,h);else ctx.fillRect(x,y,bw,bh);result[name]=c.toDataURL('image/png');
   }return result;
  });
  for(const [name,url] of Object.entries(images))await p.route(`**/fixture-${name}.png`,r=>r.fulfill({contentType:'image/png',body:Buffer.from(url.split(',')[1],'base64')}));
  const fixture=(id,name,figure,cyber={},legacy=false)=>({...data[0],id,name,englishName:'Provided fixture name',position:{x:null,y:null},order:99,previews:{},resources:{org:null,line:legacy?data[0].linePath:null,color:legacy?data[0].colorPath:null,figure,info:null,video:null},orgPath:null,linePath:legacy?data[0].linePath:null,colorPath:legacy?data[0].colorPath:null,figurePath:figure,infoPath:null,videoPath:null,ready:false,annotated:false,cyber});
  const longSummary='合成测试简介，仅用于验证滚动与安全文字，不是史料。'.repeat(80)+'<script>window.__unsafe=true</script>';
  const fixtures=[fixture('tall','合成边界测试 · 细长矩形','/fixture-tall.png',{summary:longSummary}),fixture('wide','合成边界测试 · 宽矩形','/fixture-wide.png'),fixture('opaque','不透明 Alpha 测试','/fixture-opaque.png',{},true),fixture('empty','空 Alpha 测试','/fixture-empty.png'),fixture('decode','解码失败测试','/fixture-broken.png',{},true),fixture('manual','手动边界测试','/fixture-opaque.png',{bounds:{x:0,y:0,width:1,height:1},layout:{scale:.7}})];
  await p.route('**/fixture-broken.png',r=>r.fulfill({contentType:'image/png',body:'not an image'}));
  await p.route('**/api/scan-assets',r=>r.fulfill({json:{success:true,adminEnabled:true,data:[...data,...fixtures],diagnostics:[]}}));
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');
  await p.evaluate(()=>__stage.select(8));await p.locator('#quick-switch-btn').click();await ready(p);assert.equal((await p.evaluate(()=>__stage.snapshot())).id,'tall');
  for(const index of [8,9])for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.evaluate(index=>__stage.select(index),index);await ready(p);await p.waitForTimeout(1750);
   for(const revealed of [false,true]){
    await p.evaluate(r=>__stage.reveal(r),revealed);await p.waitForTimeout(850);const s=await p.evaluate(()=>__stage.snapshot()),e=s.layout.effective,panel=await p.locator('#floating-info').boundingBox();
    assert.ok(s.figureMode);assert.ok(s.grid<=80000);assert.equal(s.rendererCount,1);assert.ok(e.x>=39&&e.y>=95&&e.y+e.height<=height-165);assert.ok(e.x+e.width<= (revealed?panel.x-30:width-39));
    if(width===1440)await shot(p,`synthetic-${index===8?'tall':'wide'}-${revealed?'revealed':'default'}`);
    if(index===8&&revealed){assert.ok(await p.locator('#info-text').evaluate(e=>e.scrollHeight>e.clientHeight));assert.equal(await p.evaluate(()=>window.__unsafe),undefined);}
   }
  }
  report.functional.push('Figure-only resources enter without legacy layers; synthetic tall/wide Alpha shapes fit 4 sizes in both states; long author summary scrolls and HTML stays text; one renderer and <=80000 vertices');
  await p.evaluate(()=>__stage.select(10));await ready(p);assert.ok(!(await p.evaluate(()=>__stage.snapshot())).figureMode);assert.match(await p.locator('#cyber-asset-status').textContent(),/不透明/);await shot(p,'invalid-alpha-legacy-fallback');
  await p.evaluate(()=>__stage.select(11));await p.waitForFunction(()=>document.getElementById('cyber-asset-status').textContent.includes('为空'));assert.equal((await p.evaluate(()=>__stage.snapshot())).id,'empty');assert.ok(await p.locator('#webgl-container').evaluate(e=>e.hasAttribute('data-loading')));await shot(p,'empty-alpha-diagnostic');
  await p.evaluate(()=>__stage.select(12));await ready(p);assert.ok(!(await p.evaluate(()=>__stage.snapshot())).figureMode);assert.match(await p.locator('#cyber-asset-status').textContent(),/无效/);
  await p.evaluate(()=>__stage.select(13));await ready(p);assert.ok((await p.evaluate(()=>__stage.snapshot())).figureMode);assert.match(await p.locator('#cyber-asset-status').textContent(),/手动边界/);await shot(p,'manual-bounds-diagnostic');
  await p.evaluate(()=>__stage.select(8));await ready(p);await p.evaluate(()=>__stage.select(9));await ready(p);await p.evaluate(()=>__stage.select(0));await ready(p);const a=await p.evaluate(()=>__stage.snapshot());assert.ok(a.measurement.scanMs>0);
  await p.evaluate(()=>__stage.select(9));await ready(p);await p.evaluate(()=>__stage.select(0));await ready(p);const cached=await p.evaluate(()=>__stage.snapshot());assert.ok(cached.measurement.cacheHit);assert.equal(cached.measurement.scanMs,a.measurement.scanMs);report.realFigure=cached;
  await p.locator('#quick-switch-btn').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');assert.ok(await p.locator('#calibration').isHidden());
  await p.route('**/'+encodeURIComponent(data[0].folderName)+'/line.png',async r=>{const image=Buffer.from(images.wide.split(',')[1],'base64');await r.fulfill({contentType:'image/png',body:image});});
  await p.getByRole('button',{name:'高清线稿',exact:true}).click();await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='line');await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.dimensionMatch==='false');const dimensions=await p.locator('#image-wrapper').evaluate(e=>JSON.parse(e.dataset.dimensions));assert.ok(dimensions.line&&dimensions.org);assert.notDeepEqual(dimensions.line,dimensions.org);await shot(p,'layer-registration-diagnostic');
  report.functional.push('Opaque/failed-decode figure falls back to legacy without ID change; empty Alpha remains diagnosed without showing stale art; explicit manual bounds allowed with warning; per-source Alpha cache reused; mismatched study dimensions retained in internal diagnostics while correct single media is displayed');
  assert.deepEqual(report.errors,[]);
 } catch(error) { report.failure=error.message;const p=browser.contexts().flatMap(c=>c.pages())[0];if(p){report.failureState=await p.evaluate(()=>({state:document.body.dataset.explorationState,notice:document.getElementById('entry-mode-notice')?.textContent,status:document.getElementById('cyber-asset-status')?.textContent,snapshot:window.__stage?.snapshot()}));await shot(p,'stage-failure-diagnostic');}throw error; }
 finally { fs.writeFileSync(path.join(out,'stage-results.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r)); }
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
