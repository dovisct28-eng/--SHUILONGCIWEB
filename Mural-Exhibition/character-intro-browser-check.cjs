const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createApp}=require('./server.js'),{syntheticCamera}=require('./b03-gesture-fixtures.cjs');
const out=path.resolve(__dirname,'../docs/validation/b-character-intro-2026-10-14');
fs.mkdirSync(path.join(out,'local'),{recursive:true});fs.mkdirSync(path.join(out,'selected'),{recursive:true});
const report={status:'NOT_TESTED',views:[],characters:[],cases:[],errors:[],limits:'Actual Chrome, local assets, Three.js and GSAP; synthetic camera and model outputs. Physical camera NOT_TESTED.'};
const ready=p=>p.waitForFunction(()=>{const e=document.getElementById('info-text');return e.children.length>0&&!e.querySelector('button');});
const cyberReady=p=>p.waitForFunction(()=>document.body.dataset.explorationState==='cyber'&&!document.getElementById('webgl-container').hasAttribute('data-loading'),null,{timeout:40000});
const body=p=>p.locator('#info-text').innerHTML();
async function noSources(p){assert.equal(await p.locator('#info-text .archive-sources,#info-text a').count(),0);assert.doesNotMatch(await p.locator('#info-text').textContent(),/资料来源|查看来源|请在图鉴中阅读/);}
async function geometry(p){return p.locator('#info-text').evaluate(e=>{const r=e.getBoundingClientRect();return {width:innerWidth,height:innerHeight,x:r.x,y:r.y,right:r.right,bottom:r.bottom,scroll:e.scrollHeight>e.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth};});}
(async()=>{
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));
 let browser,p;
 try {
  browser=await chromium.launch({channel:'chrome',headless:true});p=await browser.newPage({viewport:{width:1440,height:900}});
  p.on('pageerror',e=>report.errors.push(e.message));await syntheticCamera(p);
  const origin='http://localhost:'+server.address().port;
  await p.route('**/index.html',async r=>{const res=await r.fetch();await r.fulfill({response:res,body:(await res.text()).replace(/\r?\n    <\/script>\r?\n<\/body>/,'\nwindow.__intro={select:loadSeriesData};\n    </script>\n</body>')});});
  const scan=await(await p.request.get(origin+'/api/scan-assets')).json();
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await ready(p);
  for(const [i,item]of scan.data.entries()){
   await p.evaluate(i=>__intro.select(i),i);await ready(p);const expected=await body(p);await noSources(p);
   if(item.figurePath||(item.linePath&&item.colorPath)){
    await p.locator('#quick-switch-btn').click();await cyberReady(p);await ready(p);assert.equal(await body(p),expected,item.id);await noSources(p);
    await p.locator('#quick-switch-btn').click();await ready(p);assert.equal(await body(p),expected);
   }
   report.characters.push({id:item.id,name:item.name,status:'PASS'});
  }
  await p.evaluate(()=>__intro.select(0));await ready(p);const expected=await body(p);
  for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
   await p.setViewportSize({width,height});await p.waitForTimeout(400);await noSources(p);
   const gallery=await geometry(p);assert.ok(!gallery.overflow&&gallery.x>=0&&gallery.bottom<=height&&gallery.right<=width);
   await p.locator('#info-text').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:path.join(out,width===1440?'selected':'local',`gallery-${width}x${height}.png`)});
   await p.locator('#quick-switch-btn').click();await cyberReady(p);await ready(p);await p.locator('#reveal-toggle').click();await p.waitForTimeout(900);
   assert.equal(await body(p),expected);await noSources(p);const cyber=await geometry(p);assert.ok(!cyber.overflow&&cyber.x>=0&&cyber.bottom<=height&&cyber.right<=width);assert.ok(cyber.scroll);
   await p.locator('#info-text').evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await p.locator('#info-text').evaluate(e=>e.scrollTop>0));
   await p.screenshot({path:path.join(out,width===1440?'selected':'local',`cyber-${width}x${height}.png`)});
   await p.keyboard.press('Escape');await p.waitForTimeout(750);assert.equal(await p.locator('#floating-info').evaluate(e=>e.inert),true);
   await p.locator('#quick-switch-btn').click();await ready(p);report.views.push({width,height,gallery,cyber,status:'PASS'});
  }
  // Read-only request fixtures exercise errors, retries, missing content and racing responses in both modes.
  const infoURL=origin+scan.data[0].infoPath;
  for(const track of ['gallery','cyber']){
   if(track==='cyber'){await p.locator('#quick-switch-btn').click();await cyberReady(p);await p.locator('#reveal-toggle').click();await p.waitForTimeout(900);}
   await p.route(infoURL,r=>r.fulfill({status:500,body:'test failure'}));await p.evaluate(()=>__intro.select(0));await p.getByRole('button',{name:'重试档案'}).waitFor();
   await p.unroute(infoURL);await p.getByRole('button',{name:'重试档案'}).click({force:track==='cyber'});await ready(p);assert.equal(await body(p),expected);
   await p.route(infoURL,async r=>{await new Promise(resolve=>setTimeout(resolve,500));await r.fulfill({body:'过期档案测试'}).catch(()=>{});});
   await p.evaluate(()=>{__intro.select(0);__intro.select(1);});await ready(p);await p.waitForTimeout(700);assert.doesNotMatch(await p.locator('#info-text').textContent(),/过期档案/);await p.unroute(infoURL);
   report.cases.push(track+': load failure/retry and stale response PASS');
  }
  const fixture=structuredClone(scan);fixture.data[0].infoPath='/test-intro.md';fixture.data[0].sources=[{title:'不应显示的资料来源',url:'https://example.com'}];fixture.data[0].cyber={...fixture.data[0].cyber,summary:'旧简介不应显示'};
  await p.route('**/api/scan-assets',r=>r.fulfill({json:fixture}));await p.route('**/test-intro.md',r=>r.fulfill({body:'# 测试正文\n安全原文 <script>window.__unsafe=true</script>\n\n## English Summary\nComplete English paragraph.'}));
  await p.goto(origin+'/index.html');await p.locator('#btn-gallery-track').click();await p.locator('.hotspot[data-ids="01"]').click();await ready(p);const fixtureBody=await body(p);await noSources(p);
  await p.locator('#quick-switch-btn').click();await cyberReady(p);await ready(p);assert.equal(await body(p),fixtureBody);assert.equal(await p.evaluate(()=>window.__unsafe),undefined);assert.doesNotMatch(await p.locator('#info-text').textContent(),/旧简介/);await noSources(p);
  fixture.data[0].infoPath=null;await p.goto(origin+'/index.html');await p.locator('#btn-cyber-track').click();await cyberReady(p);await ready(p);assert.equal(await p.locator('#info-text').textContent(),'人物档案待补充');await noSources(p);
  report.cases.push('Shared markdown body, supplied sources hidden, legacy summary ignored, HTML remains text, missing cyber archive placeholder PASS');
  assert.deepEqual(report.errors,[]);report.status='PASS';
 } catch(error){report.status='FAIL';report.failure=error.stack;if(p){report.failureState=await p.locator('body').innerText();await p.screenshot({path:path.join(out,'local',`failure-${Date.now()}.png`)});}throw error;}
 finally {fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
 console.log('Shared character introduction browser checks PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
