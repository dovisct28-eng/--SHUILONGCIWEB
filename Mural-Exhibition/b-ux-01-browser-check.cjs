const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createApp}=require('./server.js');
const {syntheticCamera,person}=require('./b03-gesture-fixtures.cjs');
const out=path.resolve(process.env.B_UX_BROWSER_DIR||'../docs/validation/b-ux-01-2026-10-08/local/ux');fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'results.json')))fs.copyFileSync(path.join(out,'results.json'),path.join(out,`results-attempt-${Date.now()}.json`));
const baseline=process.env.B_UX_BEFORE==='1';
const report={status:'NOT_TESTED',baseline,scope:'Actual Chrome/WebGL/GSAP; production camera callbacks with synthetic stream and model outputs. Physical camera PENDING.',views:[],cases:[],errors:[]};
const instrument=`window.__ux={snapshot(){return {id:currentItemData?.id,reading:isRevealed,phase:webglContainer.dataset.phase,loading:webglContainer.hasAttribute('data-loading'),camera:cameraLifecycle.state,hand:handOwnership.snapshot(performance.now()),pointer:controlPointer,dwell:dwellController.snapshot(),targets:dwellFeedback.targets,region:dwellFeedback.region,context:gestureContext(),figureMode,effective:stageLayout?.effective};}};`;
const snap=p=>p.evaluate(()=>__ux.snapshot());
const ready=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!__ux.snapshot().loading&&__ux.snapshot().phase==='stable',null,{timeout:40000});
const original=p=>p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org'&&document.getElementById('img-org').naturalWidth>0);
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
const hand=(x=.5,y=.5)=>{const raw=1-x,lm=Array.from({length:21},()=>({x:raw,y,z:0}));lm[0].y=y+.09;lm[5].x=raw-.035;lm[17].x=raw+.035;return lm;};
async function input(p,hands,ms=700){await p.evaluate(v=>{__camera.latest=v;},{hands,poses:[person({hands,upper:true,missingWrists:['right']})]});await p.waitForTimeout(ms);}
async function release(p){await input(p,[hand()],100);await p.waitForFunction(()=>{const s=__ux.snapshot();return s.pointer.valid&&s.pointer.stable&&!s.dwell.releaseRequired&&s.dwell.state==='READY';},null,{timeout:10000});}
async function pointTarget(p,id,ms=1800){const value=await p.evaluate(id=>{const t=__ux.snapshot().targets.find(t=>t.id===id);return {x:.2+.6*(t.x+t.width/2)/innerWidth,y:.2+.6*(t.y+t.height/2)/innerHeight};},id);await input(p,[hand(value.x,value.y)],ms);}
async function geometry(p,selectors){return p.evaluate(selectors=>{
 const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
 return {overflow:document.documentElement.scrollWidth>innerWidth,items:selectors.map(s=>{const e=document.querySelector(s),style=getComputedStyle(e);return {s,...rect(e),visible:!!e.getClientRects().length&&style.visibility!=='hidden',opacity:style.opacity};})};
},selectors);}
function noOverlap(a,b){return a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y;}
(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const origin='http://localhost:'+server.address().port;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/index.html*',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:(await res.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await syntheticCamera(p,{realDrawing:true});
  for(const [width,height]of (baseline?[[1440,900]]:[[1920,1080],[1440,900],[1366,768],[1280,800]])){
   await p.setViewportSize({width,height});await p.goto(origin+'/index.html');await p.waitForFunction(()=>document.getElementById('splash-bg-img').dataset.ready!==undefined);await p.waitForTimeout(450);
   const entry=await geometry(p,['.b01-copy','.splash-actions','.b01-feedback',...(baseline?[]:['.b01-mode-help'])]);assert.equal(entry.overflow,false);assert.ok(entry.items.every(r=>r.right<=width&&r.bottom<=height));await shot(p,`b01-${width}x${height}`);
   if(!baseline){assert.match(await p.locator('#b01-gallery-help').textContent(),/鼠标/);assert.match(await p.locator('#b01-cyber-help').textContent(),/摄像头.*单手/);assert.equal(await p.locator('#btn-cyber-track').getAttribute('aria-describedby'),'b01-cyber-help');}
   await p.locator('#btn-gallery-track').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');
   assert.equal(await p.locator('.hotspot').count(),8);assert.equal(await p.locator('#gallery-hint').evaluate(e=>getComputedStyle(e).opacity),'1');await shot(p,`b02-${width}x${height}`);
   const marker=p.locator('.hotspot[data-ids="01"]');await marker.focus();await p.waitForFunction(()=>getComputedStyle(document.querySelector('.hotspot[data-ids="01"] .hotspot-tooltip')).opacity==='1');await shot(p,`b02-focus-${width}x${height}`);await p.keyboard.press('Enter');await original(p);await p.waitForTimeout(500);await shot(p,`detail-${width}x${height}`);
   const detail=await geometry(p,['#layer-controls','.image-caption','.study-footer','#floating-info','#back-btn','#quick-switch-btn']);assert.equal(detail.overflow,false);assert.ok(noOverlap(detail.items[0],detail.items[1]));assert.ok(noOverlap(detail.items[1],detail.items[2]));
   await p.locator('#index-toggle').click();assert.equal(await p.locator('#index-toggle').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.ok(await p.locator('#index-toggle').evaluate(e=>e===document.activeElement));
   await p.locator('#back-btn').click();if(!baseline){assert.equal(await marker.getAttribute('aria-pressed'),'true');await p.waitForTimeout(300);assert.equal(await p.locator('#gallery-hint').evaluate(e=>getComputedStyle(e).opacity),'0');}
   await marker.click();await original(p);await p.locator('#quick-switch-btn').click();await ready(p);await p.waitForFunction(()=>__ux.snapshot().camera==='RUNNING');assert.equal((await snap(p)).id,'01');await input(p,[],1000);await shot(p,`b03-${width}x${height}`);
   // Drive the real V4.2 camera callback, ownership and dwell controller.
   await release(p);assert.equal((await snap(p)).pointer.valid,true);await shot(p,`cursor-${width}x${height}`);
   await pointTarget(p,'view',1500);await p.waitForFunction(()=>__ux.snapshot().reading);await ready(p);await p.waitForTimeout(1900);await shot(p,`reading-${width}x${height}`);
   const layout=await geometry(p,['.gesture-hint','.cyber-controls','#camera-feed-container','#floating-info','[data-dwell-target="view"]']);assert.equal(layout.overflow,false);assert.ok(layout.items[0].bottom<layout.items[1].y);assert.ok(noOverlap(layout.items[0],layout.items[2]));assert.ok(noOverlap(layout.items[0],layout.items[3]));
   if(!baseline){await release(p);await p.waitForFunction(()=>document.querySelector('.gesture-hint').dataset.tone==='quiet');}
   await input(p,[],150);await shot(p,`interrupted-${width}x${height}`);if(!baseline)assert.match(await p.locator('#gesture-message').textContent(),/暂停|释放|单手/);
   assert.equal((await snap(p)).pointer.valid,false);await release(p);await pointTarget(p,'view',1800);await p.waitForFunction(()=>!__ux.snapshot().reading);await ready(p);await release(p);await pointTarget(p,'next',1800);await p.waitForFunction(()=>__ux.snapshot().id==='02');await ready(p);
   await p.locator('#quick-switch-btn').click();await original(p);assert.equal((await snap(p)).id,'02');
   if(!baseline)assert.equal(await p.locator('#webgl-container').evaluate(e=>getComputedStyle(e).visibility),'hidden');
   await p.waitForFunction(()=>getComputedStyle(document.getElementById('floating-info')).opacity==='1');await shot(p,`mode-switch-${width}x${height}`);await p.locator('#back-btn').click();await p.locator('#pano-back-btn').click();assert.equal(await p.evaluate(()=>document.body.dataset.explorationState),'selection');
   report.views.push({width,height,entry,detail,layout,status:'PASS'});
  }
  if(!baseline){
   // Index changes must select the same character when returning to the map.
   await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await original(p);await p.locator('#index-toggle').click();await p.locator('#menu li[data-id="02"] button').click();await original(p);await p.locator('#back-btn').click();assert.equal(await p.locator('.hotspot[data-ids="02"]').getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.hotspot[data-ids="01"]').getAttribute('aria-pressed'),'false');report.cases.push('Index → matching selected map hotspot PASS');
   await p.emulateMedia({reducedMotion:'reduce'});await p.goto(origin+'/index.html');await p.locator('#btn-cyber-track').click();await ready(p);await p.locator('[data-dwell-target="view"]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>__ux.snapshot().reading);assert.equal(await p.locator('.gesture-hint').evaluate(e=>getComputedStyle(e).animationName),'none');await shot(p,'reduced-motion-reading');await p.locator('[data-dwell-target="view"]').click();await p.locator('#quick-switch-btn').click();await original(p);await p.locator('#back-btn').click();await p.locator('#pano-back-btn').click();report.cases.push('Reduced motion, focused Enter, page buttons and mode switches PASS');
   await p.evaluate(()=>{__camera.cameraFailure='NotAllowedError';});await p.locator('#btn-cyber-track').click();await ready(p);await p.waitForFunction(()=>__ux.snapshot().camera==='ERROR');assert.match(await p.locator('#gesture-message').textContent(),/鼠标、键盘/);await shot(p,'camera-unavailable');await p.locator('#quick-switch-btn').click();await original(p);assert.equal(await p.evaluate(()=>document.body.dataset.explorationState),'gallery-detail');report.cases.push('Camera denied → graphically accurate error + usable gallery PASS');
   // Read-only synthetic API omissions; author files remain untouched.
   await p.goto(origin+'/index.html');const scan=await(await p.request.get(origin+'/api/scan-assets')).json();const missing=structuredClone(scan);const item=missing.data.find(i=>i.id==='01');item.resources.info=null;item.infoPath=null;item.resources.line=null;item.linePath=null;
   await p.route('**/api/scan-assets',r=>r.fulfill({json:missing}));await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await original(p);assert.match(await p.locator('#info-text').textContent(),/档案待补充/);assert.ok(await p.getByRole('button',{name:'高清线稿',exact:true}).isDisabled());assert.match(await p.locator('#detail-asset-status').textContent(),/线稿.*待补充/);await shot(p,'missing-content');report.cases.push('Empty archive + missing layer + source-needed placeholders PASS');
   await p.unroute('**/api/scan-assets');
   // Overflow body is a labeled test-only API response, never authored content.
   const overflow=structuredClone(scan);overflow.data.find(i=>i.id==='01').cyber={summary:'仅用于正文溢出回归验证的占位文字。'.repeat(80)};
   await p.route('**/api/scan-assets',r=>r.fulfill({json:overflow}));await p.goto(origin+'/index.html');await p.locator('#btn-cyber-track').click();await ready(p);await p.locator('#reveal-toggle').click();await ready(p);await release(p);assert.ok((await snap(p)).region);assert.match(await p.locator('#gesture-message').textContent(),/上下移动/);await shot(p,'overflow-reading-synthetic');await p.unroute('**/api/scan-assets');report.cases.push('Reading instructions enabled only for actual overflow; test-only summary PASS');
   await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();
   await p.route('**/assets/**/org.png',async r=>{await new Promise(resolve=>setTimeout(resolve,1200));try{const response=await r.fetch();await r.fulfill({response});}catch{}});
   await p.locator('.hotspot[data-ids="01"]').click();await p.locator('#back-btn').click();await p.locator('#pano-back-btn').click();await p.waitForTimeout(1700);assert.equal(await p.evaluate(()=>document.body.dataset.explorationState),'selection');await p.unroute('**/assets/**/org.png');report.cases.push('Return during character image loading rejects late completion PASS');
  }
  assert.equal(report.errors.length,0);report.status='PASS';
 }catch(e){report.status='FAIL';report.failure=e.stack;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));}
 console.log(JSON.stringify({status:report.status,views:report.views.length,cases:report.cases,errors:report.errors,failure:report.failure}));if(report.status!=='PASS')process.exitCode=1;
})();
