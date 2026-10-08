const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js');
const out=path.resolve(process.env.B02_VALIDATION_DIR || path.join(__dirname,'../docs/validation/b02-media-switch-2026-10-08/local/gallery'));fs.mkdirSync(out,{recursive:true});
const origin=process.env.B_VALIDATION_ORIGIN || 'http://localhost:3000';
const assets=path.join(__dirname,'public/assets');
const fixtureRoot=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'b02-authoring-'));
const temp=path.join(fixtureRoot,'99_B02_TEMP_TEST');
const report={environment:{browser:'Chrome headless',platform:process.platform,node:process.version},views:[],functional:[],stress:[],errors:[],camera:'Real camera/gesture hardware requires author testing'};
const state=p=>p.evaluate(()=>document.body.dataset.explorationState),shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
const enter=async p=>{await p.locator('#btn-gallery-track').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');};
const status=async(p,pattern)=>p.waitForFunction(pattern=>document.querySelector('[data-status]').textContent.includes(pattern),pattern);
(async()=>{
 // Existing resources remain read-only; authored test data lives outside public/assets.
 for(const entry of fs.readdirSync(assets,{withFileTypes:true}).filter(e=>e.isDirectory()&&/^\d+_/.test(e.name))){
  const dir=path.join(fixtureRoot,entry.name);fs.mkdirSync(dir);
  for(const file of fs.readdirSync(path.join(assets,entry.name))){const src=path.join(assets,entry.name,file);if(fs.statSync(src).isFile())fs.copyFileSync(src,path.join(dir,file));}
 }
 const adminApp=createApp({admin:true,assetsDirectory:fixtureRoot});adminApp.use('/assets',require('express').static(fixtureRoot));
 const admin=adminApp.listen(0,'localhost');await new Promise(r=>admin.once('listening',r));
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-precise-memory-info']});let createdFixture=false;
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));let requests=[];page.on('request',r=>requests.push(r.url()));
  for(const [w,h] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await page.setViewportSize({width:w,height:h});requests=[];await page.goto(origin+'/index.html');await shot(page,`b01-${w}x${h}`);
   assert.ok(!requests.some(u=>/scan-assets|mural-02-detail|\/org\.|\/line\.|\/color\.|\/video\.|mediapipe|three/.test(u)));
   const start=Date.now();await enter(page);const galleryReadyMs=Date.now()-start;
   const metrics=await page.evaluate(()=>{const i=document.getElementById('panorama-bg'),r=i.getBoundingClientRect();return {left:r.left,top:r.top,height:r.height,bottom:r.bottom,natural:[i.naturalWidth,i.naturalHeight],renderer:document.querySelectorAll('#webgl-container canvas').length,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,duration:r.duration,bytes:r.transferSize})),memory:performance.memory?.usedJSHeapSize};});
   assert.ok(Math.abs(metrics.left)<.01);assert.ok(Math.abs(metrics.top-80)<.01);assert.ok(Math.abs(metrics.height-(h-148))<.01);assert.deepEqual(metrics.natural,[8192,1853]);assert.equal(metrics.renderer,0);assert.equal(await page.locator('.hotspot').count(),8);assert.ok(await page.locator('#gallery-admin-toggle').isHidden());
   assert.ok(!requests.some(u=>/splash-bg\.png|\/org\.|\/line\.|\/color\.|\/video\.|mediapipe|three/.test(u)));
   await shot(page,`left-${w}x${h}`);report.views.push({w,h,galleryReadyMs,screenshotCompleteMs:Date.now()-start,...metrics});
  }
  await page.setViewportSize({width:1440,height:900});await page.locator('#pano-reset-btn').click();await shot(page,'hotspots-default');
  for(const id of ['01','02','03','04','05','06','07','10']){
   const marker=page.locator(`.hotspot[data-ids="${id}"]`);await marker.hover();await shot(page,`hotspot-${id}`);
   await marker.click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-org')).display!=='none' && document.getElementById('img-org').naturalWidth>0);
   const title=await page.locator('#info-title').textContent();assert.ok(title.length>1);await page.locator('#back-btn').click();assert.equal(await state(page),'gallery-map');
  }
  report.functional.push('All eight named hotspots open their matching original resources; all hover screenshots recorded');await shot(page,'hotspot-selected');
  await page.mouse.move(700,500);await page.mouse.wheel(0,-462);await page.waitForTimeout(100);
  await page.mouse.down();await page.mouse.move(300,450,{steps:15});await page.mouse.up();
  const before=await page.locator('#panorama-wrapper').getAttribute('style');
  await page.locator('#pano-reset-btn').click();await page.mouse.move(200,300);await page.mouse.wheel(0,-300);await page.waitForTimeout(100);
  const preserved=await page.locator('#panorama-wrapper').getAttribute('style');await page.locator('.hotspot[data-ids="01"]').click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-org')).display!=='none' && document.getElementById('img-org').naturalWidth>0);
  assert.equal(await page.locator('#img-line').getAttribute('src'),null);assert.equal(await page.locator('#img-color').getAttribute('src'),null);assert.equal(await page.locator('#video-color').getAttribute('src'),null);
  await page.getByRole('button',{name:'高清线稿',exact:true}).click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-line')).display!=='none' && document.getElementById('img-line').naturalWidth>0);
  await page.getByRole('button',{name:'数字色稿',exact:true}).click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-color')).display!=='none'||getComputedStyle(document.getElementById('video-color')).display!=='none');
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('video-color')).display!=='none');await shot(page,'detail-compatible');
  await page.locator('#index-toggle').click();await page.locator('#menu li button').nth(2).click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-org')).display!=='none' && document.getElementById('img-org').naturalWidth>0);assert.equal(await page.locator('#video-color').getAttribute('src'),null);
  await page.getByRole('button',{name:'数字色稿',exact:true}).click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-color')).display!=='none' && document.getElementById('img-color').naturalWidth>0);assert.equal(await page.locator('#video-color').getAttribute('src'),null);
  await page.locator('#back-btn').click();assert.equal(await page.locator('#panorama-wrapper').getAttribute('style'),preserved);report.functional.push('Pan/zoom preserved through detail and character switching; line/color/video lazy; missing video never requested; video released on switch/return');
  await page.locator('#pano-reset-btn').click();await page.mouse.move(1200,500);await page.mouse.down();await page.mouse.move(100,500,{steps:15});await page.mouse.up();await shot(page,'middle');
  await page.locator('#pano-back-btn').click();await enter(page);assert.equal(await page.locator('#panorama-bg').evaluate(e=>e.getBoundingClientRect().left),0);report.functional.push('Drag, wheel, middle, reset, fresh B01 entry at left');
  // Temporary authoring fixture is never committed and is cleaned even on failure.
  assert.ok(!fs.existsSync(temp));fs.mkdirSync(temp);createdFixture=true;fs.copyFileSync(path.join(assets,'01_南门何五猖/org.png'),path.join(temp,'org.png'));
  const author=await browser.newPage({viewport:{width:1440,height:900}});author.on('pageerror',e=>report.errors.push(e.message));
  await author.goto(`http://localhost:${admin.address().port}/index.html`);await enter(author);assert.equal(await author.locator('.hotspot').count(),8);
  await author.locator('#gallery-admin-toggle').click();await author.locator('[data-list] button[data-id="99"]').waitFor();await shot(author,'admin');
  await author.locator('[data-list] button[data-id="99"]').click();await author.mouse.click(600,450);await shot(author,'admin-preview');assert.ok(!fs.existsSync(path.join(temp,'meta.json')));
  await author.locator('[data-save]').click();await status(author,'保存成功');const first=JSON.parse(fs.readFileSync(path.join(temp,'meta.json')));await shot(author,'admin-saved');assert.ok(first.position.x>0);assert.equal(await author.locator('.hotspot').count(),9);
  await author.reload();await enter(author);assert.equal(await author.locator('.hotspot').count(),9);await author.locator('#gallery-admin-toggle').click();await author.locator('[data-list] button[data-id="99"]').click();
  await author.mouse.click(700,480);await author.locator('[data-cancel]').click();assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'meta.json'))).position,first.position);
  // Click before choosing: switch to another entry, then reset selection via reload.
  await author.reload();await enter(author);await author.locator('#gallery-admin-toggle').click();await author.mouse.click(680,420);await author.locator('[data-list] button[data-id="99"]').click();await author.locator('[data-save]').click();await status(author,'保存成功');
  const second=JSON.parse(fs.readFileSync(path.join(temp,'meta.json')));assert.notDeepEqual(second.position,first.position);
  await author.mouse.move(650,440);await author.mouse.wheel(0,-462);await author.waitForTimeout(100);await author.mouse.move(800,550);await author.mouse.down();await author.mouse.move(620,520,{steps:10});await author.mouse.up();
  await author.mouse.click(600,450);await author.route('**/api/gallery-admin/position',r=>r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({success:false,message:'模拟磁盘失败'})}));await author.locator('[data-save]').click();await status(author,'保存失败');assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'meta.json'))).position,second.position);await shot(author,'admin-save-failure');await author.unroute('**/api/gallery-admin/position');
  // Add each optional resource and rescan without changing frontend code.
  for(const [file,source] of [['line.png','01_南门何五猖/line.png'],['color.png','01_南门何五猖/color.png'],['video.mp4','01_南门何五猖/video.mp4'],['info.md',null]]){
   if(source)fs.copyFileSync(path.join(assets,source),path.join(temp,file));else fs.writeFileSync(path.join(temp,file),'仅用于自动测试的档案正文');
   await author.locator('[data-refresh]').click();await status(author,'扫描完成');const scan=await(await author.request.get(new URL('/api/scan-assets',author.url()).href)).json();assert.ok(scan.data.find(i=>i.id==='99').resources[file.split('.')[0]==='info'?'info':file.split('.')[0]]);
  }
  await author.locator('input[type="search"]').fill('B02_TEMP');assert.equal(await author.locator('[data-list] button').count(),1);await author.locator('[data-unbind]').click();assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp,'meta.json'))).position,second.position);await author.locator('[data-save]').click();await status(author,'已取消绑定');assert.ok(fs.existsSync(path.join(temp,'org.png')));assert.equal(await author.locator('.hotspot').count(),8);
  // Rebind and enter original-only fixture after removing optional resources.
  for(const file of ['line.png','color.png','video.mp4','info.md'])fs.unlinkSync(path.join(temp,file));await author.locator('[data-refresh]').click();await status(author,'扫描完成');await author.locator('[data-list] button[data-id="99"]').click();await author.locator('#pano-reset-btn').click();await author.mouse.click(700,450);await author.locator('[data-save]').click();await status(author,'保存成功');await author.locator('#gallery-admin-toggle').click();await author.locator('.hotspot[data-ids="99"]').click();await author.waitForFunction(()=>getComputedStyle(document.getElementById('img-org')).display!=='none' && document.getElementById('img-org').naturalWidth>0);assert.match(await author.locator('#info-text').textContent(),/人物档案待补充/);assert.ok(await author.getByRole('button',{name:'高清线稿',exact:true}).isDisabled());assert.ok(await author.getByRole('button',{name:'数字色稿',exact:true}).isDisabled());await shot(author,'original-only');
  await author.close();fs.rmSync(temp,{recursive:true});report.functional.push('Real new folder auto-discovery; both click/select orders; draft/cancel/save/reload/edit/unbind; search; simulated save failure restores; progressive resources; original-only detail; fixture cleaned');
  const baseScan=await(await page.request.get(origin+'/api/scan-assets')).json();
  for(const count of [30,50]){
   const stress=await browser.newPage({viewport:{width:1440,height:900}});
   const data=Array.from({length:count},(_,i)=>({...baseScan.data[i%8],id:`stress-${i}`,name:`测试人物 ${i+1}`,position:{x:4+(i%10)*.35,y:20+Math.floor(i/10)*.7},annotated:true}));
   await stress.route('**/api/scan-assets',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({...baseScan,data})}));await stress.goto(origin+'/index.html');await enter(stress);
   assert.equal(await stress.locator('.hotspot').evaluateAll(els=>els.reduce((n,e)=>n+e.dataset.ids.split(',').length,0)),count);
   await stress.locator('.hotspot').first().click();assert.ok(await stress.locator('#hotspot-chooser button').count()>1);await shot(stress,`stress-${count}`);await stress.keyboard.press('Escape');
   await stress.evaluate(()=>{window.__samples=[];window.__sampling=true;let last=performance.now();function frame(t){if(!__sampling)return;__samples.push(t-last);last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);});
   await stress.mouse.move(800,500);await stress.mouse.down();await stress.mouse.move(150,500,{steps:100});await stress.mouse.up();await stress.mouse.wheel(0,-350);await stress.waitForTimeout(300);
   const metrics=await stress.evaluate(()=>{__sampling=false;const intervals=__samples.slice(2).sort((a,b)=>a-b);return {frames:intervals.length,medianMs:intervals[Math.floor(intervals.length/2)],p95Ms:intervals[Math.floor(intervals.length*.95)],heap:performance.memory?.usedJSHeapSize,renderer:document.querySelectorAll('#webgl-container canvas').length};});assert.equal(metrics.renderer,0);report.stress.push({count,...metrics});await stress.close();
  }
  // Observe repeated static detail visits with collection, not process/GPU memory.
  const client=await page.context().newCDPSession(page);await page.locator('#pano-reset-btn').click();await client.send('HeapProfiler.collectGarbage');const memoryStart=await client.send('Runtime.getHeapUsage');
  for(let i=0;i<30;i++){await page.locator(`.hotspot[data-ids="${baseScan.data[i%8].id}"]`).click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('img-org')).display!=='none' && document.getElementById('img-org').naturalWidth>0);await page.locator('#back-btn').click();}
  await client.send('HeapProfiler.collectGarbage');const memoryEnd=await client.send('Runtime.getHeapUsage');report.memory={visits:30,start:memoryStart,end:memoryEnd,scope:'JS heap after explicit GC; excludes decoded images/GPU/process RSS'};
  report.media=await require('./b02-media-browser-check.cjs').runMediaChecks(browser,origin,path.resolve(out,'../media'));
  assert.deepEqual(report.errors,[]);
 }finally{
  fs.rmSync(fixtureRoot,{recursive:true,force:true});fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();admin.closeAllConnections();await new Promise(r=>admin.close(r));
 }
 console.log(JSON.stringify({views:report.views.map(v=>({w:v.w,h:v.h,enterMs:v.enterMs})),functional:report.functional,stress:report.stress,memory:report.memory,errors:report.errors},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
