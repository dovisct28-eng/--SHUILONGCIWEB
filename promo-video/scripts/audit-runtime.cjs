// Phase 1 source inspection only: no video, camera, mocks, or business edits.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const {createApp}=require('../../Mural-Exhibition/server.js');
const root=path.resolve(__dirname,'../..');
const report={date:'2026-10-15',viewport:{width:1920,height:1080},cases:[],pageErrors:[],limits:'Local working tree including user edits; not pristine remote replay. No video recorded. No camera or B03 runtime tested. No performance or visual acceptance.'};
async function main(){
 let child,browser,server;
 try{
  const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
  child=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('A server startup timeout')),10000);child.stdout.once('data',()=>{clearTimeout(timeout);resolve();});child.once('error',reject);});
  server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  browser=await chromium.launch({channel:'chrome',headless:true});report.browser=browser.version();
  const context=await browser.newContext({viewport:report.viewport,permissions:[]});
  const page=await context.newPage();page.setDefaultTimeout(18000);page.on('pageerror',e=>report.pageErrors.push(e.message));
  try{
   await page.goto(`http://127.0.0.1:${port}/module-a/a01/`);
   await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.modelReady);
   await page.evaluate(()=>scrollTo(0,5.6*innerHeight));await page.waitForTimeout(500);
   report.cases.push({id:'A_MODEL',status:'PASS',state:await page.evaluate(()=>({phase:document.body.dataset.phase,canvas:document.querySelector('iframe').contentDocument.querySelectorAll('canvas').length,ready:document.querySelector('iframe').contentWindow.modelReady}))});
  }catch(e){report.cases.push({id:'A_MODEL',status:'FAILED',error:e.message.slice(0,700)});}
  try{
   const origin=`http://127.0.0.1:${server.address().port}`;
   const scan=await(await page.request.get(origin+'/api/scan-assets')).json();
   report.localCharacters=scan.data.map(x=>({id:x.id,folder:x.folderName,figure:!!x.figurePath}));
   await page.goto(origin+'/index.html');await page.locator('#btn-gallery-track').click();
   await page.locator('.hotspot[data-ids="01"]').click();
   await page.waitForFunction(()=>document.getElementById('img-org').naturalWidth>0);
   const layers=[];
   for(const [layer,label] of [['org','原壁画'],['line','高清线稿'],['color','数字色稿']]){
    await page.getByRole('button',{name:label,exact:true}).click();
    await page.waitForFunction(layer=>document.getElementById('img-'+layer).naturalWidth>0,layer);
    layers.push(await page.locator('#img-'+layer).evaluate(e=>({layer:e.id,width:e.naturalWidth,height:e.naturalHeight})));
   }
   report.cases.push({id:'B02_LAYERS_01',status:'PASS',layers,dimensionMatch:await page.locator('#image-wrapper').getAttribute('data-dimension-match')});
  }catch(e){report.cases.push({id:'B02_LAYERS_01',status:'FAILED',error:e.message.slice(0,700)});}
 }finally{
  if(browser)await browser.close();
  if(server)await new Promise(r=>server.close(r));
  if(child){const closed=new Promise(r=>child.once('exit',r));child.kill();await closed;}
  report.status=report.cases.length===2&&report.cases.every(c=>c.status==='PASS')&&!report.pageErrors.length?'PASS':'NEEDS_REVIEW';
  fs.mkdirSync(path.join(root,'promo-video/docs'),{recursive:true});
  fs.writeFileSync(path.join(root,'promo-video/docs/runtime-audit.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(report.status!=='PASS')process.exitCode=1;
 }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
