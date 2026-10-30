const{chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),sharp=require('sharp');
const base='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/',out=path.resolve('docs/validation/interior-visual-v3'),local=path.join(out,'local'),selected=path.join(out,'selected');for(const d of[local,selected])fs.mkdirSync(d,{recursive:true});
async function wait(p){await p.waitForFunction(()=>study.ready&&!study.busy,null,{timeout:90000});}
async function shot(p,name,keep=false){const buf=await p.screenshot();fs.writeFileSync(path.join(local,name+'.png'),buf);if(keep)await sharp(buf).webp({quality:87}).toFile(path.join(selected,name+'.webp'));}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={runs:[],pass:false};try{
for(const[width,height,reduced]of[[1440,900,true],[1920,1080,true],[1366,768,true],[1440,900,false],[1920,1080,false],[1366,768,false]]){
 const p=await b.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded'});await wait(p);
 const probe=await p.evaluate(()=>study.probeRoute());assert.ok(probe.every(x=>!x.hits.length));if(width===1440&&reduced)fs.writeFileSync(path.join(local,'route-probe.json'),JSON.stringify(probe,null,2));
 // AI/fill comparison at identical pose, then restore exact first-mural controller.
 await p.evaluate(()=>{study.runtime.model.setCamera(study.runtime.sample(1.8),{immediate:true});});await shot(p,'v3-atmosphere-'+width,width===1440&&reduced);
 const after=await sharp(await p.screenshot()).raw().toBuffer();await p.evaluate(async()=>{study.finish.setEnabled(false);study.layer.setMode('original');const T=await document.querySelector('#space').contentWindow.document.querySelector('#temple').contentWindow.eval("import('/module-a/immersive-hybrid-v1/vendor/three.module.js')");const{installStudyLayers}=await import('../interior-visual-v2/surface-layer.mjs');window.v2Baseline=await installStudyLayers(study.runtime.model,T,{direction:'B'});study.runtime.model.renderFrame()});await shot(p,'v2-baseline-'+width);const before=await sharp(await p.screenshot()).raw().toBuffer();const delta=after.reduce((sum,x,i)=>sum+Math.abs(x-before[i]),0)/after.length;assert.ok(delta>.2);await p.evaluate(()=>{window.v2Baseline.dispose();study.layer.setMode('hybrid');study.finish.setEnabled(true);study.runtime.model.setCamera(study.runtime.sample(0),{immediate:true});});
 await p.evaluate(()=>study.navigate('C'));await wait(p);assert.equal(await p.evaluate(()=>study.view),'C');await shot(p,'first-reading-'+width,width===1440&&reduced);
 await p.evaluate(()=>study.navigate('D'));await p.locator('[data-observation="rider"]').click();await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>study.detail.zoom)>2);await shot(p,'first-detail-'+width,width===1440&&reduced);await p.evaluate(()=>study.navigate('C'));
 const muralStates=[];
 for(let i=1;i<=4;i++){
 assert.equal(await p.evaluate(i=>study.travelTo(i),i),true);await wait(p);assert.equal(await p.evaluate(()=>study.activeMural),i);await shot(p,'wall-'+(i+1)+'-'+width,width===1440&&reduced&&(i===1||i===4));
 await p.evaluate(()=>study.navigate('C'));await wait(p);const dimensions=await p.locator('#reading-image').evaluate(x=>({w:x.naturalWidth,h:x.naturalHeight}));assert.ok(dimensions.w>0);await shot(p,'reading-'+(i+1)+'-'+width,width===1440&&reduced);
 const bounds=await p.locator('#reading-image').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);
 await p.evaluate(()=>study.navigate('D'));await p.locator('#zoom-in').click();assert.equal(await p.locator('#zoom-value').innerText(),'125%');await p.locator('#detail-viewport').press('0');assert.equal(await p.locator('#zoom-value').innerText(),'100%');await p.evaluate(()=>study.navigate('C'));await p.evaluate(()=>study.navigate('B'));assert.equal(await p.evaluate(()=>study.view),'B');await p.evaluate(()=>study.navigate('C'));muralStates.push({index:i+1,dimensions,wall:true,reading:true,detail:true,reverse:true,registration:i===2||i===3?'photo-unrectified':'candidate'});
 }
 await p.locator('#route-open').click();assert.equal(await p.locator('#route-list li').count(),5);await shot(p,'five-route-'+width,width===1440&&reduced);await p.locator('#route-close').click();
 // Offline B is intentionally not a fabricated success.
 await p.route('http://localhost:3000/**',r=>r.abort());await p.locator('#continue-tour').click();await wait(p);assert.match(await p.locator('#message').innerText(),/暂不可达/);await p.unrouteAll();
 for(let i=3;i>=0;i--){assert.equal(await p.evaluate(i=>study.travelTo(i),i),true);await wait(p);}assert.equal(await p.evaluate(()=>study.runtime.state),'mural-look');assert.deepEqual(errors,[]);report.runs.push({width,height,reduced,projectionAndFillDifference:delta,routeSegments:probe.length,muralStates,reverseAll:true,errors});await p.close();console.log('pass',width,reduced);
}
report.pass=true;
}finally{fs.writeFileSync(path.join(local,'browser-results.json'),JSON.stringify(report,null,2));await b.close();}console.log(JSON.stringify(report));})().catch(e=>{console.error(e);process.exitCode=1});
