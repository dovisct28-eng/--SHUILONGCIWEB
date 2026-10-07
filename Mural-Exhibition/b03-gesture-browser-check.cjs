const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createApp}=require('./server.js');
const out=path.resolve(process.env.B03_GESTURE_VALIDATION_DIR||'../docs/validation/b03-gesture-v2/local/gesture');
fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'results.json')))fs.copyFileSync(path.join(out,'results.json'),path.join(out,'results-attempt-'+Date.now()+'.json'));
const report={environment:'Actual Chrome, Three.js, GSAP and local author assets. Stub camera/Hands producer delivers synthetic landmarks through the registered production onResults callback; no physical camera validation.',views:[],cases:[],errors:[],physicalCamera:{status:'pending',success:null,total:null,falseTriggers:null,doubleTriggers:null}};
const instrument=`window.__gesture={snapshot(){return {index:currentSeriesIndex,id:currentItemData?.id,reading:isRevealed,...nextGesture.snapshot(performance.now()),phase:webglContainer.dataset.phase,loading:webglContainer.hasAttribute('data-loading'),orbitPhase:orbitStage?.phase,orbitActive:orbitStage?.active,panels:document.querySelectorAll('.orbit-panel').length,svg:document.querySelectorAll('#orbit-stage svg').length,textures:renderer?.info.memory.textures,cache:muralCache.size};},select:loadSeriesData};`;
const hand=(x=.7,y=.5,open=true)=>{const raw=1-x,lm=Array.from({length:21},()=>({x:raw,y,z:0}));lm[0].y=y+.15;lm[5].x=raw-.04;lm[17].x=raw+.04;for(const i of [8,12,16,20])lm[i].y=y-(open?.25:.02);return lm;};
const snap=p=>p.evaluate(()=>__gesture.snapshot());
const deliver=(p,hands)=>p.evaluate(hands=>new Promise(resolve=>{__camera.deliver(hands);__camera.nextResult=resolve;}),hands);
const ready=p=>p.waitForFunction(()=>window.__gesture&&!__gesture.snapshot().loading&&__gesture.snapshot().phase==='stable'&&(!__gesture.snapshot().orbitActive||__gesture.snapshot().orbitPhase==='stable')&&__gesture.snapshot().state==='IDLE',null,{timeout:40000});
async function hold(p,ms=740,jitter=0){if((await snap(p)).releaseRequired)await deliver(p,[hand(.3)]);const start=Date.now();let i=0;do{await deliver(p,[hand(.7+Math.sin(i++)*jitter)]);await p.waitForTimeout(30);}while(Date.now()-start<ms);}
async function swipe(p,dx=.04,dy=0,drop=false){const before=(await snap(p)).index;for(let i=1;i<=8;i++){if(drop&&i===2)await deliver(p,[]);else await deliver(p,[hand(.7+i*dx,.5+i*dy)]);await p.waitForTimeout(35);if((await snap(p)).index!==before)break;}return snap(p);}
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));
 const origin='http://localhost:'+server.address().port;
 const browser=await chromium.launch({channel:'chrome',headless:true});let p;
 try{
  p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await p.addInitScript(()=>{
   const image=document.createElement('canvas');image.width=320;image.height=240;
   window.__camera={callback:null,starts:0,stops:0,models:0,active:0,max:0,options:null,latest:undefined,deliver(hands){this.latest=hands;},emit(){const hands=this.latest;this.callback(hands===null?{image}:{image,multiHandLandmarks:hands});if(this.nextResult){this.nextResult();this.nextResult=null;}}};
   window.Hands=class{constructor(){__camera.models++;}setOptions(o){__camera.options=o;}onResults(cb){__camera.callback=cb;}};
   window.Camera=class{async start(){this.timer=setInterval(()=>{if(__camera.callback&&__camera.latest!==undefined)__camera.emit();},33);this.running=true;__camera.starts++;__camera.active++;__camera.max=Math.max(__camera.max,__camera.active);}stop(){clearInterval(this.timer);if(this.running){this.running=false;__camera.stops++;__camera.active--;}}};
   window.HAND_CONNECTIONS=[];window.drawConnectors=()=>{};window.drawLandmarks=()=>{};
  });
  await p.goto(origin+'/index.html');await p.locator('#btn-cyber-track').click();await ready(p);
  assert.ok(await p.locator('#gesture-debug').isHidden());
  for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await p.setViewportSize({width,height});await ready(p);await deliver(p,[]);await p.waitForTimeout(230);
   const preview=await p.locator('#camera-feed-container').boundingBox();await shot(p,`idle-${width}`);
   await hold(p,300,.005);assert.equal((await snap(p)).state,'HOVER');await shot(p,`hover-${width}`);
   await deliver(p,[]);await p.waitForTimeout(30);await deliver(p,null);assert.ok(['HOVER','ARMED'].includes((await snap(p)).state));
   await hold(p,470,.005);assert.equal((await snap(p)).state,'ARMED');assert.equal(await p.locator('#gesture-message').textContent(),'挥动 · 下一人物');await shot(p,`armed-${width}`);
   assert.deepEqual(await p.locator('#camera-feed-container').boundingBox(),preview);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   // Capturing a large WebGL frame can consume most of the 2s command window.
   // Exercise the swipe with a fresh real-time intent session after the evidence capture.
   await deliver(p,[]);await p.waitForTimeout(240);await hold(p);assert.equal((await snap(p)).state,'ARMED');
   const before=await snap(p);report.lastBefore=before;await swipe(p,-.04,.02,true);const after=await snap(p);
   assert.equal(after.index,(before.index+1)%8);assert.equal(after.state,'LOCKED');await shot(p,`fired-${width}`);
   await deliver(p,[hand(.9)]);assert.equal((await snap(p)).index,after.index);await ready(p);assert.equal((await snap(p)).state,'IDLE');
   report.views.push({width,height,preview,before,after});
   console.log(`${width}x${height}: HOVER / ARMED / NEXT / lock / camera preview PASS`);
  }
  await p.setViewportSize({width:1440,height:900});await ready(p);
  let before=await snap(p);
  for(let i=0;i<30;i++){await deliver(p,[hand(.1+i*.025)]);await p.waitForTimeout(25);}
  assert.equal((await snap(p)).index,before.index);report.cases.push('Edge pass without intent: zero NEXT');
  for(const [name,dx,dy]of [['left',-.04,0],['right',.04,0],['up-left',-.035,-.025],['down-left',-.035,.025],['up-right',.035,-.025],['down-right',.035,.025]]){
   await ready(p);before=await snap(p);await hold(p);assert.equal((await snap(p)).state,'ARMED');await swipe(p,dx,dy);const after=await snap(p);
   assert.equal(after.index,(before.index+1)%8);report.cases.push({name,before:before.index,after:after.index});
  }
  await ready(p);before=await snap(p);await hold(p);assert.equal((await snap(p)).state,'ARMED');
  await deliver(p,[]);await p.waitForTimeout(240);assert.equal((await snap(p)).state,'IDLE');
  await deliver(p,null);assert.equal((await snap(p)).state,'IDLE');await hold(p);await swipe(p);assert.equal((await snap(p)).index,(before.index+1)%8);
  report.cases.push('Production empty/omitted hand loss: grace, IDLE, fresh intent and successful NEXT');
  await ready(p);before=await snap(p);const start=Date.now();
  while(Date.now()-start<10000){await deliver(p,[hand(.7+Math.sin(Date.now()/30)*.015)]);await p.waitForTimeout(40);}
  assert.equal((await snap(p)).index,before.index);assert.equal((await snap(p)).state,'IDLE');assert.equal((await snap(p)).releaseRequired,true);report.cases.push('10 seconds stationary/jitter, timed cancellation and no NEXT');
  for(let i=0;i<70;i++){await deliver(p,[hand(i%2?.2:.9)]);await p.waitForTimeout(35);}
  assert.equal((await snap(p)).index,before.index);report.cases.push('Held-open discontinuous motion cannot trigger without a new dwell');
  await deliver(p,[hand(.2),hand(.8)]);assert.equal((await snap(p)).reading,true);await p.waitForTimeout(1000);await shot(p,'reading');
  await p.locator('#info-text').evaluate(e=>{const para=document.createElement('p');para.id='gesture-scroll-fixture';para.textContent='仅用于阅读滚动测试。'.repeat(300);e.append(para);});
  await deliver(p,[hand(.2,.85),hand(.8,.85)]);assert.ok(await p.locator('#info-text').evaluate(e=>e.scrollTop)>0);
  for(let i=0;i<12;i++){await deliver(p,[hand(i%2?.3:.8,.85)]);await p.waitForTimeout(30);}
  assert.equal((await snap(p)).index,before.index);await deliver(p,[hand(.45),hand(.55)]);assert.equal((await snap(p)).reading,false);assert.equal((await snap(p)).state,'IDLE');
  await p.locator('#gesture-scroll-fixture').evaluate(e=>e.remove());report.cases.push('Two-hand open, vertical read, no single-hand NEXT during reading, two-hand close resets intent');
  await p.locator('.cyber-controls [data-step="-1"]').click();await ready(p);assert.equal((await snap(p)).index,(before.index+7)%8);
  await p.locator('#webgl-container').click({position:{x:10,y:10}});await p.keyboard.press('ArrowRight');await ready(p);assert.equal((await snap(p)).index,before.index);
  report.cases.push('Mouse PREVIOUS and keyboard NEXT preserved');
  const resources=[];
  for(let i=0;i<10;i++){await ready(p);before=await snap(p);await hold(p);assert.equal((await snap(p)).state,'ARMED');await swipe(p,i%2?.04:-.04);assert.equal((await snap(p)).index,(before.index+1)%8);await ready(p);const s=await snap(p);assert.ok(s.cache<=3&&s.textures<=6);resources.push(s);}
  report.resources=resources;report.cases.push('Ten complete independent hold/swipe/transitions; bounded cache, textures and stage DOM');
  await p.emulateMedia({reducedMotion:'reduce'});await hold(p);assert.equal((await snap(p)).state,'ARMED');assert.equal(await p.locator('.gesture-hint').evaluate(e=>getComputedStyle(e).animationName),'none');await shot(p,'armed-reduced');await swipe(p);await ready(p);
  report.cases.push('Reduced motion retains clear static ARMED feedback and NEXT');
  const options=await p.evaluate(()=>__camera.options);assert.deepEqual(options,{maxNumHands:2,modelComplexity:1,minDetectionConfidence:.6,minTrackingConfidence:.6});
  await p.locator('#back-btn').click();report.lifecycle=await p.evaluate(()=>({starts:__camera.starts,stops:__camera.stops,max:__camera.max,active:__camera.active,models:__camera.models}));
  assert.equal(report.lifecycle.max,1);assert.equal(report.lifecycle.active,0);assert.equal(report.lifecycle.models,1);assert.deepEqual(report.errors,[]);
  console.log('B03 gesture v2 production-callback browser validation: PASS');
 }catch(e){report.failure=e.stack;if(p)report.failureState=await snap(p).catch(()=>null);if(p)await shot(p,'failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
