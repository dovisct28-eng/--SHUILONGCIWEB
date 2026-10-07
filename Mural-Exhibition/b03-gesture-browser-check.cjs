const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createApp}=require('./server.js');
const {person,syntheticCamera}=require('./b03-gesture-fixtures.cjs');
const out=path.resolve(process.env.B03_GESTURE_VALIDATION_DIR||'../docs/validation/b03-gesture-v3/local/gesture');fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'results.json')))fs.copyFileSync(path.join(out,'results.json'),path.join(out,'results-attempt-'+Date.now()+'.json'));
const report={environment:'Actual Chrome / production Camera.onFrame, Hands.onResults, Pose worker messaging, Three.js and GSAP; synthetic model outputs and camera image. Physical camera acceptance PENDING.',views:[],cases:[],errors:[],metrics:{nextAttempts:0,nextSuccess:0,falseNext:0,doubleNext:0,readingAttempts:0,readingSuccess:0,falseReopen:0,interferenceAttempts:0,wrongPersonNext:0,wrongPersonReading:0,operatorSwitchAttempts:0,wrongOperatorSwitch:0},physicalCamera:{status:'PENDING'},resources:[]};
const instrument=`window.__gesture={snapshot(){return {index:currentSeriesIndex,total:globalAssetsData.length,id:currentItemData?.id,reading:isRevealed,...nextGesture.snapshot(performance.now()),...interactionController.snapshot(performance.now()),person:ownership.operatorState,operator:ownership.activeOperator?.id,assigned:ownership.assignedHands.length,diagnostics:ownership.diagnostics,phase:webglContainer.dataset.phase,loading:webglContainer.hasAttribute('data-loading'),orbitPhase:orbitStage?.phase,orbitActive:orbitStage?.active,panels:document.querySelectorAll('.orbit-panel').length,svg:document.querySelectorAll('#orbit-stage svg').length,textures:renderer?.info.memory.textures,cache:muralCache.size,pose:posePipeline.snapshot(),performance:{...gesturePerformance,raf:Number(glFrame!==null)}};},select:loadSeriesData};`;
const hand=(x=.7,y=.5,open=true)=>{const raw=1-x,lm=Array.from({length:21},()=>({x:raw,y,z:0}));lm[0].y=y+.15;lm[5].x=raw-.04;lm[17].x=raw+.04;for(const i of [8,12,16,20])lm[i].y=y-(open?.25:.02);return lm;};
const snap=p=>p.evaluate(()=>__gesture.snapshot());
const deliver=(p,hands=[],poses=[person({hands})])=>p.evaluate(value=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Camera callback timeout: '+document.getElementById('entry-mode-notice').textContent+' / '+document.getElementById('camera-status').textContent)),3000);__camera.deliver(value);__camera.resolve=()=>{clearTimeout(timer);resolve();};}),{hands,poses});
const ready=p=>p.waitForFunction(()=>window.__gesture&&!__gesture.snapshot().loading&&__gesture.snapshot().phase==='stable'&&(!__gesture.snapshot().orbitActive||__gesture.snapshot().orbitPhase==='stable'),null,{timeout:40000});
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
async function sustain(p,hands,ms,poses){const start=Date.now();do{await deliver(p,hands,poses);await p.waitForTimeout(30);}while(Date.now()-start<ms);}
async function neutral(p,ms=850){await sustain(p,[],ms);}
async function hold(p){await sustain(p,[hand(.55)],140);await sustain(p,[hand()],850);assert.equal((await snap(p)).state,'ARMED');}
async function swipe(p,dx=-.04,dy=0){const before=await snap(p);report.metrics.nextAttempts++;for(let i=1;i<=8;i++){await deliver(p,[hand(.7+i*dx,.5+i*dy)]);await p.waitForTimeout(35);if((await snap(p)).index!==before.index)break;}
 const after=await snap(p);assert.equal(after.index,(before.index+1)%after.total);report.metrics.nextSuccess++;await sustain(p,[hand(.8)],160);assert.equal((await snap(p)).index,after.index);await ready(p);await neutral(p,1150);return after;}
async function pair(p,d,ms=80,y=.5){await sustain(p,[hand(.5-d/2,y),hand(.5+d/2,y)],ms);}
async function open(p){report.metrics.readingAttempts++;await pair(p,.20,220);for(const d of [.26,.32,.38,.44,.48])await pair(p,d,80);await pair(p,.48,500);assert.equal((await snap(p)).reading,true);report.metrics.readingSuccess++;}
async function close(p){await pair(p,.48,200);for(const d of [.38,.28,.18,.12])await pair(p,d,80);await pair(p,.12,400);assert.equal((await snap(p)).reading,false);assert.equal((await snap(p)).mode,'POST_READING_LOCK');}
(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const origin='http://localhost:'+server.address().port;
 const browser=await chromium.launch({channel:'chrome',headless:true});let p;
 try{
  p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await syntheticCamera(p);await p.goto(origin+'/index.html');await p.locator('#btn-cyber-track').click();await ready(p);await neutral(p,1000);
  assert.equal((await snap(p)).person,'PERSON_LOCKED');assert.ok(await p.locator('#gesture-debug').isHidden());await shot(p,'01-operator-locked');
  for(const [width,height]of [[1440,900],[1920,1080],[1366,768]]){
   await p.setViewportSize({width,height});await ready(p);const preview=await p.locator('#camera-feed-container').boundingBox();
   await pair(p,.6,900);assert.equal((await snap(p)).reading,false);await neutral(p);
   await hold(p);await shot(p,`02-navigation-armed-${width}`);assert.equal(await p.locator('#gesture-message').textContent(),'挥动 · 下一人物');assert.deepEqual(await p.locator('#camera-feed-container').boundingBox(),preview);
   await neutral(p,350);await hold(p);await swipe(p);
   await open(p);await shot(p,`03-reading-${width}`);
   await p.locator('#info-text').evaluate(e=>{const para=document.createElement('p');para.id='gesture-scroll-fixture';para.textContent='仅用于阅读滚动测试。'.repeat(300);e.append(para);});
   await pair(p,.48,200,.7);assert.ok(await p.locator('#info-text').evaluate(e=>e.scrollTop)>0);
   await close(p);await shot(p,`04-post-reading-lock-${width}`);
   const before=await snap(p);await pair(p,.5,700);await sustain(p,[hand()],850);assert.equal((await snap(p)).reading,false);assert.equal((await snap(p)).index,before.index);assert.equal((await snap(p)).mode,'POST_READING_LOCK');
   assert.equal(await p.locator('#gesture-message').textContent(),'放下双手 · 继续探索');await p.locator('#gesture-scroll-fixture').evaluate(e=>e.remove());
   await neutral(p);await hold(p);await swipe(p,.04);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);report.views.push({width,height,preview,state:await snap(p)});console.log(`${width}x${height}: static rejection / ARMED / NEXT / reading / post-release PASS`);
  }
  await p.setViewportSize({width:1440,height:900});await ready(p);await neutral(p);const active=(await snap(p)).operator;
  const base=await snap(p);
  for(let n=0;n<8;n++){
   const ah=[hand(.4)],bh=[hand(.06+n%2*.025),hand(.18)];const poses=[person({hands:ah}),person({x:.87,width:.43,hands:bh})];
   await sustain(p,[...ah,...bh],350,poses);report.metrics.interferenceAttempts++;
   const s=await snap(p);assert.equal(s.operator,active);assert.ok(s.assigned<=1);assert.equal(s.reading,false);assert.equal(s.index,base.index);
  }
  report.cases.push('B/C/D: eight larger-bystander/cross-person hand attempts, no control steal or gesture');
  await p.evaluate(()=>history.replaceState(null,'','?gestureDebug=1'));
  // Debug mode is read once at module startup; use a separate real page for its evidence.
  const debug=await browser.newPage({viewport:{width:1440,height:900}});await syntheticCamera(debug);
  await debug.route('**/index.html*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await debug.goto(origin+'/index.html?gestureDebug=1');await debug.locator('#btn-cyber-track').click();await ready(debug);await neutral(debug,1000);
  const bh=[hand(.08),hand(.2)];await sustain(debug,bh,350,[person(),person({x:.88,hands:bh})]);assert.ok(await debug.locator('#gesture-debug').isVisible());await shot(debug,'05-multi-person-lock');await debug.close();
  await neutral(p);await hold(p);await pair(p,.55,450);assert.equal((await snap(p)).reading,false);assert.equal((await snap(p)).state,'IDLE');await neutral(p);
  report.cases.push('L: same-person second hand cancels ARMED without revealing');
  const beforeK=await snap(p);await hold(p);await sustain(p,[hand(),...bh],100,[person({hands:[hand()]}),person({x:.88,hands:bh})]);assert.equal((await snap(p)).reading,false);assert.equal((await snap(p)).operator,active);await neutral(p);
  report.cases.push('K: ARMED ownership survives a bystander');
  for(let n=0;n<10;n++){
   await hold(p);await swipe(p);await hold(p);await swipe(p,-.035,.025);await open(p);await close(p);await pair(p,.5,200);await neutral(p);await hold(p);await swipe(p,.035,-.025);
   const old=await snap(p);await sustain(p,[],300,[]);assert.equal((await snap(p)).operator,old.operator);
   const b=person({x:.74});await sustain(p,[],850,[b]);assert.equal((await snap(p)).operator,undefined);
   await sustain(p,[],400,[b]);assert.equal((await snap(p)).person,'CANDIDATE');await sustain(p,[],600,[b]);assert.equal((await snap(p)).person,'PERSON_LOCKED');assert.notEqual((await snap(p)).operator,old.operator);report.metrics.operatorSwitchAttempts++;
   // Keep the new person's central torso at x=.65 for subsequent callbacks.
   await sustain(p,[],400,[person({x:.56})]);await neutral(p,350);
   const s=await snap(p);assert.ok(s.cache<=3&&s.textures<=6);report.resources.push(s);console.log(`complete usage cycle ${n+1}/10 PASS`);
  }
  await p.locator('.cyber-controls [data-step="-1"]').click();await ready(p);await p.locator('#webgl-container').click({position:{x:10,y:10}});await p.keyboard.press('ArrowRight');await ready(p);
  await p.keyboard.press('i');assert.equal((await snap(p)).reading,true);await p.keyboard.press('Escape');assert.equal((await snap(p)).reading,false);await neutral(p);
  report.cases.push('Mouse previous/next and keyboard arrows/I/Escape preserved');
  const lifecycle=[];
  for(let n=0;n<3;n++){await p.locator('#back-btn').click();assert.equal(await p.evaluate(()=>__camera.active),0);await p.locator('#btn-cyber-track').click();await ready(p);await neutral(p,1000);lifecycle.push(await snap(p));}
  await p.locator('#back-btn').click();report.lifecycle=await p.evaluate(()=>({starts:__camera.starts,stops:__camera.stops,max:__camera.max,active:__camera.active,models:__camera.models,options:__camera.options}));report.reentries=lifecycle;
  assert.equal(report.lifecycle.max,1);assert.equal(report.lifecycle.active,0);assert.equal(report.lifecycle.models,1);assert.equal(report.lifecycle.options.maxNumHands,4);assert.deepEqual(report.errors,[]);
  console.log('B03 gesture V3 production callback browser validation: PASS');
 }catch(e){report.failure=e.stack;if(p)report.failureState=await snap(p).catch(()=>null);if(p)await shot(p,'failure').catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
