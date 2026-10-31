// Historical capture/reference only: retired v32/v33/v34 HTML must first be restored from pre-repository-cleanup-v2-2026-10-31. Current coverage: browser-v3.5 + integration-v3.5 + edge-v3.5.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),sharp=require('sharp');
const out=path.resolve('docs/validation/interior-visual-v3-2'),local=path.join(out,'local'),selected=path.join(out,'selected');for(const d of[local,selected])fs.mkdirSync(d,{recursive:true});
const url='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/v32.html';
async function shot(p,name,keep){const buf=await p.screenshot();fs.writeFileSync(path.join(local,name+'.png'),buf);if(keep)await sharp(buf).webp({quality:88}).toFile(path.join(selected,name+'.webp'));}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={runs:[],pass:false};try{
for(const [width,height,reduced]of [[1440,900,false],[1920,1080,false],[1366,768,false],[1440,900,true],[1920,1080,true],[1366,768,true]]){
 const record=width===1440&&!reduced,context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference',...(record?{recordVideo:{dir:path.join(local,'video'),size:{width,height}}}:{})}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const began=Date.now();await p.goto(url);await p.waitForFunction(()=>window.study?.ready&&!study.busy,null,{timeout:90000});
 // First mural and reading use the original controller unchanged.
 await p.evaluate(()=>study.navigate('C'));assert.equal(await p.evaluate(()=>study.view),'C');await shot(p,`01-first-reading-${width}-${reduced}`,record);
 const videoStart=(Date.now()-began)/1000;
 await p.evaluate(()=>{window.routePromise=study.travelTo(1);});
 for(const [progress,name]of [[.10,'02-leave-first'],[.36,'03-east-corridor'],[.65,'04-hall-corner']]){await p.waitForFunction(t=>study.route32.progress>=t,null===progress?0:progress,{timeout:60000});await shot(p,`${name}-${width}-${reduced}`,record);}
 assert.equal(await p.evaluate(()=>window.routePromise),true);assert.equal(await p.evaluate(()=>study.activeMural),1);
 const state=await p.evaluate(()=>study.route32);assert.equal(state.error,null);assert.equal(state.wall.opacity,1);assert.equal(state.projection.secondWallExcluded,true);assert.ok(state.wall.corners.every(q=>q.x>=0&&q.x<=width&&q.y>=0&&q.y<=height));
 await shot(p,`07-second-lit-${width}-${reduced}`,record);
 await p.evaluate(()=>study.navigate('C'));assert.equal(await p.evaluate(()=>study.view),'C');await shot(p,`08-second-reading-${width}-${reduced}`,record);
 await p.evaluate(()=>study.navigate('D'));await p.locator('#zoom-in').click();assert.equal(await p.locator('#zoom-value').innerText(),'125%');await p.locator('#detail-viewport').press('ArrowRight');await shot(p,`09-second-detail-${width}-${reduced}`,record);await p.locator('#detail-viewport').press('0');
 await p.evaluate(()=>study.navigate('C'));await p.evaluate(()=>study.navigate('B'));
 const bridge=await p.evaluate(()=>document.body.dataset.bridge??'reduced-motion');assert.equal(await p.evaluate(()=>study.travelTo(0)),true);assert.equal(await p.evaluate(()=>study.activeMural),0);
 const videoEnd=(Date.now()-began)/1000;
 // Deterministic actual-runtime diagnostic states, distinct from the continuous recording.
 await p.evaluate(()=>study.seekRoute(1,{reveal:0}));await shot(p,`05-second-dark-${width}-${reduced}`,record);
 await p.evaluate(()=>study.setSecondReveal(.34));assert.equal(await p.locator('#second-wall-label').innerText(),'第二铺壁画');await shot(p,`06-second-title-${width}-${reduced}`,record);
 const deltas=[];for(const progress of [.36,.65]){await p.evaluate(t=>study.seekRoute(t),progress);await p.waitForTimeout(700);const a=await sharp(await p.screenshot()).removeAlpha().raw().toBuffer();await p.evaluate(()=>study.setRouteHybrid(false));const b=await sharp(await p.screenshot()).removeAlpha().raw().toBuffer();let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);const delta=sum/a.length;assert.ok(delta>.01,`no visible projection at ${progress}: ${delta}`);deltas.push({progress,meanPixelDifference:delta});}
 assert.deepEqual(errors,[]);const run={width,height,reduced,reverse:true,wallCorners:state.wall.corners,bridge,projectionDifference:deltas,errors};report.runs.push(run);
 const video=record?await p.video().path():null;await context.close();if(record)report.video={raw:path.relative(out,video),start:videoStart,end:videoEnd};fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));console.log('PASS',width,height,reduced);
}report.pass=true;
}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
