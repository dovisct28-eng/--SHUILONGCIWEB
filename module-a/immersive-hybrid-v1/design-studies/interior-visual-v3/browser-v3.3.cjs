// Historical capture/reference only: retired v32/v33/v34 HTML must first be restored from pre-repository-cleanup-v2-2026-10-31. Current coverage: browser-v3.5 + integration-v3.5 + edge-v3.5.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict'),sharp=require('sharp');
const out=path.resolve('docs/validation/interior-visual-v3-3'),local=path.join(out,'local'),selected=path.join(out,'selected');for(const dir of[local,selected])fs.mkdirSync(dir,{recursive:true});
const url='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/v33.html';
async function shot(p,name,keep){const buffer=await p.screenshot();fs.writeFileSync(path.join(local,name+'.png'),buffer);if(keep)await sharp(buffer).webp({quality:88}).toFile(path.join(selected,name+'.webp'));return buffer;}
async function fullImage(p){return p.evaluate(()=>{const im=document.querySelector('#reading-image'),r=im.getBoundingClientRect(),ratio=im.naturalWidth/im.naturalHeight,w=Math.min(r.width,r.height*ratio),h=w/ratio;return {natural:[im.naturalWidth,im.naturalHeight],fit:getComputedStyle(im).objectFit,content:{x:r.left+(r.width-w)/2,y:r.top+(r.height-h)/2,width:w,height:h},box:{width:r.width,height:r.height},alt:im.alt};});}
async function detailChecks(p,index){
 await p.locator('#detail-open').click();await p.waitForFunction(()=>study.view==='D'&&!study.busy);assert.equal(await p.evaluate(()=>study.detail.zoom),1.15);
 assert.equal(await p.locator('#observation-copy').textContent(),index===2?'以盘龙为主体，四周装饰鲤鱼、水纹、祥云等图案。':'以麒麟为主体，周围装饰祥云、如意、经书、宝剑等图案。');
 await p.locator('#zoom-in').click();assert.ok(await p.evaluate(()=>study.detail.zoom>1.15));await p.locator('#zoom-out').click();assert.ok(Math.abs(await p.evaluate(()=>study.detail.zoom)-1.15)<1e-8);
 for(let i=0;i<4;i++)await p.locator('#zoom-in').click();await p.waitForTimeout(700);
 const vp=await p.locator('#detail-viewport').boundingBox();await p.mouse.move(vp.x+vp.width/2,vp.y+vp.height/2);await p.mouse.down();await p.mouse.move(vp.x+vp.width/2+90,vp.y+vp.height/2+55,{steps:5});await p.mouse.up();const dragged=await p.evaluate(()=>study.detail);assert.ok(Math.abs(dragged.x)>1||Math.abs(dragged.y)>1);
 await p.locator('#detail-viewport').focus();await p.keyboard.press('ArrowRight');const moved=await p.evaluate(()=>study.detail);assert.ok(Math.abs(moved.x-dragged.x)>1);
 await p.mouse.wheel(0,-120);await p.waitForTimeout(120);assert.ok(await p.evaluate(()=>study.detail.zoom)>moved.zoom);
 const map=await p.locator('#minimap').boundingBox();await p.mouse.click(map.x+map.width*.72,map.y+map.height*.3);await p.waitForTimeout(700);
 const minimap=await p.evaluate(()=>{const r=document.querySelector('#mini-window');return Object.fromEntries(['x','y','width','height'].map(k=>[k,Number(r.getAttribute(k))]));});const size=index===2?[1286,636]:[1280,939];assert.ok(minimap.x>=0&&minimap.y>=0&&minimap.x+minimap.width<=size[0]+.01&&minimap.y+minimap.height<=size[1]+.01);
 await p.locator('#reset').click();assert.deepEqual(await p.evaluate(()=>study.detail),{zoom:1,x:0,y:0});assert.equal(await p.locator('#zoom-out').isDisabled(),true);await p.locator('#detail-viewport').focus();await p.keyboard.press('+');assert.ok(await p.evaluate(()=>study.detail.zoom)>1);await p.keyboard.press('0');assert.equal(await p.evaluate(()=>study.detail.zoom),1);
 return{dragged,moved,minimap,reset:await p.evaluate(()=>study.detail)};
}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={runs:[],pass:false};try{
 for(const [width,height,reduced]of[[1440,900,false],[1920,1080,false],[1366,768,false],[1440,900,true],[1920,1080,true],[1366,768,true]]){
  const keep=width===1440&&!reduced,began=Date.now(),context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference',...(keep?{recordVideo:{dir:path.join(local,'video'),size:{width,height}}}:{})}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await p.goto(url);await p.waitForFunction(()=>window.study?.ready&&!study.busy,null,{timeout:90000});
  // Only seed the already-accepted second dock. Everything below is real live UI,
  // continuous camera motion and interactions; no diagnostic seeks in the clip.
  await p.evaluate(async()=>{await study.seekRoute(1,{reveal:1});await study.navigate('C');});
  const clipStart=(Date.now()-began)/1000;await shot(p,`01-second-reading-${width}-${reduced}`,keep);
  const run={width,height,reduced,murals:[],errors};
  for(const index of[2,3]){
   await p.locator('#continue-tour').click();await p.waitForFunction(s=>study.rear.state.segment===s&&study.rear.state.progress>.35&&study.rear.state.progress<.98,index-2,{timeout:30000});await shot(p,`${index===2?'02-turn-third':'08-turn-fourth'}-${width}-${reduced}`,keep);
   if(!reduced){await p.waitForFunction(i=>study.activeMural===i&&study.rear.state.progress===1&&(study.rear.state.reveals[i]??1)<.18,index,{timeout:30000});await shot(p,`${index===2?'03-third-dark':'09-fourth-dark'}-${width}-${reduced}`,keep);await p.waitForFunction(i=>(study.rear.state.reveals[i]??0)>=.20,index,{timeout:10000});await shot(p,`${index===2?'04-third-title':'10-fourth-title'}-${width}-${reduced}`,keep);}
   await p.waitForFunction(i=>study.activeMural===i&&!study.busy,index,{timeout:30000});assert.equal(await p.evaluate(()=>study.view),'B');const spatial=await p.evaluate(()=>study.rear.state);assert.equal(spatial.error,null);assert.equal(spatial.status,'lit');assert.ok(spatial.wall.every(q=>q.x>=0&&q.x<=width&&q.y>=0&&q.y<=height));await shot(p,`${index===2?'05-third-lit':'11-fourth-lit'}-${width}-${reduced}`,keep);
   if(keep&&index===2){const on=await p.screenshot();await p.evaluate(()=>study.setRouteHybrid(false));const off=await p.screenshot();await p.evaluate(()=>study.setRouteHybrid(true));const a=await sharp(on).removeAlpha().raw().toBuffer(),b=await sharp(off).removeAlpha().raw().toBuffer();let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);run.aiMeanDifference=sum/a.length;assert.ok(run.aiMeanDifference>.01);fs.writeFileSync(path.join(local,'third-ai-off.png'),off);}
   await p.locator('#forward').click();await p.waitForFunction(()=>study.view==='C'&&!study.busy);const image=await fullImage(p),expected=index===2?[1286,636]:[1280,939];assert.deepEqual(image.natural,expected);assert.equal(image.fit,'contain');assert.ok(image.content.x>=0&&image.content.y>=0&&image.content.x+image.content.width<=width+.1&&image.content.y+image.content.height<=height+.1);
   const source=index===2?[1280,960]:[1280,1707],oldScale=Math.min(image.box.width/source[0],image.box.height/source[1]),newScale=image.content.width/expected[0];assert.ok(newScale>oldScale*1.15);await shot(p,`${index===2?'06-third-reading':'12-fourth-reading'}-${width}-${reduced}`,keep);
   const detail=await detailChecks(p,index);await shot(p,`${index===2?'07-third-detail':'13-fourth-detail'}-${width}-${reduced}`,keep);run.murals.push({index,spatial,image,displayScaleGain:newScale/oldScale,detail});
   await p.locator('#detail-return').click();await p.waitForFunction(()=>study.view==='C'&&!study.busy);assert.deepEqual((await fullImage(p)).natural,expected);
   await p.locator('#wall-return').click();await p.waitForFunction(()=>study.view==='B'&&!study.busy);assert.equal(await p.evaluate(()=>document.body.dataset.bridge),reduced?undefined:'soft-reversible-photo');
   await p.locator('#forward').click();await p.waitForFunction(()=>study.view==='C'&&!study.busy);
  }
  if(keep){run.clip={start:clipStart,end:(Date.now()-began)/1000};}
  // Fifth-mural and reverse returns retain the existing controls and reading.
  assert.equal(await p.evaluate(()=>study.travelTo(4)),true);await p.evaluate(()=>study.navigate('C'));assert.equal(await p.evaluate(()=>study.activeMural),4);assert.deepEqual((await fullImage(p)).natural,[6000,1617]);
  assert.equal(await p.evaluate(()=>study.travelTo(3)),true);assert.equal(await p.evaluate(()=>study.rear.state.projection.enabled),true);assert.equal(await p.evaluate(()=>study.travelTo(2)),true);assert.equal(await p.evaluate(()=>study.travelTo(1)),true);assert.equal(await p.evaluate(()=>study.activeMural),1);await p.evaluate(()=>study.navigate('C'));assert.deepEqual((await fullImage(p)).natural,[6000,1357]);
  assert.deepEqual(await p.evaluate(()=>study.rear.validate()),[]);assert.deepEqual(errors,[]);const video=keep?p.video():null;await context.close();if(video)run.video=await video.path();report.runs.push(run);console.log(`V3.3 ${width}x${height} ${reduced?'reduce':'normal'} passed`);
 }
 report.pass=true;
 }finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
