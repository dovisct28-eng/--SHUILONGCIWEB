const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const output=path.resolve(__dirname,'../../docs/validation/a04-handoff');fs.mkdirSync(output,{recursive:true});
const url='http://127.0.0.1:4173/module-a/a01/';
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
   assert.deepEqual(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04GuideStart()),{muralId:'mural-05',camera:guide.overviewCamera,routeComplete:true});
   assert.deepEqual(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04Handoff()),{muralId:'mural-05',camera:guide.overviewCamera,routeComplete:true});
   assert.equal(await p.locator('.a04 [data-title]').textContent(),'从第五幅开始');await shot(p,`guide-start-${tag}`);
   await p.reload();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(500);assert.equal((await get(p)).mode,'completed');assert.equal((await get(p)).nextGuideMuralId,'mural-05');assert.deepEqual((await get(p)).camera,guide.camera);
   await scroll(p,14.5);assert.equal((await get(p)).mode,'completed');assert.deepEqual((await get(p)).camera,final.camera);
   await p.reload();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(500);assert.equal((await get(p)).mode,'completed');
   await scroll(p,13.2);assert.equal(await get(p),null);assert.deepEqual(await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getIntroState()),before);
   assert.equal(await p.locator('.a04 button:visible').count(),0);
   await scroll(p,14.5);await p.waitForTimeout(700);await scroll(p,17.3);await p.waitForTimeout(1000);assert.equal((await get(p)).mode,'completed');await scroll(p,14.5);assert.deepEqual((await get(p)).growth,[1,1,1]);
   for(const n of [13.3,13.8,13.5,14.3,12.8,17.5,14.5])await scroll(p,n);
   assert.equal((await get(p)).mode,'completed');
   results.push({viewport:tag,bounds:final.bounds,widthRatio:final.bounds.right-final.bounds.left,heightRatio:final.bounds.bottom-final.bounds.top,reversal:true,refresh:true,earlyExit:true,rapidCrossing:true});
   await p.close();
  }
  const p=await open({width:1440,height:900});await scroll(p,14.5);
  // Observe real automatic playback, not a test-only seek API.
  for(const [name,t] of [['fifth',9],['first',24],['second',37],['withdrawn',45.5],['route-01',47],['route-02',53],['route-03',58]]){
   await p.waitForFunction(t=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed>=t,t,{timeout:25000});
   await shot(p,name);results.push({name,state:await get(p)});console.log('captured',name);
  }
  const y=await p.evaluate(()=>scrollY);await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>scrollY),y);assert.equal((await get(p)).mode,'completed');
  await p.getByRole('button',{name:'重新观看'}).focus();await p.keyboard.press('Enter');await p.waitForTimeout(300);assert.equal((await get(p)).mode,'playing');
  // Dispatch visibility events with an overridden read-only visibility getter.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});const paused=(await get(p)).elapsed;await p.waitForTimeout(800);assert.equal((await get(p)).elapsed,paused);
  await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(400);assert.ok((await get(p)).elapsed>paused);await p.close();
  const reduced=await open({width:1024,height:768},{reducedMotion:'reduce'});await scroll(reduced,14.5);assert.equal((await get(reduced)).mode,'completed');await reduced.close();
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors,automaticPlayback:true,keyboard:true,visibilitySimulation:true,reducedMotion:true},null,2));
  console.log('A04 browser checks passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
