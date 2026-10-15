const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const {chromium}=require('playwright'),{createApp}=require('../../Mural-Exhibition/server.js');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'promo-video/recordings/entry-b02');fs.mkdirSync(out,{recursive:true});
async function main(){let app,a,browser;const report={errors:[],marks:[]};try{
 app=createApp().listen(3000,'127.0.0.1');await new Promise((r,j)=>{app.once('listening',r);app.once('error',j);});
 a=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:'4198'},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise(r=>a.stdout.once('data',r));
 browser=await chromium.launch({channel:'chrome',headless:true});const c=await browser.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:out,size:{width:1920,height:1080}}});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto('http://127.0.0.1:4198/module-a/a01/');await p.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.modelReady);await p.evaluate(()=>scrollTo(0,41.4*innerHeight));await p.waitForTimeout(1800);
 const mark=async(name,fn)=>{const start=await p.evaluate(()=>performance.now());await fn();report.marks.push({name,startMs:start,endMs:await p.evaluate(()=>performance.now()),url:p.url()});console.log(name);};
 await mark('A08-click',async()=>{await p.waitForTimeout(1200);await p.locator('.a08 a').click();await p.waitForURL('http://localhost:3000/index.html');await p.waitForTimeout(1000);});
 report.bNavigationPerf=await p.evaluate(()=>performance.timeOrigin);
 await p.locator('#btn-gallery-track').click();await p.waitForFunction(()=>document.getElementById('panorama-bg').naturalWidth>0);await p.waitForTimeout(700);
 await mark('B02-pan',async()=>{await p.mouse.move(1150,540);await p.mouse.down();await p.mouse.move(740,540,{steps:40});await p.mouse.up();await p.mouse.wheel(0,-170);await p.waitForTimeout(1700);});
 await p.locator('#pano-reset-btn').click();await p.waitForTimeout(500);
 await mark('B02-select',async()=>{await p.locator('.hotspot[data-ids="01"]').click();await p.waitForFunction(()=>document.getElementById('img-org').naturalWidth>0);await p.waitForTimeout(3600);});
 await mark('B02-layers',async()=>{for(const label of ['原壁画','高清线稿','数字色稿']){await p.getByRole('button',{name:label,exact:true}).click();await p.waitForTimeout(1400);}});
 await mark('B02-02',async()=>{await p.locator('#index-toggle').click();await p.locator('#menu li').filter({hasText:'东门陈五猖'}).click();await p.waitForTimeout(4500);});
 report.lastPerformanceMs=await p.evaluate(()=>performance.now());const v=p.video();await p.close();await c.close();await v.saveAs(path.join(out,'entry-and-b02.webm'));
 }finally{if(browser)await browser.close();if(app)await new Promise(r=>app.close(r));if(a)a.kill();fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
