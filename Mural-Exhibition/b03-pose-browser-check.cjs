const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createApp}=require('./server.js');
const {syntheticCamera}=require('./b03-gesture-fixtures.cjs');
const out=path.resolve(process.env.B03_POSE_VALIDATION_DIR||'../docs/validation/b03-gesture-v3.1/local/pose-runtime');fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'results.json')))fs.copyFileSync(path.join(out,'results.json'),path.join(out,'results-attempt-'+Date.now()+'.json'));
const instrument=`window.__runtime={snapshot(){return {pose:posePipeline.snapshot(),poseError:posePipeline.error?.message,notice:document.getElementById('entry-mode-notice').textContent,cameraStatus:cameraStatus.textContent,handsModels:Number(!!handsModel),performance:{...gesturePerformance,raf:Number(glFrame!==null)},person:ownership.operatorState,phase:webglContainer.dataset.phase,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,poseMaxPeople:posePipeline.config.poseMaxPeople};}};`;
(async()=>{const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({channel:'chrome',headless:true,args:process.env.B03_POSE_HTTP1==='1'?['--disable-http2']:[]});const p=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));const report={scope:'Real pinned Tasks Vision CPU PoseLandmarker/WASM in Chrome Worker, real legacy Hands inference, actual B03/WebGL/Camera.onFrame/Hands.onResults. Synthetic blank 320x240 camera image only. Checks deployment/cadence/lifecycle under the real stage; no person recognition or exhibition CPU/GPU acceptance claim.',network:[],transport:process.env.B03_POSE_HTTP1==='1'?'Chrome --disable-http2 diagnostic':'Chrome default'};
 p.context().on('requestfailed',r=>report.network.push({url:r.url(),error:r.failure()?.errorText}));
 p.context().on('response',r=>{if(r.url().includes('tasks-vision')||r.url().includes('pose_landmarker'))report.network.push({url:r.url(),status:r.status()});});
try{
 await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});await syntheticCamera(p,{realPose:true,realHands:true});
 await p.goto('http://localhost:'+server.address().port+'/index.html');
 if(process.env.B03_POSE_PREWARM==='1'){
  // Optional diagnostic: same pinned CDN resources, warmed browser HTTP cache only.
  // Does not test cold-start availability or change production initialization timeout.
  report.prewarm=await p.evaluate(async()=>{
   const urls=['https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs',
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm/vision_wasm_internal.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm/vision_wasm_internal.wasm',
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'];
   return Promise.all(urls.map(async url=>{const at=performance.now(),r=await fetch(url);if(!r.ok)throw new Error('Prewarm HTTP '+r.status);const bytes=(await r.arrayBuffer()).byteLength;return {url,bytes,elapsedMs:performance.now()-at};}));
  });
 }
 await p.locator('#btn-cyber-track').click();await p.waitForFunction(()=>window.__runtime&&__runtime.snapshot().pose.models===1&&__runtime.snapshot().phase==='stable',null,{timeout:25000});
 await p.waitForFunction(()=>__runtime.snapshot().pose.frames>=5,null,{timeout:30000});
 report.start=await p.evaluate(()=>__runtime.snapshot());
 report.raf=await p.evaluate(async()=>{const samples=[],start=performance.now();let last=start;return new Promise(resolve=>{function tick(t){samples.push(t-last);last=t;if(t-start<5000)requestAnimationFrame(tick);else resolve({samples:samples.length,averageMs:samples.reduce((a,b)=>a+b,0)/samples.length,maxMs:Math.max(...samples)});}requestAnimationFrame(tick);});});
 report.end=await p.evaluate(()=>__runtime.snapshot());const elapsed=report.end.performance.lastAt-report.start.performance.lastAt;
 report.runtime={...report.end.pose,poseFps:(report.end.pose.frames-report.start.pose.frames)/(elapsed/1000),handsCallbackFps:(report.end.performance.callbacks-report.start.performance.callbacks)/(elapsed/1000),
  stalePoseRatio:(report.end.performance.stalePoseFrames-report.start.performance.stalePoseFrames)/(report.end.performance.callbacks-report.start.performance.callbacks),numPoses:report.end.poseMaxPeople};
 assert.equal(report.runtime.models,1);assert.equal(report.runtime.numPoses,4);assert.ok(report.runtime.frames>=10);assert.equal(report.end.person,'SEARCHING');assert.equal(report.end.performance.raf,1);
 await p.locator('#back-btn').click();report.exit=await p.evaluate(()=>__runtime.snapshot());assert.equal(report.exit.pose.active,0);assert.equal(report.exit.performance.activeCameras,0);assert.equal(report.exit.performance.raf,0);
 await p.locator('#btn-cyber-track').click();await p.waitForFunction(()=>__runtime.snapshot().performance.activeCameras===1&&__runtime.snapshot().pose.frames>0);await p.waitForTimeout(1200);report.reentry=await p.evaluate(()=>__runtime.snapshot());assert.equal(report.reentry.pose.models,1);assert.equal(report.reentry.performance.raf,1);await p.locator('#back-btn').click();
 assert.deepEqual(errors,[]);report.errors=errors;report.status='PASS';console.log(JSON.stringify(report,null,2));
}catch(e){report.status='FAIL';report.failure=e.stack;report.failureState=await p.evaluate(()=>window.__runtime?.snapshot()).catch(()=>null);console.log(JSON.stringify(report.failureState,null,2));throw e;}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
