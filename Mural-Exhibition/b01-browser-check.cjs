const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.B01_VALIDATION_DIR || path.join(__dirname,'../docs/validation/b02-2026-10-06/b01-regression'));fs.mkdirSync(out,{recursive:true});
const url='http://localhost:3000/index.html';
const state=p=>p.evaluate(()=>document.body.dataset.explorationState);
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={visual:[],functional:[],errors:[],camera:'Real camera and gesture hardware NOT verified'};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));const requests=[];page.on('request',r=>requests.push(r.url()));
  for(const [w,h] of [[1440,900],[1920,1080],[1366,768],[1280,800]]){
   await page.setViewportSize({width:w,height:h});const start=Date.now();await page.goto(url);await page.locator('#btn-gallery-track').waitFor();
   await page.waitForFunction(()=>document.querySelector('.splash-image').dataset.ready!==undefined);
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.splash-image')).opacity==='1');
   assert.equal(await state(page),'selection');
   const layout=await page.evaluate(()=>{
    const els=['.b01-brand','.b01-label','.splash-title','.b01-description',...['#btn-gallery-track','#btn-cyber-track']];
    return {overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelectorAll('canvas').length,rects:els.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {s,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,scroll:e.scrollWidth,client:e.clientWidth};}),resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.transferSize,duration:r.duration})),load:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd};
   });assert.ok(!layout.overflow);for(const r of layout.rects){assert.ok(r.x>=0&&r.y>=0&&r.right<=w&&r.bottom<=h,JSON.stringify(r));assert.ok(r.scroll<=r.client+1,JSON.stringify(r));}
   assert.equal(layout.canvas,1,'Only the pre-existing output canvas, no renderer in B01');
   assert.ok(!layout.resources.some(r=>/splash-bg|scan-assets|three|mediapipe|gsap|\/org.png|\/line.png|\/color.png/.test(r.url)));
   await shot(page,`b01-${w}x${h}`);report.visual.push({w,h,elapsed:Date.now()-start,...layout});
  }
  await page.setViewportSize({width:1440,height:900});await page.locator('#btn-gallery-track').hover();await shot(page,'b01-hover');
  await page.locator('#btn-cyber-track').focus();await shot(page,'b01-focus');
  await page.keyboard.press('Tab');await page.keyboard.press('Tab'); // Return to a known native entry before Enter.
  await page.locator('#btn-gallery-track').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map',{},{timeout:30000});
  assert.equal(await page.locator('.hotspot').count(),8);await shot(page,'gallery-map');
  const transform=await page.locator('#panorama-wrapper').getAttribute('style');await page.mouse.move(700,600);await page.mouse.wheel(0,-300);await page.waitForTimeout(100);assert.notEqual(await page.locator('#panorama-wrapper').getAttribute('style'),transform);
  await page.mouse.move(700,500);await page.mouse.down();await page.mouse.move(1000,600,{steps:10});await page.mouse.up();
  // Reach the existing leftmost hotspots by dragging the oversized map to its left edge.
  for(let i=0;i<12;i++){await page.mouse.move(300,500);await page.mouse.down();await page.mouse.move(1300,500,{steps:10});await page.mouse.up();}
  await shot(page,'gallery-map-hotspots');const first=page.locator('.hotspot').first();await first.click();await page.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');
  await page.waitForFunction(()=>document.getElementById('img-org').naturalWidth>0);await shot(page,'gallery-detail');
  await page.getByRole('button',{name:'高清线稿',exact:true}).click();await page.waitForFunction(()=>document.getElementById('img-line').style.opacity==='1');
  await page.getByRole('button',{name:'数字色稿',exact:true}).click();await page.waitForFunction(()=>document.getElementById('img-color').style.opacity==='1');
  await page.getByRole('button',{name:'原壁画',exact:true}).click();await page.locator('#back-btn').click();assert.equal(await state(page),'gallery-map');
  await page.locator('#pano-back-btn').click();assert.equal(await state(page),'selection');assert.ok(await page.locator('#btn-gallery-track').isEnabled());
  report.functional.push('native keyboard Enter; map original image/8 hotspots; drag/wheel; hotspot to detail; org/line/color; detail→map→B01');
  // Real external dependencies + browser camera denial. This is not a hardware success claim.
  await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};window.alert=()=>{};});
  await page.reload();await page.locator('#btn-cyber-track').click();
  await page.waitForFunction(()=>document.body.dataset.explorationState==='cyber'||!document.getElementById('entry-retry').hidden,{},{timeout:60000});
  if(await state(page)==='cyber'){
   await page.locator('#entry-mode-notice').waitFor({state:'visible',timeout:25000});await shot(page,'cyber-permission');
   report.functional.push('real cyber dependencies and renderer; injected NotAllowedError');
   await page.locator('#entry-mode-notice button').click();assert.equal(await state(page),'selection');
  }else{await shot(page,'cyber-dependency-error');report.functional.push('external cyber dependency error reported, return/retry available');}
  // Deterministic lifecycle: use real renderer/gsap/Hands, replace only Camera hardware boundary.
  await page.evaluate(()=>{
   window.__starts=0;window.__stops=0;window.__active=0;window.__max=0;
   window.Camera=class{constructor(v,o){this.v=v;this.o=o;} async start(){window.__starts++;window.__active++;window.__max=Math.max(window.__max,window.__active);this.running=true;} stop(){if(this.running){window.__stops++;window.__active--;this.running=false;}}};
  });
  for(let i=0;i<3;i++){
   await page.locator('#btn-cyber-track').click();await page.waitForFunction(()=>document.body.dataset.explorationState==='cyber');
   await page.locator('#quick-switch-btn').click();assert.equal(await state(page),'gallery-detail');
   await page.locator('#quick-switch-btn').click();await page.waitForFunction(()=>document.body.dataset.explorationState==='cyber');
   await page.locator('#back-btn').click();assert.equal(await state(page),'selection');
  }
  report.lifecycle=await page.evaluate(()=>({starts:__starts,stops:__stops,active:__active,max:__max,renderers:document.querySelectorAll('#webgl-container canvas').length,visible:['splash-screen','main-app','panorama-view'].filter(id=>!document.getElementById(id).hidden)}));
  assert.deepEqual(report.lifecycle,{starts:6,stops:6,active:0,max:1,renderers:1,visible:['splash-screen']});report.functional.push('6 simulated camera sessions; max 1; all stopped; single existing renderer; repeated cyber↔gallery↔selection');
  // Distinct device failures and late permission completion after navigation away.
  for(const name of ['NotFoundError','NotReadableError','NotAllowedError']){
   await page.evaluate(name=>{window.Camera=class{start(){return Promise.reject(new DOMException('device failure',name));}stop(){}};},name);
   await page.locator('#btn-cyber-track').click();await page.locator('#entry-mode-notice').waitFor({state:'visible'});assert.equal(await state(page),'cyber');
   await page.locator('#entry-mode-notice button').click();assert.equal(await state(page),'selection');report.functional.push(name+' message and return');
  }
  await page.evaluate(()=>{window.__lateStopped=0;window.Camera=class{start(){return new Promise(r=>window.__releaseCamera=r);}stop(){window.__lateStopped++;}};});
  await page.locator('#btn-cyber-track').click();await page.waitForFunction(()=>document.body.dataset.explorationState==='cyber');await page.locator('#back-btn').click();
  await page.evaluate(()=>window.__releaseCamera());await page.waitForTimeout(50);assert.equal(await state(page),'selection');assert.equal(await page.evaluate(()=>__lateStopped),2);report.functional.push('late camera startup after return is stopped');
  await page.locator('#btn-gallery-track').evaluate(e=>{for(let i=0;i<20;i++)e.click();});await page.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');await page.locator('#pano-back-btn').click();report.functional.push('20 rapid entry clicks serialize');
  for(const [route,label] of [['**/api/scan-assets','asset-api-error'],['**/gallery/mural-02-detail.webp','map-image-error']]){
   const p=await browser.newPage();await p.route(route,r=>r.abort());await p.goto(url);await p.locator('#btn-gallery-track').click();await p.locator('#entry-retry').waitFor({state:'visible'});assert.equal(await state(p),'selection');assert.ok(await p.locator('#btn-gallery-track').isEnabled());await shot(p,label);await p.unroute(route);await p.locator('#entry-retry').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map',{},{timeout:30000});await p.close();report.functional.push(label+' recovery');
  }
  const missing=await browser.newPage();await missing.route('**/b01/mural-02-left.webp',r=>r.abort());await missing.goto(url);await missing.getByRole('button',{name:'重试图像'}).waitFor();assert.ok(await missing.locator('#btn-gallery-track').isEnabled());await shot(missing,'splash-image-error');await missing.unroute('**/b01/mural-02-left.webp');await missing.getByRole('button',{name:'重试图像'}).click();await missing.waitForFunction(()=>document.querySelector('.splash-image').dataset.ready!==undefined);await missing.close();
  const reduced=await browser.newPage({reducedMotion:'reduce'});await reduced.goto(url);assert.equal(await reduced.locator('.splash-image').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await reduced.locator('#btn-gallery-track').focus();await reduced.keyboard.press('Space');await reduced.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');await reduced.close();report.functional.push('homepage image failure/retry; reduced motion; Space native entry');
  const offline=await browser.newPage();await offline.route('**/*',r=>r.request().url().startsWith('https:')?r.abort():r.continue());await offline.goto(url);await offline.locator('#btn-cyber-track').click();await offline.locator('#entry-retry').waitFor({state:'visible'});assert.equal(await state(offline),'selection');assert.ok(await offline.locator('#btn-gallery-track').isEnabled());await shot(offline,'cyber-dependency-error');report.functional.push('blocked CDN shows retry and gallery remains usable');await offline.close();
  const threeFailed=await browser.newPage();await threeFailed.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};window.alert=()=>{};});
  await threeFailed.route('**/three.module.js',r=>r.abort());await threeFailed.goto(url);await threeFailed.locator('#btn-cyber-track').click();await threeFailed.locator('#entry-retry').waitFor({state:'visible'});await threeFailed.unroute('**/three.module.js');await threeFailed.locator('#entry-retry').click();await threeFailed.waitForFunction(()=>document.body.dataset.explorationState==='cyber',{},{timeout:30000});await threeFailed.locator('#entry-mode-notice').waitFor({state:'visible'});await threeFailed.close();report.functional.push('failed cached Three ES module import recovers on retry');
  const unsupported=await browser.newPage();await unsupported.addInitScript(()=>{navigator.mediaDevices.getUserMedia=undefined;});await unsupported.goto(url);await unsupported.locator('#btn-cyber-track').click();await unsupported.locator('#entry-retry').waitFor({state:'visible'});assert.match(await unsupported.locator('#entry-status').textContent(),/不支持摄像头/);await unsupported.close();report.functional.push('unsupported camera returns to selection');
  // A08 uses its real link and native history. Module A files are read-only.
  const a=await browser.newPage({viewport:{width:1440,height:900}});a.on('pageerror',e=>report.errors.push('A: '+e.message));
  await a.goto('http://127.0.0.1:4175/module-a/a01/');await a.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
  await a.evaluate(()=>scrollTo(0,42*innerHeight));await a.waitForFunction(()=>!document.querySelector('.a08').hidden&&document.querySelector('.mural-guide[data-chapter="07"] img').naturalWidth>0);await a.waitForTimeout(400);await shot(a,'a08-source');
  await a.locator('.a08 a').click();await a.waitForURL(url);await a.waitForFunction(()=>document.body.dataset.explorationState==='selection');
  await a.goBack();await a.waitForFunction(()=>document.querySelector('.a08')&&!document.querySelector('.a08').hidden);await a.waitForTimeout(400);assert.ok(Math.abs(await a.evaluate(()=>scrollY/innerHeight)-42)<.02);
  await a.locator('.a08 a').click();await a.waitForURL(url);await a.reload();assert.equal(await state(a),'selection');report.functional.push('real A08→B01→native back restores A08 at 42 screens; direct refresh');await a.close();
  assert.deepEqual(report.errors,[]);
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exit(1);});
