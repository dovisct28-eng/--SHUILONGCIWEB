const fs=require('node:fs'),path=require('node:path'),{once}=require('node:events');
const {requireBundle,root,base}=require('./runtime.cjs');
const {chromium}=requireBundle('playwright');
const {createApp}=require(path.join(root,'Mural-Exhibition/server.js'));
(async()=>{
 const server=createApp().listen(0,'127.0.0.1');await once(server,'listening');let browser;
 const report={kind:'Current unmodified local B02, actual Chrome screenshots',viewport:{width:1920,height:1080},deviceScaleFactor:1.5,states:[],errors:[],camera:'NOT_REQUESTED'};
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const p=await browser.newPage({viewport:report.viewport,deviceScaleFactor:1.5,permissions:[]});
  p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);
  await p.locator('#btn-gallery-track').click();
  await p.waitForFunction(()=>document.getElementById('panorama-bg').naturalWidth>0);
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1200);
  async function shot(name){await p.screenshot({path:path.join(base,'assets/processed',name+'.png')});report.states.push(name);}
  await shot('b02-panorama');
  await p.mouse.move(1150,540);await p.mouse.down();await p.mouse.move(800,540,{steps:20});await p.mouse.up();await p.mouse.wheel(0,-150);await p.waitForTimeout(500);await shot('b02-panorama-zoom');
  await p.locator('#pano-reset-btn').click();await p.waitForTimeout(500);
  await p.locator('.hotspot[data-ids="01"]').click();
  await p.waitForFunction(()=>document.getElementById('img-org').naturalWidth>0&&document.getElementById('info-text').children.length>0);
  await p.waitForTimeout(900);await shot('b02-detail');
  await p.locator('#index-toggle').click();await p.waitForTimeout(350);await shot('b02-index');
  report.browser=browser.version();report.status=report.errors.length?'ERRORS':'PASS';
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));fs.writeFileSync(path.join(base,'qa/runtime-capture.json'),JSON.stringify(report,null,2)+'\n');}
 if(report.status!=='PASS')throw Error(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
