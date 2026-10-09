const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createApp}=require('./server.js');
const {person,syntheticCamera}=require('./b03-gesture-fixtures.cjs');
const out=path.resolve(process.env.B03_V43_VALIDATION_DIR||'../docs/validation/b03-gesture-v4.3/local/continuity-browser');fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'results.json')))fs.copyFileSync(path.join(out,'results.json'),path.join(out,'results-attempt-'+Date.now()+'.json'));
const report={status:'NOT_TESTED',scope:'Actual Chrome/WebGL, production asynchronous Camera → Hands → Pose/ownership → pointer/dwell. Synthetic camera and model output, not physical acceptance.',physicalCamera:'PHYSICAL_CAMERA_PENDING',views:[],cases:[],cycles:[],errors:[]};
const instrument=`window.__v43={snapshot(tracing=false){return {hand:{key:handOwnership.lockedHandKey,state:handOwnership.state,valid:handOwnership.valid,reason:handOwnership.reason,pauseCause:handOwnership.pauseCause,recovering:handOwnership.rearmSince!==null},pointer:controlPointer,dwell:dwellController.snapshot(),operator:ownership.activeOperator?.id,diagnostics:ownership.diagnostics,reading:isRevealed,index:currentSeriesIndex,total:globalAssetsData.length,context:gestureContext(),targets:dwellFeedback.targets,tracking:tracing?gestureDiagnostics.trackingSnapshot():{enabled:gestureDiagnostics.enabled,frames:[],events:[]},camera:cameraLifecycle.snapshot(),pose:posePipeline.snapshot(),cameras:gesturePerformance.activeCameras,models:Number(!!handsModel)};}};`;
const hand=(x,y=.566)=>{const lm=Array.from({length:21},()=>({x:1-x,y,z:0}));lm[0].y=y+.09;lm[5].x-=.035;lm[17].x+=.035;return lm;};
const snap=(p,tracing=false)=>p.evaluate(v=>__v43.snapshot(v),tracing);
const ready=p=>p.waitForFunction(()=>window.__v43&&__v43.snapshot().camera.state==='RUNNING'&&!__v43.snapshot().context.locked&&!__v43.snapshot().context.blocked,null,{timeout:40000});
async function shot(p,name){const client=await p.context().newCDPSession(p);const {data}=await client.send('Page.captureScreenshot',{format:'png',fromSurface:true});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data,'base64'));await client.detach();}
(async()=>{
 const {INTERACTION_CONFIG:c}=await import('./public/interaction-config.mjs');
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({channel:'chrome',headless:true});let p,current={x:.5,y:.566},side='left',key=null,minProgress=0;
 const bodyFor=(a,b,missing=false)=>person({upper:true,hands:side==='left'?[a,b]:[b,a],missingWrists:missing?['left','right']:[side==='left'?'right':'left']});
 const deliver=async(x,y=current.y,extras=[],missing=false)=>{const a=hand(x,y);await p.evaluate(v=>__camera.deliver(v),{hands:[a,...extras],poses:[bodyFor(a,extras[0],missing)]});current={x,y};};
 const hold=async(x,y,ms=750,extras=[],missing=false)=>{await deliver(x,y,extras,missing);await p.waitForTimeout(ms);};
 const assertKey=s=>{assert.equal(s.hand.key,key,JSON.stringify({hand:s.hand,diagnostics:s.diagnostics}));assert.equal(s.hand.valid,true,JSON.stringify(s.diagnostics));};
 const travel=async(to,extras=[],missing=false)=>{
  const from={...current},start=Date.now();let samples=0;
  do{const u=Math.min(1,(Date.now()-start)/1200);await deliver(from.x+(to.x-from.x)*u,from.y+(to.y-from.y)*u,extras,missing);await p.waitForTimeout(35);const s=await snap(p);
   assert.equal(s.hand.key,key,JSON.stringify({hand:s.hand,diagnostics:s.diagnostics}));
   if(!s.hand.valid){
    // Async capture can age beyond the unchanged budget between callbacks.
    // Require safe pause with the same identity, zero dwell and no usable pointer.
    assert.ok(!s.diagnostics.poseFresh||s.diagnostics.handsFresh===0||s.hand.recovering&&['POSE_STALE','CALLBACK_STALL','HANDS_STALE'].includes(s.hand.pauseCause),JSON.stringify({hand:s.hand,diagnostics:s.diagnostics}));
    assert.equal(s.pointer.valid,false);assert.equal(s.dwell.progress,0);
    report.freshnessPauses=(report.freshnessPauses||0)+1;
   }
   assert.equal(s.dwell.lastAction?.at??null,minProgress);samples++;}while(Date.now()-start<1200);
  await deliver(to.x,to.y,extras,missing);
  await p.waitForFunction(k=>__v43.snapshot().hand.key===k&&__v43.snapshot().hand.valid,key,{timeout:1000});
  assertKey(await snap(p));return samples;
 };
 const target=async id=>{const s=await snap(p),v=p.viewportSize(),r=s.targets.find(t=>t.id===id);return {x:c.pointerInput.left+(c.pointerInput.right-c.pointerInput.left)*(r.x+r.width/2)/v.width,y:c.pointerInput.top+(c.pointerInput.bottom-c.pointerInput.top)*(r.y+r.height/2)/v.height};};
 const rest=async(afterStage=false)=>{
  const s=await snap(p,afterStage);minProgress=s.dwell.lastAction?.at??null;
  if(afterStage&&!s.hand.valid){
   // Only the loading boundary may reacquire after a recorded >650ms callback stall.
   // Never accept this path during ordinary continuous motion or hide the release.
   assert.equal(s.dwell.releaseRequired,true);assert.equal(s.dwell.progress,0);
   report.stageRecoveries??=[];report.stageRecoveries.push({index:s.index,trackingReleased:!s.hand.key,hand:s.hand,operator:s.operator,releases:s.tracking.events.filter(e=>e.event==='HAND_RELEASED').map(e=>({atMs:e.atMs,reason:e.reason}))});
   await hold(.5,.566,1600);const recovered=await snap(p);assert.ok(recovered.hand.valid);key=recovered.hand.key;await hold(.5,.566,500);
  }else await travel({x:.5,y:.566});
  await hold(.5,.566,1000);assert.equal((await snap(p)).dwell.releaseRequired,false);
 };
 async function cycle(n){
  const before=await snap(p);minProgress=before.dwell.lastAction?.at??null;const view=await target('view');await travel(view);await hold(view.x,view.y,1450);assert.equal((await snap(p)).reading,true);await ready(p);await p.waitForTimeout(800);
  await rest();await travel(view);await hold(view.x,view.y,1450);assert.equal((await snap(p)).reading,false);await ready(p);await p.waitForTimeout(800);
  await rest();const next=await target('next');await travel(next);await hold(next.x,next.y,1450);const after=await snap(p);assert.equal(after.index,(before.index+1)%after.total);await ready(p);await rest(true);assertKey(await snap(p));
  report.cycles.push({round:n,openCloseNext:'PASS',key,index:after.index,unexpectedActions:0});
 }
 try{
  p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
  await p.route('**/index.html*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await syntheticCamera(p,{realDrawing:true});await p.goto('http://localhost:'+server.address().port+'/index.html?gestureDebug=1');await p.locator('#btn-cyber-track').click();await ready(p);await p.waitForTimeout(1000);
  await hold(.44,.566,650);key=(await snap(p)).hand.key;assert.match(key,/:left$/);await rest();
  await p.evaluate(()=>__camera.poseDelayMs=120);await hold(.5,.566,1600);
  for(const [width,height]of [[1280,800],[1366,768],[1440,900],[1920,1080]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(250);const preview=await p.locator('#camera-feed-container').boundingBox();const s=await snap(p),view=await target('view'),next=await target('next');minProgress=s.dwell.lastAction?.at??null;
   const before=s.index;await travel(view);await hold(view.x,view.y,1500);assert.equal((await snap(p)).reading,true);await ready(p);await p.waitForTimeout(800);if(width===1440)await shot(p,'reading-1440');
   assert.deepEqual(await p.locator('#camera-feed-container').boundingBox(),preview);
   await rest();await travel(view);await hold(view.x,view.y,1500);assert.equal((await snap(p)).reading,false);await ready(p);await p.waitForTimeout(800);
   await rest();await travel(next);await hold(next.x,next.y,1500);const after=await snap(p);assert.equal(after.index,(before+1)%after.total);await ready(p);await rest(true);assertKey(await snap(p));
   report.views.push({width,height,status:'PASS',preview,view,next,key,continuousMotion:true});console.log(width+'x'+height+' continuous OPEN/CLOSE/NEXT PASS');
  }
  await p.setViewportSize({width:1440,height:900});await rest();
  // Wrist-free cross-midline traversal, spare hand ambiguity and changing detection order.
  minProgress=(await snap(p)).dwell.lastAction?.at??null;
  await travel({x:.59,y:.566},[hand(.38,.74)],true);await hold(.59,.566,650,[hand(.5,.74)],true);assertKey(await snap(p));
  for(let n=0;n<10;n++){const a=hand(.59),b=hand(.38+.005*n,.74);await p.evaluate(v=>__camera.deliver(v),{hands:n%2?[a,b]:[b,a],poses:[bodyFor(a,b,true)]});await p.waitForTimeout(45);assertKey(await snap(p));}
  report.cases.push({name:'Missing wrists / spare hand / order reversal during cross-midline control',status:'PASS'});
  await hold(.59,.566,250,[hand(.59,.566)],true);const paused=await snap(p);assert.equal(paused.pointer.valid,false);assert.equal(paused.hand.key,key);assert.equal(paused.dwell.progress,0);
  await hold(.59,.566,750,[],true);assertKey(await snap(p));report.cases.push({name:'Crossing pauses identity and cancels dwell; same hand resumes',status:'PASS'});await rest();
  const a=hand(.5);await p.evaluate(v=>__camera.deliver(v),{hands:[a],poses:[bodyFor(a),person({x:.9,width:.2,upper:true,missingWrists:['left','right']})]});await p.waitForTimeout(600);assertKey(await snap(p));
  const overlap=person({x:.52,upper:true,missingWrists:['left','right']});await p.evaluate(v=>__camera.deliver(v),{hands:[a],poses:[bodyFor(a),overlap]});await p.waitForTimeout(300);assert.equal((await snap(p)).pointer.valid,false);assert.equal((await snap(p)).hand.key,key);await hold(.5,.566,850);assertKey(await snap(p));report.cases.push({name:'Distant bystander cannot take over; overlapping identity pauses input',status:'PASS'});
  await p.evaluate(()=>__camera.deliver({hands:[],poses:__camera.latest.poses}));await p.waitForTimeout(300);const occluded=await snap(p);assert.equal(occluded.pointer.valid,false);assert.equal(occluded.hand.key,key);await hold(.5,.566,650);assertKey(await snap(p));
  await p.evaluate(()=>__camera.deliver({hands:[],poses:__camera.latest.poses}));await p.waitForTimeout(850);assert.equal((await snap(p)).hand.key,null);await hold(.44,.566,650);key=(await snap(p)).hand.key;assert.match(key,/:left$/);await rest();report.cases.push({name:'300ms occlusion retains / 850ms absence releases and reacquires',status:'PASS'});
  for(let n=1;n<=10;n++){await cycle(n);console.log('V4.3 cycle '+n+' PASS');}
  await shot(p,'locked-diagnostics');
  const downloadEvent=p.waitForEvent('download');await p.locator('#gesture-export').click();const download=await downloadEvent;const exportPath=path.join(out,'export.json');await download.saveAs(exportPath);const data=JSON.parse(fs.readFileSync(exportPath));assert.equal(data.version,'B03 V4.3');assert.ok(/^[0-9a-f]{40}$/.test(data.commitSha));assert.ok(data.tracking.frames.length<=240&&data.tracking.events.length<=160);assert.ok(data.tracking.events.some(e=>e.event==='DWELL_COMPLETED'));assert.ok(!/landmarks|base64/.test(JSON.stringify(data)));report.exportSummary={version:data.version,frames:data.tracking.frames.length,events:data.tracking.events.length,physical:data.physicalCameraAcceptance};
  await p.locator('#back-btn').click();assert.equal((await snap(p)).cameras,0);assert.equal((await snap(p)).models,0);assert.equal((await snap(p)).hand.key,null);
  // Normal presentation produces no tracing cache.
  await p.goto('http://localhost:'+server.address().port+'/index.html');await p.locator('#btn-cyber-track').click();await ready(p);await p.waitForTimeout(1200);assert.equal((await snap(p,true)).tracking.frames.length,0);assert.equal((await snap(p,true)).tracking.events.length,0);assert.ok(await p.locator('#gesture-export').isHidden());await p.locator('#back-btn').click();
  assert.deepEqual(report.errors,[]);report.status='PASS';console.log('V4.3 production browser continuity PASS');
 }catch(error){report.status='FAIL';report.failure=error.stack;report.failureState=p?await snap(p,true).catch(()=>null):null;if(p)await shot(p,'failure').catch(()=>{});throw error;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
