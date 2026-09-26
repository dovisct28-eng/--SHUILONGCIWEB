const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const output=process.env.MODEL_VALIDATION_DIR?path.resolve(process.env.MODEL_VALIDATION_DIR):path.resolve(__dirname,'../../docs/validation/model-hifi');fs.mkdirSync(output,{recursive:true});
const muralOutput=path.join(output,'mural-textures');fs.mkdirSync(muralOutput,{recursive:true});
const url='http://127.0.0.1:4175/module-a/a01/';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const errors=[],results=[];
 const open=async(viewport,options={})=>{const page=await browser.newPage({viewport,...options});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});await page.goto(url);await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);return page;};
 const get=p=>p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State());
 const scroll=async(p,n)=>{await p.evaluate(n=>scrollTo(0,n*innerHeight),n);await p.waitForTimeout(400);};
 const shot=(p,name)=>p.screenshot({path:path.join(output,`${name}.png`)});
 try{
  for(const [width,height] of [[1440,900],[1920,1080],[1366,768],[1024,768]]){
   const p=await open({width,height}),tag=`${width}x${height}`;
   await scroll(p,13.2);const before=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getIntroState());await shot(p,`a03-end-${tag}`);
   await scroll(p,13.21);await shot(p,`entry-${tag}`);
   assert.ok(await p.evaluate(()=>[...document.querySelector('iframe').contentDocument.querySelectorAll('.mural-label')].filter(el=>!el.hidden).every(el=>Number(el.style.opacity)>.95)),'entry must inherit visible core labels');
   await scroll(p,14.5);await p.getByRole('button',{name:'跳过动画'}).click();await p.waitForTimeout(300);
   const final=await get(p);assert.equal(final.mode,'completed');assert.deepEqual(final.growth,[1,1,1]);assert.ok(final.bounds.left>0&&final.bounds.right<1&&final.bounds.top>.1&&final.bounds.bottom<.8);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await shot(p,`overview-${tag}`);
   await scroll(p,18);const guide=await get(p);assert.equal(guide.mode,'completed');assert.deepEqual(guide.growth,[1,1,1]);assert.equal(guide.guideStartProgress,1);assert.equal(guide.nextGuideMuralId,'mural-05');assert.equal(guide.target,'mural-05');assert.equal(guide.routeComplete,true);assert.notDeepEqual(guide.camera,final.camera);assert.ok(guide.routeOpacity<.4);
   if(width===1440)await p.screenshot({path:path.join(muralOutput,'overview.png')});
   assert.deepEqual(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04GuideStart()),{muralId:'mural-05',camera:guide.overviewCamera,routeComplete:true});
   assert.deepEqual(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04Handoff()),{muralId:'mural-05',camera:guide.overviewCamera,routeComplete:true});
   assert.equal(await p.locator('.a04 [data-title]').textContent(),'从第五幅开始');await shot(p,`guide-start-${tag}`);
   await p.reload();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(500);assert.equal((await get(p)).mode,'completed');assert.equal((await get(p)).nextGuideMuralId,'mural-05');assert.deepEqual((await get(p)).camera,guide.camera);
   await scroll(p,14.5);assert.equal((await get(p)).mode,'completed');assert.deepEqual((await get(p)).camera,final.camera);
   await p.reload();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(500);assert.equal((await get(p)).mode,'completed');
   await scroll(p,13.2);assert.equal(await get(p),null);assert.deepEqual(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getIntroState()),before);
   const restoredMurals=await p.evaluate(()=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;return ['mural-05','mural-01','mural-02'].map(id=>api.getMuralTextureState(id));});
   for(const mural of restoredMurals){assert.equal(mural.visible,false);assert.equal(mural.placeholderVisible,true);assert.equal(mural.borderVisible,true);}
   assert.equal(await p.locator('.a04 button:visible').count(),0);
   await scroll(p,14.5);await p.waitForTimeout(700);await scroll(p,17.3);await p.waitForTimeout(1000);assert.equal((await get(p)).mode,'completed');await scroll(p,14.5);assert.deepEqual((await get(p)).growth,[1,1,1]);
   for(const n of [13.3,13.8,13.5,14.3,12.8,17.5,14.5])await scroll(p,n);
   assert.equal((await get(p)).mode,'completed');
   results.push({viewport:tag,bounds:final.bounds,widthRatio:final.bounds.right-final.bounds.left,heightRatio:final.bounds.bottom-final.bounds.top,reversal:true,refresh:true,earlyExit:true,rapidCrossing:true});
   await p.close();
  }
  const p=await open({width:1440,height:900});await scroll(p,14.5);const muralResults=[];
  // Observe real automatic playback, not a test-only seek API.
  for(const [name,t] of [['fifth',9],['first',24],['second',37],['withdrawn',45.5],['route-01',47],['route-02',53],['route-03',58]]){
   await p.waitForFunction(t=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed>=t,t,{timeout:25000});
   if(['fifth','first','second'].includes(name)){
    const muralId={fifth:'mural-05',first:'mural-01',second:'mural-02'}[name];
    await p.waitForFunction(id=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState(id).loaded,muralId,{timeout:15000});
    const texture=await p.evaluate(id=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState(id),muralId);
    const timing=await p.evaluate(id=>{const entries=document.querySelector('iframe').contentWindow.performance.getEntriesByType('resource').filter(entry=>decodeURIComponent(entry.name).endsWith(`${id}-display.webp`));return {requests:entries.length,transferBytes:entries.reduce((sum,entry)=>sum+entry.transferSize,0),encodedBytes:entries.reduce((sum,entry)=>sum+entry.encodedBodySize,0)}},muralId);
    const expectedBytes=fs.statSync(path.resolve(__dirname,`../../水龙祠壁画素材/网页展示图/${muralId}-display.webp`)).size;
    assert.ok(Math.abs(texture.aspect-texture.planeAspect)<1e-10,`${muralId} keeps image aspect ratio`);
    assert.equal(texture.rotationY,muralId==='mural-05'?Math.PI/2:-Math.PI/2,`${muralId} orientation`);
    assert.equal(texture.side,true,`${muralId} belongs to the expected side wall`);
    assert.equal(texture.visible,true,`${muralId} display is visible at its stop`);
    assert.equal(texture.placeholderVisible,false,`${muralId} placeholder is hidden`);
    assert.equal(texture.borderVisible,false,`${muralId} border is hidden`);
    assert.ok(texture.fitSize.width>=({ 'mural-01':3.65,'mural-02':6.1,'mural-05':6.1 })[muralId]-.002,`${muralId} fills its designed plaster span`);
    assert.equal(timing.requests,1,`${muralId} texture is requested once while viewing its route stop`);
    assert.ok(timing.transferBytes>=expectedBytes&&timing.transferBytes<=expectedBytes+2048,`${muralId} display texture is transferred once: ${JSON.stringify(timing)}`);
    muralResults.push({muralId,...texture,...timing});
    await p.screenshot({path:path.join(muralOutput,`${muralId}.png`)});
   }
   await shot(p,name);results.push({name,state:await get(p)});console.log('captured',name);
  }
  const y=await p.evaluate(()=>scrollY);await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>scrollY),y);assert.equal((await get(p)).mode,'completed');
  await p.getByRole('button',{name:'重新观看'}).focus();await p.keyboard.press('Enter');await p.waitForTimeout(300);assert.equal((await get(p)).mode,'playing');
  // Dispatch visibility events with an overridden read-only visibility getter.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(100);const paused=(await get(p)).elapsed;await p.waitForTimeout(800);assert.equal((await get(p)).elapsed,paused);
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(400);assert.ok((await get(p)).elapsed>paused);await p.close();
  const reduced=await open({width:1024,height:768},{reducedMotion:'reduce'});await scroll(reduced,14.5);assert.equal((await get(reduced)).mode,'completed');await reduced.close();
  const failed=await browser.newPage({viewport:{width:1440,height:900}}),failureErrors=[];
  failed.on('pageerror',error=>failureErrors.push(error.message));
  await failed.route('**/mural-05-display.webp',route=>route.request().frame()===failed.mainFrame()?route.continue():route.abort());
  await failed.goto(url);await failed.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
  await scroll(failed,14.5);
  await failed.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState('mural-05').requested);
  await failed.waitForTimeout(400);
  const fallback=await failed.evaluate(()=>{const frame=document.querySelector('iframe'),api=frame.contentWindow.shuilongTemple;return {texture:api.getMuralTextureState('mural-05'),modelReady:frame.contentWindow.modelReady,a04:Boolean(api.getA04State()),canvas:Boolean(frame.contentDocument.querySelector('canvas'))}});
  assert.equal(fallback.texture.loaded,false);assert.equal(fallback.texture.requested,true);assert.equal(fallback.texture.placeholderVisible,true);assert.equal(fallback.texture.borderVisible,true);assert.equal(fallback.modelReady,true);assert.equal(fallback.a04,true);assert.equal(fallback.canvas,true);assert.deepEqual(failureErrors,[]);
  await failed.screenshot({path:path.join(muralOutput,'mural-05-fallback.png')});await failed.close();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors,automaticPlayback:true,keyboard:true,visibilitySimulation:true,reducedMotion:true},null,2));
  fs.writeFileSync(path.join(muralOutput,'results.json'),JSON.stringify({textures:muralResults,fallback:{...fallback,placeholderRemainsAvailable:true},errors,glbBytes:fs.statSync(path.resolve(__dirname,'../../shuilong-temple/shuilong-temple.glb')).size},null,2));
  console.log('A04 browser checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
