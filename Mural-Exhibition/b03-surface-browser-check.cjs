const {stubPose,fixtureInstrument}=require('./b03-gesture-fixtures.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js');
const out=path.resolve(process.env.B03_SURFACE_VALIDATION_DIR||path.join(__dirname,'../docs/validation/b03-hf-03/local/surface'));fs.mkdirSync(out,{recursive:true});
const report={environment:'Actual Chrome/Three.js/GSAP, Camera boundary stub. Formal ID01 only; ID05 is preexisting untracked local author material.',views:[],functional:[],errors:[],limits:'Software simulation completed; real camera, physical gestures and exhibition hardware pending.'};
const instrument=`window.__surface={select:loadSeriesData,reveal:setRevealed,preset(preset){const config=calibrationOverrides.get(currentItemData.id)||cyberConfig(currentItemData.cyber);config.surface={preset};calibrationOverrides.set(currentItemData.id,config);applyStageSurface();refreshCalibration()},degrade(){decorationBudget.degraded=true;applyStageSurface()},snapshot(){return {id:currentItemData?.id,figureMode,revealed:isRevealed,phase:webglContainer.dataset.phase,pigment:figureSurface?.uniforms.uPigment.value,edge:figureSurface?.uniforms.uSurface.value.w,cracks:figureSurface?.uniforms.uSurface.value.z,preset:figureSurface?.config.preset,degraded:decorationBudget.degraded,cacheSize:muralCache.size,cacheKeys:[...muralCache.keys()],opacity:lineMesh?.material.opacity,entry:orbitStage?.panels.map(p=>({panel:p.entry.panel,link:p.entry.link,node:p.entry.node,opacity:p.position.opacity})),arc:orbitStage?.presentation.arc,active:orbitStage?.active,layout:orbitStage?.currentLayout,effective:stageLayout?.effective,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,points:colorPoints?.geometry.attributes.position.count,rendererCount:document.querySelectorAll('#webgl-container canvas').length}}};`;
const ready=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading')&&__surface.snapshot().phase==='stable'&&__surface.snapshot().opacity>=.999,null,{timeout:40000});
const materialInstrument=`let comparisonMaterial;__surface.original=enabled=>{if(enabled){comparisonMaterial=lineMesh.material;lineMesh.material=new THREE.MeshBasicMaterial({map:lineMesh.material.map,transparent:true,alphaTest:.003,depthWrite:false});}else{lineMesh.material.dispose();lineMesh.material=comparisonMaterial;comparisonMaterial=null;}};__surface.clear=()=>releaseMuralStage(true);`;
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png'),timeout:20000});
async function keyframe(p,name,condition){await p.waitForFunction(condition);await p.evaluate(()=>{gsap.globalTimeline.pause();});try{await p.waitForTimeout(40);report.functional.push({keyframe:name,state:await p.evaluate(()=>__surface.snapshot())});await shot(p,name);}finally{await p.evaluate(()=>{gsap.globalTimeline.resume();});}}
(async()=>{
 const server=createApp({admin:true}).listen(0,'localhost');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:900}}),requests=[];
  p.setDefaultTimeout(20000);console.log('Surface browser: page created');
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|VALIDATE_STATUS/.test(m.text()))report.errors.push(m.text());});p.on('request',r=>requests.push(r.url()));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+materialInstrument+'\n    </script>\n</body>')});});
  await stubPose(p);await p.addInitScript(()=>window.Camera=class{async start(){}stop(){}});
  const origin=`http://localhost:${server.address().port}`;
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org');await p.locator('#quick-switch-btn').click();
  console.log('Surface browser: entering cyber');
  await keyframe(p,'pigment-forming',()=>__surface.snapshot().phase==='entering'&&__surface.snapshot().pigment>.12&&__surface.snapshot().pigment<.85);
  await keyframe(p,'orbit-forming',()=>__surface.snapshot().phase==='entering'&&__surface.snapshot().arc>.25&&__surface.snapshot().arc<.98);
  await ready(p);await p.waitForTimeout(180);assert.equal((await p.evaluate(()=>__surface.snapshot())).preset,'standard');
  const first=await p.evaluate(()=>__surface.snapshot());assert.equal(first.textures,1);assert.ok(first.points<=6000);assert.equal(first.rendererCount,1);
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(120);await p.evaluate(()=>__surface.reveal(false,true));
   const before=await p.evaluate(()=>__surface.snapshot());await shot(p,`default-${width}x${height}`);
   await p.locator('#reveal-toggle').click();await p.waitForTimeout(850);await shot(p,`revealed-${width}x${height}`);
   const after=await p.evaluate(()=>__surface.snapshot());assert.equal(after.revealed,true);assert.equal(after.textures,before.textures);assert.equal(after.geometries,before.geometries);
   await p.keyboard.press('Escape');await p.waitForTimeout(850);const restored=await p.evaluate(()=>__surface.snapshot());assert.deepEqual(restored.effective,before.effective);assert.deepEqual(restored.layout,before.layout);
   report.views.push({width,height,before,after,restored});
  }
  await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(120);
  for(const preset of ['off','subtle','standard']){await p.evaluate(v=>__surface.preset(v),preset);await p.waitForTimeout(80);await shot(p,`material-${preset}`);}
  // Render-level exact off comparison against the original MeshBasicMaterial.
  await p.evaluate(()=>{__surface.preset('off');document.getElementById('orbit-stage').style.display='none';});await p.waitForTimeout(80);await shot(p,'off-shader');
  await p.evaluate(()=>{__surface.original(true);});await p.waitForTimeout(80);await shot(p,'off-original-material');
  await p.evaluate(()=>{__surface.original(false);document.getElementById('orbit-stage').style.display='';__surface.preset('standard');});
  await p.locator('#calibration-toggle').click();await p.locator('[data-surface="preset"]').selectOption('subtle');assert.equal((await p.evaluate(()=>__surface.snapshot())).preset,'subtle');assert.equal(JSON.parse(await p.locator('#calibration-json').inputValue()).cyber.surface.preset,'subtle');await p.locator('[data-surface="preset"]').selectOption('standard');await p.locator('#calibration-close').click();
  const n=requests.length;
  for(let i=0;i<14;i++){await p.evaluate(()=>__surface.reveal(true));await p.waitForTimeout(30);await p.evaluate(()=>__surface.reveal(false));await p.waitForTimeout(30);}
  await p.waitForTimeout(760);assert.equal((await p.evaluate(()=>__surface.snapshot())).revealed,false);assert.equal(requests.slice(n).filter(u=>/\.(png|webp)(\?|$)/.test(u)).length,0);
  for(const revealed of [true,false]){await p.evaluate(v=>__surface.reveal(v),revealed);await p.waitForTimeout(400);assert.ok((await p.evaluate(()=>__surface.snapshot())).entry.every(e=>e.opacity===0));await p.waitForTimeout(450);}
  const data=(await(await p.request.get(origin+'/api/scan-assets')).json()).data,second=data.findIndex(x=>x.id==='05'&&x.figurePath);
  if(second>=0){
   await p.evaluate(i=>__surface.select(i),second);await ready(p);await shot(p,'local-author-05-default');
   await p.evaluate(()=>__surface.select(0));await keyframe(p,'switching',()=>__surface.snapshot().phase==='entering'&&__surface.snapshot().pigment>.15&&__surface.snapshot().pigment<.8);await ready(p);
   const startRequests=requests.length,start=Date.now();await p.evaluate(i=>__surface.select(i),second);await ready(p);report.cachedSwitchMs=Date.now()-start;assert.equal(requests.slice(startRequests).filter(u=>/figure\.(png|webp)/.test(u)).length,0);
   for(let i=0;i<20;i++){await p.evaluate(i=>__surface.select(i),i%2?0:second);await p.waitForTimeout(20);}await p.evaluate(()=>__surface.select(0));await ready(p);await p.waitForTimeout(120);
   const state=await p.evaluate(()=>__surface.snapshot());assert.equal(state.id,'01');assert.equal(state.cacheSize,2);assert.equal(state.textures,2);assert.equal(state.geometries,2);assert.equal(state.rendererCount,1);assert.ok(state.entry.every(e=>e.panel===1&&e.link===1&&e.node===1));report.resources=state;
  }
  // A genuinely late HTTP response cannot replace the latest selection.
  if(second>=0){let delayed=0;await p.evaluate(()=>{__surface.clear();});await p.route('**/assets/05_*/figure.png',async r=>{delayed++;await new Promise(resolve=>setTimeout(resolve,500));try{await r.continue();}catch{}});await p.evaluate(i=>__surface.select(i),second);await p.waitForTimeout(35);await p.evaluate(()=>__surface.select(0));await ready(p);await p.waitForTimeout(600);assert.ok(delayed>0);assert.equal((await p.evaluate(()=>__surface.snapshot())).id,'01');await p.unroute('**/assets/05_*/figure.png');}
  await p.evaluate(()=>__surface.degrade());await p.waitForTimeout(100);const degraded=await p.evaluate(()=>__surface.snapshot());assert.equal(degraded.edge,0);assert.equal(degraded.cracks,0);assert.equal(degraded.opacity,1);assert.equal(await p.locator('#orbit-stage').getAttribute('data-degraded'),'true');await p.locator('#reveal-toggle').click();await p.waitForTimeout(760);assert.equal((await p.evaluate(()=>__surface.snapshot())).revealed,true);await shot(p,'material-degraded');
  await p.locator('#quick-switch-btn').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org');assert.equal((await p.evaluate(()=>__surface.snapshot())).cacheSize,0);assert.equal((await p.evaluate(()=>__surface.snapshot())).textures,0);assert.equal((await p.evaluate(()=>__surface.snapshot())).geometries,0);assert.equal(await p.locator('#img-org').evaluate(e=>getComputedStyle(e).filter),'none');assert.ok(await p.locator('#orbit-stage').isHidden());
  await p.emulateMedia({reducedMotion:'reduce'});await p.locator('#quick-switch-btn').click();await ready(p);const reduced=await p.evaluate(()=>__surface.snapshot());assert.equal(reduced.pigment,1);assert.ok(reduced.entry.every(e=>e.panel===1&&e.link===1&&e.node===1));await p.locator('#reveal-toggle').click();assert.equal((await p.evaluate(()=>__surface.snapshot())).revealed,true);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>__surface.select(0));await p.waitForFunction(()=>__surface.snapshot().phase==='entering');await p.emulateMedia({reducedMotion:'reduce'});await ready(p);assert.equal((await p.evaluate(()=>__surface.snapshot())).pigment,1);
  report.functional.push('Entry pigment/arc/panel/node/link complete; exact off GPU comparison captured; 4 viewports default/reveal/reverse; author controls; interrupted reading; cached/rapid/late switching; decoration degradation preserves image and interactions; exit frees GL resources; gallery filter none; reduced motion immediate. Legacy/invalid alpha and permission errors remain covered by original suites.');
  assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;console.error(e);throw e;}finally{try{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}}
 console.log('B03 HF-03 surface browser: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
