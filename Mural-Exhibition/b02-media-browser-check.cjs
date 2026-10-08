const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createApp}=require('./server.js');
const layers=['org','line','color'],ids=['img-org','img-line','img-color','video-color'];
const buttonName={org:'原壁画',line:'高清线稿',color:'数字色稿'};
const ready=(p,type)=>p.waitForFunction(type=>document.getElementById('image-wrapper').dataset.media===type&&getComputedStyle(document.getElementById(type==='video'?'video-color':`img-${type}`)).display!=='none',type);
async function inspect(p){return p.evaluate(()=>{
 const wrapper=document.getElementById('image-wrapper'),box=wrapper.getBoundingClientRect(),style=getComputedStyle(wrapper);
 const media=['img-org','img-line','img-color','video-color'].map(id=>{const el=document.getElementById(id),s=getComputedStyle(el),r=el.getBoundingClientRect();return {id,visible:s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0,width:r.width,height:r.height,left:r.left,top:r.top,right:r.right,bottom:r.bottom,natural:[el.naturalWidth||el.videoWidth,el.naturalHeight||el.videoHeight],fit:s.objectFit,transition:s.transitionDuration,src:el.getAttribute('src')};});
 return {media,type:wrapper.dataset.media,box:{left:box.left,top:box.top,right:box.right,bottom:box.bottom,width:box.width,height:box.height},border:[style.borderTopWidth,style.borderRightWidth,style.borderBottomWidth,style.borderLeftWidth],background:style.backgroundColor,shadow:style.boxShadow,outline:style.outlineWidth,pseudo:['::before','::after'].map(x=>getComputedStyle(wrapper,x).content),pressed:[...document.querySelectorAll('.layer-btn')].map(b=>b.getAttribute('aria-pressed')),busy:[...document.querySelectorAll('.layer-btn')].map(b=>b.getAttribute('aria-busy'))};
 });}
function checkState(s,type){
 const visible=s.media.filter(m=>m.visible);assert.equal(visible.length,type==='none'?0:1);assert.equal(s.type,type);
 if(type==='none')return;
 const m=visible[0];assert.equal(m.id,type==='video'?'video-color':`img-${type}`);assert.equal(m.fit,'contain');assert.equal(m.transition,'0s');
 assert.ok(m.natural[0]>0&&m.natural[1]>0);assert.ok(Math.abs(m.width/m.height-m.natural[0]/m.natural[1])<.002);
 assert.ok(m.left>=s.box.left-.1&&m.right<=s.box.right+.1&&m.top>=s.box.top-.1&&m.bottom<=s.box.bottom+.1);
 assert.ok(Math.abs(m.left+m.width/2-(s.box.left+s.box.width/2))<.1);assert.ok(Math.abs(m.top+m.height/2-(s.box.top+s.box.height/2))<.1);
 assert.ok(m.width<=m.natural[0]+.1&&m.height<=m.natural[1]+.1,'Small authored canvas must not be enlarged');
 assert.deepEqual(s.border,['0px','0px','0px','0px']);assert.equal(s.background,'rgba(0, 0, 0, 0)');assert.equal(s.shadow,'none');assert.equal(s.outline,'0px');assert.ok(s.pseudo.every(x=>x==='none'));
 assert.deepEqual(s.pressed,layers.map(k=>String(k===(type==='video'?'color':type))));
}
async function sample(p){await p.addInitScript(()=>{
 window.__mediaFrames={count:0,violations:[],running:true};
 function frame(){const f=window.__mediaFrames;if(!f.running)return;
  if(document.body.dataset.explorationState==='gallery-detail'){
   f.count++;const nodes=['img-org','img-line','img-color','video-color'].map(id=>document.getElementById(id));
   const visible=nodes.filter(el=>{const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0;});
   const pressed=[...document.querySelectorAll('.layer-btn')].filter(b=>b.getAttribute('aria-pressed')==='true');
   if(visible.length>1||visible.length===1&&(pressed.length!==1||!pressed[0].getAttribute('onclick').includes(visible[0].id==='video-color'?'color':visible[0].id.slice(4))))f.violations.push({ids:visible.map(el=>el.id),pressed:pressed.map(b=>b.textContent)});
  }requestAnimationFrame(frame);
 }requestAnimationFrame(frame);
 });}
async function open(p,origin,id){await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator(`.hotspot[data-ids="${id}"]`).click();await ready(p,'org');}
async function select(p,type){await p.getByRole('button',{name:buttonName[type],exact:true}).click();await ready(p,type);checkState(await inspect(p),type);}
async function shot(p,file){
 await p.waitForFunction(()=>getComputedStyle(document.getElementById('main-app')).opacity==='1'&&getComputedStyle(document.getElementById('floating-info')).opacity==='1');
 await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:file});
}
async function runMediaChecks(browser,origin,out){
 fs.mkdirSync(out,{recursive:true});const fixtureRoot=fs.mkdtempSync(path.join(os.tmpdir(),'b02-media-'));
 if(fs.existsSync(path.join(out,'results.json')))fs.copyFileSync(path.join(out,'results.json'),path.join(out,`results-attempt-${Date.now()}.json`));
 const report={environment:'Real Chrome rendering; synthetic ratio/alpha fixtures are isolated in OS temp and browser routes',views:[],cases:[],frames:0,violations:[],errors:[],console:[],limits:'JS heap/DOM lifecycle checks do not measure process/GPU memory. Physical camera is outside B02 scope.'};
 const pages=[];
 async function page(){const p=await browser.newPage({viewport:{width:1440,height:900}});pages.push(p);p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.console.push(m.text());});await sample(p);return p;}
 async function close(p){const f=await p.evaluate(()=>{__mediaFrames.running=false;return __mediaFrames;});report.frames+=f.count;report.violations.push(...f.violations);await p.close();}
 try{
  const request=await browser.newPage();const scan=await(await request.request.get(origin+'/api/scan-assets')).json();await request.close();
  const real=await page();
  // Static states intentionally suppress the optional video in this browser-only manifest.
  await real.route('**/api/scan-assets',r=>r.fulfill({json:{...scan,data:scan.data.map(i=>({...i,videoPath:null,resources:{...i.resources,video:null}}))}}));
  for(const [w,h] of [[1280,800],[1366,768],[1440,900],[1920,1080]]){
   await real.setViewportSize({width:w,height:h});await open(real,origin,'01');
   for(const id of ['01','06','10']){
    if(id!=='01'){await real.locator('#index-toggle').click();await real.locator(`#menu li[data-id="${id}"] button`).click();await ready(real,'org');}
    for(const layer of layers){await select(real,layer);const s=await inspect(real);const file=`real-${id}-${layer}-${w}x${h}.png`;await shot(real,path.join(out,file));report.views.push({id,layer,w,h,file,state:s});}
   }
  }
  await close(real);report.cases.push('36 real static screenshots: three author figures × three layers × four desktop sizes; computed fit, center, no stretch/upscale/crop/frame; index navigation');
  const painter=await browser.newPage();
  for(const [name,w,h,margin] of [['org',240,1200,12],['line',1500,420,30],['color',700,700,250],['small',120,160,25]]){
   const png=await painter.evaluate(({w,h,margin})=>{
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');
    c.fillStyle='#c5a576';c.fillRect(margin,margin,w-2*margin,h-2*margin);c.strokeStyle='#d8eee6';c.lineWidth=3;
    c.beginPath();c.moveTo(margin+2,margin+2);c.lineTo(w-margin-2,h-margin-2);c.moveTo(w-margin-2,margin+2);c.lineTo(margin+2,h-margin-2);c.stroke();return canvas.toDataURL('image/png').split(',')[1];
   },{w,h,margin});
   fs.writeFileSync(path.join(fixtureRoot,name+'.png'),Buffer.from(png,'base64'));
  }
  await painter.close();
  const requests={},fixtureItem={...scan.data[0],id:'fixture',name:'临时显示测试素材',infoPath:null,previews:{},videoPath:null,resources:{org:'/__b02_media__/org.png',line:'/__b02_media__/line.png',color:'/__b02_media__/color.png'},orgPath:'/__b02_media__/org.png',linePath:'/__b02_media__/line.png',colorPath:'/__b02_media__/color.png'};
  async function fixture(item=fixtureItem,handler){const p=await page();await p.route('**/api/scan-assets',r=>r.fulfill({json:{...scan,data:[item]}}));await p.route('**/__b02_media__/*',async r=>{
   const name=path.basename(new URL(r.request().url()).pathname);requests[name]=(requests[name]||0)+1;
   const body=fs.readFileSync(path.join(fixtureRoot,name));
   if(handler&&await handler(r,name))return;
   await r.fulfill({contentType:'image/png',body});
  });await open(p,origin,item.id);return p;}
  const fit=await fixture();
  for(const layer of layers){await select(fit,layer);await shot(fit,path.join(out,`fixture-${layer}.png`));}
  assert.equal(await fit.locator('#image-wrapper').getAttribute('data-dimension-match'),'false');assert.ok(!(await fit.locator('#detail-asset-status').textContent()).includes('配准'));
  const countBefore={...requests};for(let i=0;i<6;i++)await select(fit,layers[i%3]);assert.deepEqual(requests,countBefore);
  await close(fit);report.cases.push('Temporary tall/wide/square PNGs with unequal alpha margins and pixel dimensions; internal diagnostics only; repeat layer selections cause no new image requests');
  const small=await fixture({...fixtureItem,resources:{org:'/__b02_media__/small.png',line:null,color:null}});checkState(await inspect(small),'org');assert.ok(await small.getByRole('button',{name:buttonName.line,exact:true}).isDisabled());assert.ok(await small.getByRole('button',{name:buttonName.color,exact:true}).isDisabled());await shot(small,path.join(out,'fixture-small-original-only.png'));await close(small);
  for(const missing of ['line','color']){const p=await fixture({...fixtureItem,resources:{...fixtureItem.resources,[missing]:null}});assert.ok(await p.getByRole('button',{name:buttonName[missing],exact:true}).isDisabled());await p.evaluate(type=>window.switchLayer(type),missing);checkState(await inspect(p),'org');await close(p);}
  report.cases.push('Small canvas remains 120×160 with no enlargement; only original/missing line/missing color never retain another visible layer');
  const race=await fixture(fixtureItem,async(r,name)=>{if(name!=='org.png')await new Promise(resolve=>setTimeout(resolve,name==='line.png'?600:350));return false;});
  await race.getByRole('button',{name:buttonName.line,exact:true}).click();await race.waitForTimeout(80);checkState(await inspect(race),'org');assert.equal((await inspect(race)).busy[1],'true');await ready(race,'line');
  await select(race,'color');await select(race,'org');
  // Reload clears the DOM cache; the next operations race against real delayed image responses.
  await open(race,origin,'fixture');
  await race.evaluate(()=>{void window.switchLayer('line');void window.switchLayer('color');void window.switchLayer('org');});await ready(race,'org');await race.waitForTimeout(850);checkState(await inspect(race),'org');
  await open(race,origin,'fixture');await race.evaluate(()=>{void window.switchLayer('color');void window.switchLayer('line');});await ready(race,'line');await race.waitForTimeout(850);checkState(await inspect(race),'line');
  // Switching character invalidates a pending layer and clears old sources.
  await open(race,origin,'fixture');await race.getByRole('button',{name:buttonName.color,exact:true}).click();await race.locator('.study-footer [data-step="1"]').click();await ready(race,'org');await race.waitForTimeout(850);checkState(await inspect(race),'org');assert.equal(await race.locator('#img-color').getAttribute('src'),null);
  await close(race);report.cases.push('Per-frame rapid org→line→color→org, org→color→line, pending load retention, late response cancellation, character change during pending load');
  const decoding=await fixture();
  await decoding.evaluate(()=>{
   const decode=HTMLImageElement.prototype.decode;
   HTMLImageElement.prototype.decode=async function(){if(this.id==='img-line')await new Promise(r=>setTimeout(r,400));return decode.call(this);};
  });
  await decoding.getByRole('button',{name:buttonName.line,exact:true}).click();
  await decoding.waitForFunction(()=>document.getElementById('img-line').naturalWidth>0);
  await decoding.evaluate(()=>{void window.switchLayer('org');void window.switchLayer('line');});await decoding.waitForTimeout(80);checkState(await inspect(decoding),'org');
  await ready(decoding,'line');checkState(await inspect(decoding),'line');await decoding.waitForTimeout(450);checkState(await inspect(decoding),'line');await close(decoding);
  report.cases.push('Returning to a downloaded but still decoding layer waits for decoding and does not treat naturalWidth as readiness');
  let fail=true;const failed=await fixture(fixtureItem,async(r,name)=>{if(name==='line.png'&&fail){await r.fulfill({status:404,body:'expected image failure'});return true;}return false;});
  await failed.getByRole('button',{name:buttonName.line,exact:true}).click();await failed.locator('#study-retry').waitFor({state:'visible'});checkState(await inspect(failed),'org');assert.equal(await failed.locator('#img-line').getAttribute('src'),null);await shot(failed,path.join(out,'image-failure-retained.png'));fail=false;await failed.locator('#study-retry').click();await ready(failed,'line');checkState(await inspect(failed),'line');await close(failed);
  report.cases.push('404 image preserves decoded original and pressed button; no broken visible img; retry commits line');
  const video=await page();await open(video,origin,'01');await video.getByRole('button',{name:buttonName.color,exact:true}).click();await ready(video,'video');checkState(await inspect(video),'video');await video.screenshot({path:path.join(out,'real-video-exclusive.png')});
  await video.locator('#video-color').evaluate(v=>{v.currentTime=Math.max(0,v.duration-.15);});await ready(video,'color');assert.equal(await video.locator('#video-color').getAttribute('src'),null);checkState(await inspect(video),'color');
  await select(video,'line');await video.getByRole('button',{name:buttonName.color,exact:true}).click();await ready(video,'video');await select(video,'org');assert.equal(await video.locator('#video-color').getAttribute('src'),null);
  for(let i=0;i<10;i++){
   await video.getByRole('button',{name:buttonName.color,exact:true}).click();await ready(video,'video');await select(video,'org');
   assert.deepEqual(await video.locator('#video-color').evaluate(v=>({paused:v.paused,src:v.getAttribute('src'),ended:v.onended,error:v.onerror,media:document.querySelectorAll('#image-wrapper .layer-img').length})),{paused:true,src:null,ended:null,error:null,media:4});
  }
  await video.getByRole('button',{name:buttonName.color,exact:true}).click();await ready(video,'video');await video.locator('#index-toggle').click();await video.locator('#menu li[data-id="06"] button').click();await ready(video,'org');assert.equal(await video.locator('#video-color').getAttribute('src'),null);
  await close(video);report.cases.push('Real MP4 plays with all static layers hidden; natural end restores static color; ten playback/release loops keep four media nodes, paused video, no src or callbacks; character change releases video');
  for(const kind of ['404','unsupported','play-rejected','late']){
   const p=await page();
   if(kind==='play-rejected')await p.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Test play rejection','NotAllowedError'));};});
   await p.route('**/video.mp4',async r=>{
    if(kind==='404')return r.fulfill({status:404,body:'expected video failure'});
    if(kind==='unsupported')return r.fulfill({contentType:'video/mp4',body:'expected unsupported format'});
    if(kind==='late')await new Promise(resolve=>setTimeout(resolve,700));await r.continue();
   });
   await open(p,origin,'01');await p.getByRole('button',{name:buttonName.color,exact:true}).click();
   if(kind==='late'){
    await ready(p,'color');await select(p,'line');await p.waitForTimeout(1200);checkState(await inspect(p),'line');assert.equal(await p.locator('#video-color').getAttribute('src'),null);
   }else{await p.waitForFunction(()=>document.getElementById('detail-asset-status').textContent.includes('动画暂不可用'));checkState(await inspect(p),'color');assert.equal(await p.locator('#video-color').getAttribute('src'),null);}
   await close(p);
  }
  report.cases.push('Video 404, unsupported format, rejected play automatically retain static color; delayed video cannot reappear after selecting line');
  assert.ok(report.frames>100);assert.deepEqual(report.violations,[]);assert.deepEqual(report.errors,[]);
  // Only deliberately injected 404s may emit browser console errors.
  assert.ok(report.console.every(s=>/404 \(Not Found\)/.test(s)),JSON.stringify(report.console));
  report.passed=true;return report;
 }catch(error){report.failure=error.stack;throw error;}
 finally{for(const p of pages)if(!p.isClosed()){await p.unrouteAll({behavior:'wait'});await p.close();}fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));fs.rmSync(fixtureRoot,{recursive:true,force:true});}
}
module.exports={runMediaChecks};
if(require.main===module)(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const browser=await chromium.launch({channel:'chrome',headless:true});
 try{const out=path.resolve(process.env.B02_MEDIA_VALIDATION_DIR||path.join(__dirname,'../docs/validation/b02-media-switch-2026-10-08/local/media'));const r=await runMediaChecks(browser,`http://localhost:${server.address().port}`,out);console.log(JSON.stringify({passed:r.passed,views:r.views.length,frames:r.frames,cases:r.cases,violations:r.violations,errors:r.errors},null,2));}
 finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
