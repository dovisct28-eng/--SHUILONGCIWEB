const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../docs/validation/b03-v2-2026-10-06');fs.mkdirSync(out,{recursive:true});
const origin=process.env.B_VALIDATION_ORIGIN || 'http://localhost:3000',url=origin+'/index.html',report={environment:{browser:'Chrome headless; actual Three.js, GSAP and MediaPipe libraries',node:process.version,origin},views:[],functional:[],errors:[],hardware:'Camera device boundary is simulated. Real camera and physical hand tracking NOT verified.'};
const state=p=>p.evaluate(()=>document.body.dataset.explorationState);
const shot=async(p,name)=>{await p.waitForTimeout(550);await p.screenshot({path:path.join(out,name+'.png')});};
const ready=p=>p.waitForFunction(()=>document.getElementById('img-org').style.opacity==='1'&&!document.getElementById('info-text').textContent.includes('正在读取'));
const cyberReady=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading'),null,{timeout:40000});
const select=async(p,index)=>{await p.locator('#index-toggle').click();await p.locator('#menu button').nth(index).click();await ready(p);};
const instrument=`
window.__b03={ gesture:handleGestureLogic, select:loadSeriesData,
 snapshot(){
  lineMesh?.updateMatrixWorld();
  const projected=muralSize&&camera?[-1,1].flatMap(x=>[-1,1].map(y=>{const p=new THREE.Vector3(x*muralSize.planeWidth/2,y*muralSize.planeHeight/2,0);if(figureMode)p.applyMatrix4(lineMesh.matrixWorld);else p.z=-.05;p.project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};})):[];
  return {id:currentItemData?.id,index:currentSeriesIndex,revealed:isRevealed,figureMode,opacity:lineMesh?.material.opacity,measurement:figureMeasurement,stageLayout,grid:colorPoints?.geometry.attributes.position.count,glFrame,rendererCount:document.querySelectorAll('#webgl-container canvas').length,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,camera:camera?{x:camera.position.x,z:camera.position.z}:null,projected};
 }};`;
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-precise-memory-info']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));const resources=[];page.on('request',r=>resources.push(r.url()));
  await page.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await page.addInitScript(()=>{
   window.__camera={starts:0,stops:0,active:0,max:0};
   window.Camera=class{async start(){this.running=true;__camera.starts++;__camera.active++;__camera.max=Math.max(__camera.max,__camera.active);}stop(){if(this.running){this.running=false;__camera.stops++;__camera.active--;}}};
  });
  await page.goto(url);await page.locator('#btn-gallery-track').click();await page.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');
  const data=(await(await page.request.get(origin+'/api/scan-assets')).json()).data;assert.equal(data.length,8);assert.ok(data[0].figurePath);assert.ok(data[0].previews.org);
  await page.mouse.move(200,300);await page.mouse.wheel(0,-180);await page.waitForTimeout(100);
  await page.locator('.hotspot[data-ids="01"]').click();await ready(page);
  for(let i=0;i<data.length;i++){
   if(i)await select(page,i);
   assert.equal(await page.locator('#info-title').textContent(),data[i].name);
   assert.equal(await page.evaluate(()=>__b03.snapshot().id),data[i].id);
   assert.ok((await page.locator('#img-org').getAttribute('src')).includes(encodeURIComponent(data[i].folderName)));
   const dimensions=await page.locator('#img-org').evaluate(i=>({w:i.naturalWidth,h:i.naturalHeight,fit:getComputedStyle(i).objectFit,filter:getComputedStyle(i).filter}));
   assert.equal(dimensions.fit,'contain');assert.equal(dimensions.filter,'none');await shot(page,`character-${data[i].id}`);
  }
  await select(page,0);report.functional.push('Eight existing stable IDs, names, original images and archives; unmodified ratios/colors');
  for(const [w,h] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await page.setViewportSize({width:w,height:h});
   assert.equal(await state(page),'gallery-detail');await page.getByRole('button',{name:'原壁画',exact:true}).click();await ready(page);await page.waitForTimeout(300);
   await shot(page,`gallery-default-${w}x${h}`);
   const layout=await page.evaluate(()=>{const r=id=>{const b=document.getElementById(id).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};};return {overflow:document.documentElement.scrollWidth>innerWidth,image:r('gallery-container'),panel:r('floating-info'),scrollHeight:document.getElementById('info-text').scrollHeight,clientHeight:document.getElementById('info-text').clientHeight};});
   assert.ok(!layout.overflow);assert.ok(layout.image.right<layout.panel.x);assert.ok(layout.scrollHeight>layout.clientHeight);
   await page.locator('#info-text').evaluate(e=>e.scrollTop=e.scrollHeight);await shot(page,`gallery-long-${w}x${h}`);
   await page.getByRole('button',{name:'高清线稿',exact:true}).click();await page.waitForFunction(()=>document.getElementById('img-line').style.opacity==='1');await page.waitForTimeout(300);await shot(page,`gallery-line-${w}x${h}`);
   await page.getByRole('button',{name:'数字色稿',exact:true}).click();await page.waitForFunction(()=>document.getElementById('video-color').style.opacity==='1');
   await page.locator('#video-color').evaluate(v=>v.dispatchEvent(new Event('ended')));await page.waitForTimeout(300);await shot(page,`gallery-color-${w}x${h}`);assert.equal(await page.locator('#video-color').getAttribute('src'),null);
   await page.locator('#index-toggle').click();await shot(page,`gallery-index-${w}x${h}`);await page.keyboard.press('Escape');assert.ok(await page.locator('#floating-menu').isHidden());
   await page.locator('#quick-switch-btn').click();await cyberReady(page);assert.equal(await page.evaluate(()=>__b03.snapshot().id),'01');if(w===1920){await page.waitForTimeout(120);await page.screenshot({path:path.join(out,'cyber-entry-feedback.png')});}await page.waitForFunction(()=>__b03.snapshot().opacity>=.999);await shot(page,`cyber-default-${w}x${h}`);
   assert.ok(await page.locator('#floating-info').evaluate(e=>e.inert));assert.ok(await page.locator('#layer-controls').isHidden());
   await page.locator('#reveal-toggle').click();await page.waitForFunction(()=>getComputedStyle(document.getElementById('floating-info')).opacity==='1');await page.waitForTimeout(100);await shot(page,`cyber-revealed-${w}x${h}`);
   const snapshot=await page.evaluate(()=>__b03.snapshot()),panel=await page.locator('#floating-info').boundingBox();
   assert.ok(snapshot.projected.every(p=>p.x>=29&&p.x<=panel.x-20&&p.y>=90&&p.y<=h-110),JSON.stringify({snapshot,panel}));assert.equal(snapshot.rendererCount,1);assert.ok(snapshot.figureMode);assert.ok(snapshot.grid<=80000);assert.ok(!(await page.locator('#info-text').textContent()).includes('一、'));assert.match(await page.locator('#info-text').textContent(),/人物介绍待补充/);
   await page.locator('#reveal-toggle').click();await page.waitForTimeout(850);await shot(page,`cyber-closed-${w}x${h}`);await page.locator('#quick-switch-btn').click();await ready(page);assert.equal(await page.evaluate(()=>__b03.snapshot().id),'01');assert.equal(await page.evaluate(()=>__b03.snapshot().glFrame),null);
   report.views.push({w,h,layout,cyber:snapshot});
  }
  report.functional.push('Four sizes: actual default/long/line/color/index and cyber default/revealed screenshots; projected plane avoids real panel; same person across modes');
  // Same viewport for the preservation assertion: resizing legitimately clamps panY.
  await page.locator('#back-btn').click();await page.setViewportSize({width:1440,height:900});await page.locator('#pano-reset-btn').click();await page.mouse.move(200,300);await page.mouse.wheel(0,-180);await page.waitForTimeout(100);
  const restored=await page.locator('#panorama-wrapper').getAttribute('style');await page.locator('.hotspot[data-ids="01"]').click();await ready(page);await page.locator('#back-btn').click();assert.equal(await page.locator('#panorama-wrapper').getAttribute('style'),restored);await page.locator('.hotspot[data-ids="01"]').click();await ready(page);
  await select(page,1);await page.route('**/'+encodeURIComponent(data[1].folderName)+'/line.png',r=>r.abort());
  await page.getByRole('button',{name:'高清线稿',exact:true}).click();await page.locator('#study-retry').waitFor({state:'visible'});assert.equal(await page.locator('#img-org').evaluate(e=>e.style.opacity),'1');await shot(page,'layer-failure-retained');
  await page.unroute('**/'+encodeURIComponent(data[1].folderName)+'/line.png');await page.locator('#study-retry').click();await page.waitForFunction(()=>document.getElementById('img-line').style.opacity==='1');
  await page.route('**/'+encodeURIComponent(data[2].folderName)+'/info.txt',r=>r.fulfill({status:500,body:'failed'}));await select(page,2);await page.getByRole('button',{name:'重试档案'}).waitFor();await shot(page,'archive-failure');await page.unroute('**/'+encodeURIComponent(data[2].folderName)+'/info.txt');await page.getByRole('button',{name:'重试档案'}).click();await ready(page);
  // Rapid load completions and old videos must not overwrite the final selection.
  await page.evaluate(()=>{__b03.select(0);window.switchLayer('color');__b03.select(1);window.switchLayer('line');__b03.select(2);});await ready(page);await page.waitForTimeout(500);
  assert.equal(await page.locator('#info-title').textContent(),data[2].name);assert.equal(await page.locator('#video-color').getAttribute('src'),null);assert.equal(await page.locator('#img-line').getAttribute('src'),null);
  report.functional.push('Panorama transform restored; failed layer retains original and retries; archive retries; fast switches keep final archive/image and release video');
  await select(page,0);await page.getByRole('button',{name:'数字色稿',exact:true}).click();await page.waitForFunction(()=>document.getElementById('video-color').style.opacity==='1');
  await page.locator('#video-color').evaluate(v=>{v.currentTime=v.duration-.2;});await page.waitForFunction(()=>!document.getElementById('video-color').hasAttribute('src'));assert.equal(await page.locator('#img-color').evaluate(i=>i.style.opacity),'1');
  // Delayed archive completion after changing ID; delayed video metadata after exit.
  await page.route('**/'+encodeURIComponent(data[1].folderName)+'/info.txt',async r=>{await new Promise(resolve=>setTimeout(resolve,600));await r.fulfill({body:'过期档案测试文字'}).catch(()=>{});});
  await page.evaluate(()=>{__b03.select(1);__b03.select(2);});await ready(page);await page.waitForTimeout(700);assert.ok(!(await page.locator('#info-text').textContent()).includes('过期档案'));await page.unroute('**/'+encodeURIComponent(data[1].folderName)+'/info.txt');
  await select(page,1);await page.route('**/'+encodeURIComponent(data[1].folderName)+'/video.mp4',async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.continue().catch(()=>{});});
  await page.getByRole('button',{name:'数字色稿',exact:true}).click();await page.waitForFunction(()=>document.getElementById('img-color').style.opacity==='1');await page.locator('#back-btn').click();await page.waitForTimeout(700);assert.equal(await page.locator('#video-color').getAttribute('src'),null);await page.unroute('**/'+encodeURIComponent(data[1].folderName)+'/video.mp4');
  await page.locator('.hotspot[data-ids="01"]').click();await ready(page);
  report.functional.push('Actual decoded video playback and browser ended event restore color still; delayed archive and video completions cannot survive switch/exit');
  // API fixture only: no author data/files are changed.
  const fixture=await browser.newPage({viewport:{width:1440,height:900}});fixture.on('pageerror',e=>report.errors.push(e.message));
  const extra={...data[0],id:'test-only',name:'测试人物（仅原图）',englishName:'Provided Test Name',figurePath:null,position:{x:2,y:35},sources:[{title:'测试来源',url:'javascript:alert(1)'}],resources:{...data[0].resources,line:null,color:null,figure:null,video:null,info:'/test-info.md'},linePath:null,colorPath:null,videoPath:null,infoPath:'/test-info.md'};
  await fixture.route('**/api/scan-assets',r=>r.fulfill({json:{success:true,data:[...data,extra],diagnostics:[]}}));await fixture.route('**/test-info.md',r=>r.fulfill({body:'# 图像观察\n仅测试排版，不是史料。\n\n<script>window.__unsafe=true</script>\n\n## 相关研究\n原文 **标记** 保留。'}));
  await fixture.goto(url);await fixture.locator('#btn-gallery-track').click();await fixture.locator('.hotspot[data-ids="test-only"]').click();await ready(fixture);
  assert.equal(await fixture.locator('#menu button').count(),9);assert.ok(await fixture.getByRole('button',{name:'高清线稿',exact:true}).isDisabled());assert.ok(await fixture.getByRole('button',{name:'数字色稿',exact:true}).isDisabled());assert.equal(await fixture.evaluate(()=>window.__unsafe),undefined);assert.equal(await fixture.locator('#info-text a').count(),0);assert.equal(await fixture.locator('#archive-english').textContent(),'Provided Test Name');
  await fixture.locator('#quick-switch-btn').click();await fixture.locator('#entry-mode-notice').waitFor({state:'visible'});assert.equal(await state(fixture),'gallery-detail');assert.equal(await fixture.locator('#info-title').textContent(),extra.name);await shot(fixture,'original-only-safe-markdown');await fixture.close();report.functional.push('Dynamic ninth ID; original-only; provided English/sources; HTML remains text; unsafe source URL rejected; no silent switch to unrelated cyber character');
  await select(page,0);await page.locator('#quick-switch-btn').click();await cyberReady(page);
  // Synthetic landmarks enter the original gesture function, without altering its math.
  const gesture=async(distance,y=.5)=>page.evaluate(({distance,y})=>{
   const hand=x=>Array.from({length:21},(_,i)=>({x:x+(i===9?.01:0),y:i===0?y+.15:y,z:0}));const a=hand(.2),b=hand(.2+distance);a[8].y=b[8].y=y;__b03.gesture([a,b]);
  },{distance,y});
  await gesture(.5);await page.waitForTimeout(1650);assert.ok(await page.evaluate(()=>__b03.snapshot().revealed));await page.locator('#info-text').evaluate(e=>{const p=document.createElement('p');p.textContent='仅用于滚动验证的长简介测试，不是正式史料。'.repeat(100);e.prepend(p);});await gesture(.5,.8);assert.ok(await page.locator('#info-text').evaluate(e=>e.scrollTop)>0);
  await gesture(.1);await page.waitForTimeout(1650);assert.ok(!await page.evaluate(()=>__b03.snapshot().revealed));assert.equal(await page.evaluate(()=>__b03.snapshot().camera.x),0);
  const beforeRevealRequests=resources.length;await gesture(.5);await gesture(.1);await gesture(.5);await page.waitForTimeout(1650);assert.ok(await page.evaluate(()=>__b03.snapshot().revealed));assert.equal(resources.length,beforeRevealRequests);
  const counts=await page.evaluate(()=>__b03.snapshot());await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>__b03.snapshot().textures),counts.textures);assert.equal(await page.evaluate(()=>__b03.snapshot().geometries),counts.geometries);
  await gesture(.1);await page.evaluate(()=>{
   const original=Date.now;let time=original()+2000;
   try{Date.now=()=>time;for(let frame=0;frame<8;frame++){time+=45;const x=.2+frame*.05;const hand=Array.from({length:21},()=>({x,y:.5,z:0}));hand[0].y=.65;hand[5].x=x-.04;hand[17].x=x+.04;for(const i of [8,12,16,20])hand[i].y=.25;__b03.gesture([hand]);}}finally{Date.now=original;}
  });await cyberReady(page);assert.equal(await page.evaluate(()=>__b03.snapshot().id),'02');assert.equal(await page.locator('#info-title').textContent(),data[1].name);assert.ok(!await page.evaluate(()=>__b03.snapshot().revealed));
  await page.locator('#back-btn').click();assert.equal(await state(page),'selection');assert.equal(await page.evaluate(()=>__camera.active),0);
  report.functional.push('Original synthetic two-hand reveal/scroll/close; interrupted transitions settle; resize keeps textures/geometries; original one-hand swipe advances ID and resets archive; exit stops camera boundary');
  await page.locator('#btn-cyber-track').click();await cyberReady(page);await page.locator('#reveal-toggle').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.getElementById('reveal-toggle').getAttribute('aria-expanded')==='true');await page.locator('#info-text').focus();await page.keyboard.press('Escape');assert.ok(!await page.evaluate(()=>__b03.snapshot().revealed));await page.keyboard.press('i');assert.ok(await page.evaluate(()=>__b03.snapshot().revealed));await page.keyboard.press('Escape');await page.keyboard.press('ArrowRight');await cyberReady(page);assert.equal(await page.evaluate(()=>__b03.snapshot().id),'03');await page.locator('#back-btn').click();
  // Existing renderer + delayed new texture request, then leave before completion.
  await page.locator('#btn-cyber-track').click();await cyberReady(page);await page.route('**/'+encodeURIComponent(data[3].folderName)+'/color.png',async r=>{await new Promise(resolve=>setTimeout(resolve,600));await r.continue().catch(()=>{});});
  await page.evaluate(()=>__b03.select(3));await page.waitForFunction(()=>document.getElementById('webgl-container').hasAttribute('data-loading'));await page.locator('#back-btn').click();await page.waitForTimeout(700);assert.equal(await state(page),'selection');assert.equal(await page.evaluate(()=>__b03.snapshot().glFrame),null);assert.equal(await page.evaluate(()=>__camera.active),0);await page.unroute('**/'+encodeURIComponent(data[3].folderName)+'/color.png');
  report.functional.push('Native keyboard reveal and shared I/Escape/arrow fallback; exit during actual new texture request cancels late upload and RAF');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#btn-cyber-track').click();await cyberReady(page);await page.locator('#reveal-toggle').click();await page.waitForTimeout(100);assert.equal(await page.locator('#floating-info').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await shot(page,'reduced-motion');
  const client=await page.context().newCDPSession(page);await client.send('HeapProfiler.collectGarbage');const memoryStart=await client.send('Runtime.getHeapUsage');
  const rendererMemory=[];for(let i=0;i<12;i++){await page.evaluate(index=>__b03.select(index),i%8);await cyberReady(page);await page.waitForTimeout(100);const s=await page.evaluate(()=>__b03.snapshot());assert.equal(s.textures,s.figureMode?1:2);assert.equal(s.geometries,s.figureMode?1:2);rendererMemory.push({id:s.id,textures:s.textures,geometries:s.geometries});}
  await client.send('HeapProfiler.collectGarbage');report.performance={cyberVisits:12,rendererMemory,heapStart:memoryStart,heapEnd:await client.send('Runtime.getHeapUsage'),revealRequests:0,scope:'Single Chrome headless process; explicit GC; JS heap and renderer object counts, excludes process RSS/decoded image and GPU bytes. No physical FPS claim.'};await page.locator('#back-btn').click();
  report.lifecycle=await page.evaluate(()=>__camera);assert.equal(report.lifecycle.active,0);assert.equal(report.lifecycle.max,1);
  assert.deepEqual(report.errors,[]);
 }catch(error){report.failure=error.message;const pages=browser.contexts().flatMap(c=>c.pages());for(const p of pages){report.failureState=await p.evaluate(()=>({state:document.body.dataset.explorationState,notice:document.getElementById('entry-mode-notice')?.textContent,status:document.getElementById('cyber-asset-status')?.textContent})).catch(()=>({}));await shot(p,'failure-diagnostic').catch(()=>{});}throw error;
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
