const fs=require('node:fs'),path=require('node:path');
const localRuntime=path.resolve(__dirname,'../tmp/playwright');
if(!process.env.PLAYWRIGHT_BROWSERS_PATH&&fs.existsSync(path.join(localRuntime,'ffmpeg-1011/ffmpeg-win64.exe')))process.env.PLAYWRIGHT_BROWSERS_PATH=localRuntime;
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {createApp}=require('./server.js');
const out=path.resolve(__dirname,'../docs/validation/b03-hf-04/local/motion');fs.mkdirSync(out,{recursive:true});
const report={environment:'Actual Chrome / Three.js / GSAP. Camera boundary stub; gestures use original handler with synthetic landmarks.',views:[],samples:[],checks:[],errors:[],limits:'Author visual approval and physical exhibition camera/gesture acceptance remain pending.'};
const instrument=`window.__motion={select:loadSeriesData,reveal:setRevealed,gesture:handleGestureLogic,
 preset(preset){const c=calibrationOverrides.get(currentItemData.id)||cyberConfig(currentItemData.cyber);c.surface={preset};calibrationOverrides.set(currentItemData.id,c);applyStageSurface();},
 degrade(){decorationBudget.degraded=true;applyStageSurface();},clear(){releaseMuralStage(true);orbitStage.reset();},
 swipe(delta){pointerHistory=[{x:0,y:0,t:Date.now()-100},{x:delta,y:0,t:Date.now()}];triggerSwipeFlash();},
 snapshot(){const stage=orbitStage;const targets=stage?[stage.geometry,stage.presentation,stage.rings,stage.travel,stage.swipe,...stage.panels.flatMap(p=>[p.entry,p.position,p.emphasis])]:[];return {
 id:currentItemData?.id,revealed:isRevealed,phase:webglContainer.dataset.phase,orbitPhase:stage?.phase,active:stage?.active,motion:stage?.root.dataset.motion,
 scheduler:Number(!!stage?.focusCall),focusTween:Number(!!stage?.focusTween),ack:Number(!!stage?.ackTween),ready:Number(!!stage?.readyCall),focus:stage?.root.dataset.focus,
 ownedTweens:typeof gsap==='undefined'?0:gsap.getTweensOf(targets).length,panels:document.querySelectorAll('.orbit-panel').length,svgs:document.querySelectorAll('#orbit-stage svg').length,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,cache:muralCache.size,
 dash:stage?getComputedStyle(stage.main).strokeDashoffset:null,mainAnimation:stage?getComputedStyle(stage.main).animationName:null,
 layout:stage?.currentLayout,forbidden:orbitProtectedAreas(isRevealed),effective:stageLayout?.effective,
 items:stage?.panels.filter(p=>p.position.opacity>0).map(p=>{const rect=p.focus.getBoundingClientRect();return {content:p.el.dataset.content,tier:p.el.dataset.tier,drift:getComputedStyle(p.motion).animationName,transform:getComputedStyle(p.motion).transform,envelope:p.position.envelope,x:rect.x,y:rect.y,width:rect.width,height:rect.height,opacity:Number(getComputedStyle(p.el).opacity),angle:p.position.angle,driftX:p.position.driftX,driftY:p.position.driftY};})};},
 materialCheck(){
 const material=lineMesh.material,pixels=()=>{renderer.render(scene,camera);const c=document.createElement('canvas');c.width=renderer.domElement.width;c.height=renderer.domElement.height;const ctx=c.getContext('2d');ctx.drawImage(renderer.domElement,0,0);return ctx.getImageData(0,0,c.width,c.height).data;};
 this.preset('off');const off=pixels();lineMesh.material=new THREE.MeshBasicMaterial({map:material.map,transparent:true,alphaTest:.003,depthWrite:false});const original=pixels();lineMesh.material.dispose();lineMesh.material=material;
 this.preset('standard');const standard=pixels();let alphaChanges=0,offChanges=0,transparentChanges=0,changed=0,dark=0,light=0,darkN=0,lightN=0;
 for(let i=0;i<off.length;i+=4){if(off[i+3]!==standard[i+3])alphaChanges++;for(let k=0;k<4;k++)if(off[i+k]!==original[i+k])offChanges++;if(!off[i+3]){for(let k=0;k<3;k++)if(off[i+k]!==standard[i+k])transparentChanges++;}else{const delta=Math.abs(off[i]-standard[i])+Math.abs(off[i+1]-standard[i+1])+Math.abs(off[i+2]-standard[i+2]);if(delta)changed++;if(Math.max(off[i],off[i+1],off[i+2])<50){dark+=delta;darkN++;}if(Math.max(off[i],off[i+1],off[i+2])>120){light+=delta;lightN++;}}}
 return {alphaChanges,offChanges,transparentChanges,changed,darkMean:dark/Math.max(1,darkN),lightMean:light/Math.max(1,lightN),darkN,lightN};
 }};`;
const state=p=>p.evaluate(()=>__motion.snapshot());
const ready=p=>p.waitForFunction(()=>window.__motion&&__motion.snapshot().phase==='stable'&&__motion.snapshot().orbitPhase==='stable'&&!document.getElementById('webgl-container').hasAttribute('data-loading'),null,{timeout:40000});
const shot=(p,name)=>p.screenshot({path:path.join(out,name+'.png')});
const hit=(a,b,gap=0)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
function safe(s){for(const p of s.items){const e=p.envelope;assert.ok(p.x>=e.x-1&&p.y>=e.y-1&&p.x+p.width<=e.x+e.width+1&&p.y+p.height<=e.y+e.height+1,JSON.stringify({p,e}));assert.ok(!s.forbidden.some(r=>hit(p,r,8)));assert.ok(Math.abs(p.angle)<=1.2);}for(let i=0;i<s.items.length;i++)assert.ok(!s.items.slice(i+1).some(q=>hit(s.items[i],q,12)));}
const hands=(distance)=>[.5-distance/2,.5+distance/2].map(x=>Array.from({length:21},(_,i)=>({x,y:i===0?.65:i===9?.48:.4,z:0})));
(async()=>{
 const server=createApp({admin:true}).listen(0,'localhost');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});let p;
 const origin=`http://localhost:${server.address().port}`;
 async function setup(context){const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram/.test(m.text()))report.errors.push(m.text());});await page.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});await page.addInitScript(()=>window.Camera=class{async start(){}stop(){}});await page.goto(origin+'/index.html');await page.locator('#btn-gallery-track').click();await page.locator('.hotspot[data-ids="01"]').click();await page.waitForFunction(()=>document.getElementById('img-org').style.opacity==='1');await page.locator('#quick-switch-btn').click();await ready(page);return page;}
 try{
  const recording=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:path.join(out,'video'),size:{width:1920,height:1080}}});
  p=await setup(recording);const start=await state(p);assert.equal(start.mainAnimation,'b03-main-flow');assert.ok(start.items.every(p=>p.drift==='b03-panel-drift'));assert.equal(start.items.filter(p=>p.tier==='primary').length,1);
  let focusSeen=false;const began=Date.now();
  while(Date.now()-began<15000){await p.waitForTimeout(250);const s=await state(p);safe(s);assert.equal(s.panels,5);assert.equal(s.svgs,1);assert.equal(s.textures,start.textures);assert.ok(s.scheduler+s.focusTween<=1);if(s.focus&&!focusSeen){focusSeen=true;await shot(p,'formal-01-panel-focus');}report.samples.push({ms:Date.now()-began,dash:s.dash,focus:s.focus,scheduler:s.scheduler,focusTween:s.focusTween,items:s.items.map(p=>({content:p.content,transform:p.transform})),textures:s.textures});}
  const end=await state(p);assert.notEqual(start.dash,end.dash);assert.ok(start.items.some((v,i)=>v.transform!==end.items[i].transform));assert.ok(focusSeen);await shot(p,'formal-01-default-1920x1080');
  const video=p.video();await recording.close();report.video=await video.path();
  const context=await browser.newContext({viewport:{width:1440,height:900}});p=await setup(context);
  const originalLayout=(await state(p)).layout;
  for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(160);const initial=await state(p);safe(initial);await shot(p,`default-${width}x${height}`);
   await p.evaluate(lm=>__motion.gesture(lm),hands(.6));assert.equal((await state(p)).revealed,true);assert.equal((await state(p)).ack,1);await p.waitForTimeout(900);const revealed=await state(p);safe(revealed);await shot(p,`revealed-${width}x${height}`);
   await p.evaluate(lm=>__motion.gesture(lm),hands(.08));await p.waitForTimeout(900);const closed=await state(p);safe(closed);assert.deepEqual(closed.layout,initial.layout);assert.deepEqual(closed.effective,initial.effective);report.views.push({width,height,initial,revealed,closed});
  }
  await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(300);assert.deepEqual((await state(p)).layout,originalLayout);
  report.material=await p.evaluate(()=>__motion.materialCheck());assert.equal(report.material.alphaChanges,0);assert.equal(report.material.offChanges,0);assert.equal(report.material.transparentChanges,0);assert.ok(report.material.changed>1000);assert.ok(report.material.darkMean<report.material.lightMean*.5);
  await p.evaluate(()=>__motion.preset('off'));await p.waitForTimeout(100);await shot(p,'material-off');await p.evaluate(()=>__motion.preset('standard'));await p.waitForTimeout(100);await shot(p,'material-standard');
  const data=(await(await p.request.get(origin+'/api/scan-assets')).json()).data,second=data.findIndex(x=>x.id==='05'&&x.figurePath);
  // The second image is optional, already present local author material.
  if(second>=0){
   await p.evaluate(()=>__motion.swipe(-1));await p.waitForTimeout(90);const left=await p.locator('.orbit-swipe').getAttribute('d');assert.ok(Number(await p.locator('.orbit-swipe').evaluate(e=>getComputedStyle(e).opacity))>0);
   await p.evaluate(i=>__motion.select(i),second);await p.waitForTimeout(60);assert.equal((await state(p)).orbitPhase,'leaving');await shot(p,'formal-01-switching');await ready(p);
   await p.evaluate(()=>__motion.swipe(1));await p.waitForTimeout(90);const right=await p.locator('.orbit-swipe').getAttribute('d');assert.notEqual(left,right);
   await p.evaluate(()=>__motion.select(0));await ready(p);
   for(let i=0;i<30;i++){await p.evaluate(i=>__motion.select(i),i%2?0:second);await p.waitForTimeout(25);}await p.evaluate(()=>__motion.select(0));await ready(p);await p.waitForTimeout(180);const final=await state(p);assert.equal(final.id,'01');assert.equal(final.panels,5);assert.equal(final.svgs,1);assert.equal(final.textures,2);assert.equal(final.cache,2);assert.ok(final.scheduler+final.focusTween<=1);report.switchResources=final;
   await p.evaluate(()=>__motion.clear());let delayed=0;await p.route('**/assets/05_*/figure.png',async r=>{delayed++;await new Promise(resolve=>setTimeout(resolve,650));await r.continue().catch(()=>{});});await p.evaluate(i=>__motion.select(i),second);await p.waitForTimeout(50);await p.evaluate(()=>__motion.select(0));await ready(p);await p.waitForTimeout(750);assert.ok(delayed>0);assert.equal((await state(p)).id,'01');await p.unroute('**/assets/05_*/figure.png');
  }
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);let stopped=await state(p);assert.equal(stopped.scheduler+stopped.focusTween+stopped.ack+stopped.ready,0);assert.equal(stopped.mainAnimation,'none');assert.ok(stopped.items.every(p=>p.drift==='none'));await p.locator('#reveal-toggle').click();assert.equal((await state(p)).revealed,true);await p.keyboard.press('Escape');assert.equal((await state(p)).revealed,false);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(100);assert.equal((await state(p)).mainAnimation,'b03-main-flow');
  await p.evaluate(()=>__motion.degrade());stopped=await state(p);assert.equal(stopped.scheduler+stopped.focusTween+stopped.ack+stopped.ready,0);assert.equal(stopped.mainAnimation,'none');assert.ok(stopped.items.every(p=>p.drift==='none'));await p.locator('#reveal-toggle').click();await p.waitForTimeout(850);safe(await state(p));assert.equal((await state(p)).revealed,true);
  await p.locator('#quick-switch-btn').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');await p.waitForTimeout(100);const exit=await state(p);assert.equal(exit.active,false);assert.equal(exit.scheduler+exit.focusTween+exit.ack+exit.ready+exit.ownedTweens,0);assert.equal(exit.textures,0);assert.equal(exit.geometries,0);assert.equal(exit.cache,0);assert.equal(exit.panels,5);assert.equal(exit.svgs,1);report.exit=exit;
  report.checks.push('15s actual CSS/GSAP sampling and video; moving dash/drift; single deterministic focus event; real inner-frame safety at four viewports; original two-hand handler; reversible layouts; directional visual feedback; 30 interrupted selections and late response; unchanged GL/DOM pools; exact GPU OFF recovery and unchanged alpha; reduced motion including live preference toggles; degraded interactions; exit releases all owned work.');assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;if(p&&!p.isClosed()){report.failureState=await state(p).catch(()=>null);await shot(p,'failure').catch(()=>{});}throw e;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 console.log('B03 HF04 motion browser: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
