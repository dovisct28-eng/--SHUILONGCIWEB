// Records real pages without modifying their code or camera/gesture state.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const {createApp}=require('../../Mural-Exhibition/server.js');
const full=process.argv.includes('--full');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'promo-video/recordings',full?'full':'');
fs.mkdirSync(out,{recursive:true});
const report={viewport:{width:1920,height:1080},sources:[],errors:[],note:'Real viewport capture; no webcam; working tree preserves user text and deletions. WebM timing is normalized after recording.'};
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function main(){let child,server,browser;try{
 const port=await freePort();child=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});
 await new Promise((res,rej)=>{child.stdout.once('data',res);child.once('error',rej);setTimeout(()=>rej(Error('server timeout')),15000).unref();});
 server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 browser=await chromium.launch({channel:'chrome',headless:true});
 const ctx=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,recordVideo:{dir:out,size:report.viewport},permissions:[]});
 const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.setDefaultTimeout(45000);
 await p.goto(`http://127.0.0.1:${port}/module-a/a01/`);
 await p.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.modelReady);await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>scrollTo(0,4.6*innerHeight));await p.waitForTimeout(1500);
 const video=p.video();const origin=await p.evaluate(()=>performance.now());
 const mark=async(name,fn)=>{const start=(await p.evaluate(()=>performance.now())-origin)/1000;await fn();const end=(await p.evaluate(()=>performance.now())-origin)/1000;report.sources.push({name,start,end});console.log(name,start.toFixed(3),end.toFixed(3));};
 const move=async(a,b,ms)=>p.evaluate(async({a,b,ms})=>{const begin=performance.now();await new Promise(res=>{function tick(now){const x=Math.min(1,(now-begin)/ms),s=x*x*(3-2*x);scrollTo(0,(a+(b-a)*s)*innerHeight);x<1?requestAnimationFrame(tick):res();}requestAnimationFrame(tick);});},{a,b,ms});
 await mark('architecture',async()=>{await move(4.6,6.2,4000);await p.waitForTimeout(1000);});
 await mark('A02',async()=>{await move(6.2,10.4,8000);});
 await mark('A03',async()=>{await move(10.4,11.8,1000);await p.waitForTimeout(2000);await p.screenshot({path:path.join(out,'A03-stable.png')});await p.waitForTimeout(2000);await move(11.8,13.2,1000);});
 await p.screenshot({path:path.join(out,'A03-end.png')});
 if(full){
  await move(13.2,14.5,1200);await mark('A04-full',async()=>{await p.waitForTimeout(48000);});
  for(const [name,a,b] of [['A05',18,24.4],['A06',25,31.4],['A07',32,39.4]]){
   await p.evaluate(a=>scrollTo(0,a*innerHeight),a);await p.waitForTimeout(1000);
   await mark(name,async()=>{await move(a,b,14000);await p.waitForTimeout(1000);});
  }
  await move(39.4,41.4,1000);await mark('A08',async()=>{await p.waitForTimeout(3500);await p.screenshot({path:path.join(out,'A08.png')});});
 }
 await p.close();await ctx.close();await video.saveAs(path.join(out,'real-a.webm'));report.videoA=path.join(out,'real-a.webm');
 // Chromium starts recording when a page is created. The exact first valid
 // capture offset is obtained from the page's performance time and logged.
 report.aOriginPerformanceMs=origin;
 const cb=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,recordVideo:{dir:out,size:report.viewport},permissions:[]});const b=await cb.newPage();
 b.on('pageerror',e=>report.errors.push(e.message));await b.goto(`http://127.0.0.1:${server.address().port}/index.html`);
 await b.locator('#btn-gallery-track').click();await b.locator('.hotspot[data-ids="01"]').click();await b.waitForFunction(()=>document.getElementById('img-org').naturalWidth>0);await b.evaluate(()=>document.fonts.ready);await b.waitForTimeout(750);
 const videoB=b.video();report.bOriginPerformanceMs=await b.evaluate(()=>performance.now());
 for(const [layer,label] of [['org','原壁画'],['line','高清线稿'],['color','数字色稿']]){
  await b.getByRole('button',{name:label,exact:true}).click();await b.waitForFunction(layer=>document.getElementById('img-'+layer).naturalWidth>0,layer);await b.waitForTimeout(1500);await b.screenshot({path:path.join(out,'B02-'+layer+'.png')});
 }
 await b.close();await cb.close();await videoB.saveAs(path.join(out,'real-b02.webm'));report.videoB=path.join(out,'real-b02.webm');
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));if(child)child.kill();fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
