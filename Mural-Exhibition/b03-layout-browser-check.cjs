const {stubPose,fixtureInstrument}=require('./b03-gesture-fixtures.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js');
const out=path.resolve(process.env.B03_LAYOUT_VALIDATION_DIR||path.join(__dirname,'../docs/validation/b03-hf-02/local/layout'));fs.mkdirSync(out,{recursive:true});
const report={baseline:'6220d742143568ddd96f219bac715cdc3ef8a77d',environment:'Actual Chrome, Three.js and GSAP; device boundary stubbed. Synthetic shapes are algorithm fixtures, never heritage images.',formal:[],synthetic:[],functional:[],performance:[],errors:[]};
const instrument=`window.__layout={select:loadSeriesData,reveal:setRevealed,snapshot(){lineMesh?.updateMatrixWorld();camera?.updateMatrixWorld();const project=(x,y)=>{const p=new THREE.Vector3((x-.5)*muralSize.planeWidth,(.5-y)*muralSize.planeHeight,0);p.applyMatrix4(lineMesh.matrixWorld).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}};let projection,effective;if(figureMode&&lineMesh){const a=project(0,0),b=project(1,1);projection={x:a.x,y:a.y,width:b.x-a.x,height:b.y-a.y};const bounds=calibrationOverrides.get(currentItemData.id)?.bounds||cyberConfig(currentItemData.cyber).bounds||figureMeasurement.bounds;const c=project(bounds.x,bounds.y),d=project(bounds.x+bounds.width,bounds.y+bounds.height);effective={x:c.x,y:c.y,width:d.x-c.x,height:d.y-c.y};}return {id:currentItemData?.id,figureMode,revealed:isRevealed,effective,targetEffective:stageLayout?.effective,projection,measurement:figureMeasurement,layout:orbitStage?.currentLayout,layouts:orbitStage?.layouts,layoutMs:orbitStage?.layoutMs,contents:orbitStage?.contents,forbidden:orbitProtectedAreas(isRevealed),opacity:lineMesh?.material.opacity,rendererCount:document.querySelectorAll('#webgl-container canvas').length,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries}}};`;
const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
const ready=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading')&&(!__layout.snapshot().figureMode||__layout.snapshot().opacity>=.999),null,{timeout:40000});
const hit=(a,b,gap=0)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
const close=(a,b)=>{for(const k of ['x','y','width','height'])assert.ok(Math.abs(a[k]-b[k])<.02,JSON.stringify({a,b}));};
async function verify(p,transition=false){
 const a=await p.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
  return {s:__layout.snapshot(),panels:[...document.querySelectorAll('.orbit-panel')].filter(e=>Number(getComputedStyle(e).opacity)>.12).map(e=>({...rect(e),character:e.dataset.character,content:e.dataset.content})),width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
 });
 const {s}=a;assert.equal(s.rendererCount,1);assert.equal(a.overflow,false);
 if(!s.figureMode){assert.equal(a.panels.length,0);assert.ok(await p.locator('#orbit-stage').isHidden());return {id:s.id,figureMode:false,revealed:s.revealed};}
 for(const content of s.contents.filter(c=>c.id.startsWith('crop-')))assert.ok(content.actualCoverage>=.04);
 if(!transition){close(s.effective,s.targetEffective);assert.equal(a.panels.length,s.layout.panels.length);}
 const grid=s.measurement.geometry?.grid,proj=s.projection,cells=[];
 if(grid){for(let y=0;y<grid.size;y++)for(let x=0;x<grid.size;x++)if(grid.counts[y*grid.size+x]>0)cells.push({x:proj.x+x/grid.size*proj.width,y:proj.y+y/grid.size*proj.height,width:proj.width/grid.size,height:proj.height/grid.size});}
 else cells.push(s.effective);
 for(const [i,r] of a.panels.entries()){
  assert.equal(r.character,s.id);assert.ok(r.x>=20&&r.y>=96&&r.x+r.width<=a.width-20&&r.y+r.height<=a.height-165);
  assert.ok(!cells.some(c=>hit(r,c,8)),JSON.stringify({id:s.id,r,c:cells.find(c=>hit(r,c,8))}));
  assert.ok(!s.forbidden.some(c=>hit(r,c,8)),JSON.stringify({id:s.id,r,forbidden:s.forbidden}));
  assert.ok(!a.panels.slice(i+1).some(c=>hit(r,c,12)));
 }
 if(!transition){assert.ok(s.effective.x>=0&&s.effective.y>=100&&s.effective.x+s.effective.width<=a.width&&s.effective.y+s.effective.height<=a.height-190);if(s.revealed)assert.ok(s.effective.x+s.effective.width<s.forbidden.at(-1).x-30);}
 report.performance.push({id:s.id,mode:s.revealed?'revealed':'default',layoutMs:s.layoutMs,scanMs:s.measurement.scanMs,cacheHit:s.measurement.cacheHit,candidates:s.layout.candidateCount});
 return {id:s.id,figureMode:true,revealed:s.revealed,template:s.layout.template,count:s.layout.panels.length,layout:s.layout,effective:s.effective,panels:a.panels,sourceKinds:s.contents.map(c=>c.id),cacheHit:s.measurement.cacheHit};
}
(async()=>{
 const server=createApp({admin:true}).listen(0,'localhost');await new Promise(r=>server.once('listening',r));const origin=`http://localhost:${server.address().port}`;
 const browser=await chromium.launch({channel:'chrome',headless:true});let p;
 try{
  p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));const requests=[];p.on('request',r=>requests.push(r.url()));
  await p.route('**/index.html',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,instrument+'\n    </script>\n</body>')});});
  await stubPose(p);await p.addInitScript(()=>window.Camera=class{async start(){}stop(){}});
  const enter=async()=>{await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await p.waitForFunction(()=>document.getElementById('image-wrapper').dataset.media==='org');await p.locator('#quick-switch-btn').click();await ready(p);};
  await enter();const data=(await(await p.request.get(origin+'/api/scan-assets')).json()).data;
  assert.deepEqual(data.map(x=>x.id).sort(),['01','02','03','04','05','06','07','10']);
  for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(100);
   const before=await verify(p);await shot(p,`formal-01-default-${width}x${height}`);
   await p.locator('#reveal-toggle').click();await p.waitForTimeout(1000);const opened=await verify(p);await shot(p,`formal-01-revealed-${width}x${height}`);
   await p.keyboard.press('Escape');await p.waitForTimeout(1000);const restored=await verify(p);assert.deepEqual(restored.layout,before.layout);
   report.formal.push({width,height,before,opened,restored,resourceStatus:'ID01 tracked formal figure'});
  }
  await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(80);const fresh=(await verify(p)).layout;
  await enter();assert.deepEqual((await verify(p)).layout,fresh);report.functional.push('Actual navigation reload restores identical ID01 default layout at the same viewport');
  const memory=await p.evaluate(()=>__layout.snapshot()),n=requests.length;
  for(let i=0;i<12;i++){await p.evaluate(()=>__layout.reveal(true));await p.waitForTimeout(25);await verify(p,true);await p.evaluate(()=>__layout.reveal(false));await p.waitForTimeout(25);}
  await p.waitForTimeout(1000);assert.deepEqual((await verify(p)).layout,fresh);const after=await p.evaluate(()=>__layout.snapshot());assert.equal(after.textures,memory.textures);assert.equal(after.geometries,memory.geometries);assert.equal(requests.slice(n).filter(u=>/\.(png|webp)(\?|$)/.test(u)).length,0);
  await p.evaluate(()=>__layout.reveal(true));await p.waitForTimeout(1000);const rn=requests.length;
  await p.setViewportSize({width:1280,height:800});await p.waitForTimeout(100);await verify(p);await p.setViewportSize({width:1440,height:900});await p.waitForTimeout(100);await verify(p);assert.equal(requests.slice(rn).filter(u=>/\.(png|webp)(\?|$)/.test(u)).length,0);
  report.functional.push('12 quick reversals, resize while revealed and return, no reloads/GL growth; visible transition panels avoid the moving actual projected silhouette');
  await p.emulateMedia({reducedMotion:'reduce'});
  for(let i=0;i<data.length;i++){
   await p.evaluate(i=>__layout.select(i),i);await ready(p);assert.ok(await p.evaluate(()=>__layout.snapshot().revealed));
   const opened=await verify(p);await p.evaluate(()=>__layout.reveal(false));const closed=await verify(p);await p.evaluate(()=>__layout.reveal(true));
   report.formal.push({id:data[i].id,resourceStatus:data[i].figurePath?(data[i].id==='01'?'tracked formal figure':'preexisting local uncommitted figure'):'legacy line/color compatibility, no formal cutout acceptance',opened,closed});
   if(data[i].id==='05'&&data[i].figurePath){await shot(p,'local-author-05-revealed-1440x900');await p.evaluate(()=>__layout.reveal(false));await shot(p,'local-author-05-default-1440x900');await p.evaluate(()=>__layout.reveal(true));}
  }
  await p.evaluate(()=>__layout.select(0));await ready(p);await p.locator('#calibration-toggle').click();
  await p.locator('[data-orbit="maxPanels"]').fill('2');assert.ok((await p.evaluate(()=>__layout.snapshot())).layout.panels.length<=2);
  await p.locator('[data-orbit="template"]').selectOption('horizontal');assert.equal((await p.evaluate(()=>__layout.snapshot())).layout.template,'horizontal');
  await p.locator('#calibration-copy').click();const config=JSON.parse(await p.locator('#calibration-json').inputValue());assert.equal(config.cyber.orbit.maxPanels,2);assert.equal(config.cyber.orbit.template,'horizontal');
  await p.locator('#calibration-reset').click();assert.equal(JSON.parse(await p.locator('#calibration-json').inputValue()).cyber.orbit.template,'auto');await p.locator('#calibration-close').click();report.functional.push('All eight scanned IDs preserve revealed state through switches; figure/legacy composition clears old canvases; optional author orbit preview/copy/reset works');
  const images=await p.evaluate(()=>{
   const result={};for(const name of ['tall','wide','left','right','thin','irregular','holes','edge','opaque','empty','invalid']){
    const w=480,h=480,c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),image=ctx.createImageData(w,h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const nx=x/w,ny=y/h,filled={tall:nx>.46&&nx<.54&&ny>.03&&ny<.97,wide:ny>.44&&ny<.56&&nx>.03&&nx<.97,left:(nx>.04&&nx<.36&&ny>.1&&ny<.9)||(ny>.49&&ny<.51&&nx<.94),right:(nx>.64&&nx<.96&&ny>.1&&ny<.9)||(ny>.49&&ny<.51&&nx>.06),thin:(nx>.42&&nx<.6&&ny>.15&&ny<.9)||(ny>.21&&ny<.22&&nx>.01&&nx<.99),irregular:Math.hypot(nx-.5,ny-.5)<.45&&(nx<.4||ny>.55||nx>.7),holes:Math.hypot(nx-.5,ny-.5)<.44&&Math.hypot(nx-.5,ny-.5)>.23,edge:nx<.25&&ny>.01&&ny<.99,opaque:!(nx<.06&&ny<.2),empty:false,invalid:true}[name];
     if(filled)image.data.set([170,130,80,name==='thin'&&nx>.65?1:255],(y*w+x)*4);
    }
    ctx.putImageData(image,0,0);result[name]=c.toDataURL('image/png');
   }return result;
  });
  for(const [name,url]of Object.entries(images))await p.route(`**/layout-fixture-${name}.png`,r=>r.fulfill({contentType:'image/png',body:Buffer.from(url.split(',')[1],'base64')}));
  const fixtures=Object.keys(images).map((name,i)=>({...data[0],id:'synthetic-'+name,name:'合成几何测试 · '+name,order:90+i,position:{x:null,y:null},annotated:false,ready:false,englishName:'Algorithm fixture',figurePath:'/layout-fixture-'+name+'.png',linePath:name==='invalid'?data[0].linePath:null,colorPath:name==='invalid'?data[0].colorPath:null,infoPath:null,videoPath:null,previews:{},resources:{figure:'/layout-fixture-'+name+'.png'},cyber:{summary:'仅验证几何布局，不是壁画人物或史料。'}}));
  await p.route('**/api/scan-assets',r=>r.fulfill({json:{success:true,data:[...data,...fixtures],diagnostics:[]}}));await enter();
  for(let i=0;i<fixtures.length;i++){
   await p.evaluate(i=>__layout.select(i),data.length+i);
   if(fixtures[i].id==='synthetic-empty'){await p.waitForFunction(()=>document.getElementById('cyber-asset-status').textContent.includes('为空'));assert.ok(await p.locator('#orbit-stage').isHidden());report.synthetic.push({name:'empty',diagnosed:true,staleImagesVisible:false});continue;}
   await ready(p);
   if(fixtures[i].id==='synthetic-invalid'){assert.ok(!(await p.evaluate(()=>__layout.snapshot())).figureMode);await verify(p);report.synthetic.push({name:'invalid-opaque',legacyFallback:true});continue;}
   for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
    await p.setViewportSize({width,height});await p.waitForTimeout(30);await p.evaluate(()=>__layout.reveal(false));const before=await verify(p);
    await p.evaluate(()=>__layout.reveal(true));const opened=await verify(p);if(width===1440)await shot(p,fixtures[i].id+'-revealed');
    await p.evaluate(()=>__layout.reveal(false));const restored=await verify(p);assert.deepEqual(restored.layout,before.layout);if(width===1440)await shot(p,fixtures[i].id+'-default');
    report.synthetic.push({name:fixtures[i].id,width,height,before,opened,restored});
   }
  }
  // A late response must never replace the next figure's panel source.
  await p.route('**/layout-fixture-left.png',async r=>{await new Promise(resolve=>setTimeout(resolve,250));await r.continue().catch(()=>{});});
  await p.evaluate(i=>__layout.select(i),data.length+2);await p.waitForFunction(()=>document.getElementById('webgl-container').hasAttribute('data-loading'));await p.evaluate(i=>__layout.select(i),data.length+3);await ready(p);await p.waitForTimeout(320);assert.equal((await verify(p)).id,'synthetic-right');
  await p.locator('#quick-switch-btn').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');assert.ok(await p.locator('#orbit-stage').isHidden());assert.ok(await p.locator('.orbit-panel canvas').evaluateAll(els=>els.every(c=>c.width===0&&c.height===0)));
  report.functional.push('Nine valid synthetic silhouettes at four viewports in both modes plus restore; empty/opaque Alpha safe diagnostics; delayed old image cannot replace current source; mode exit clears all panel bitmaps');
  assert.deepEqual(report.errors,[]);
 }catch(error){report.failure=error.stack;if(p){report.failureState=await p.evaluate(()=>({state:document.body.dataset.explorationState,status:document.getElementById('cyber-asset-status')?.textContent,snapshot:window.__layout?.snapshot()})).catch(()=>({}));await shot(p,'failure').catch(()=>{});}throw error;}
 finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 console.log('B03 adaptive layout browser: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
