// Independent film capture using the source renderer's public presentation API.
// This is a programmed model shot, not a claim about a new website feature.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'promo-video/recordings/intro-v3');fs.mkdirSync(out,{recursive:true});
async function main(){let a,b;const report={kind:'programmed-source-model',errors:[]};try{
 a=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:'4199'},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise(r=>a.stdout.once('data',r));
 b=await chromium.launch({channel:'chrome',headless:true});const c=await b.newContext({viewport:{width:1920,height:1080},recordVideo:{dir:out,size:{width:1920,height:1080}}});const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto('http://127.0.0.1:4199/shuilong-temple/水龙祠-交互预览.html?clean&controlled');await p.waitForFunction(()=>window.modelReady&&window.shuilongTemple.setA01Presentation);await p.evaluate(()=>{window.shuilongTemple.setA01Presentation(.09);window.shuilongTemple.setVisualProgress(.1);});await p.waitForTimeout(1200);
 await p.addStyleTag({content:'html,body{background:#0b151a!important}'});report.startPerformanceMs=await p.evaluate(()=>performance.now());
 await p.evaluate(async()=>{const start=performance.now();await new Promise(res=>{function frame(now){const t=Math.min(1,(now-start)/12000);window.shuilongTemple.setA01Presentation(.09+.86*Math.min(1,t*2));window.shuilongTemple.setVisualProgress(.1+5.8*t);t<1?requestAnimationFrame(frame):res();}requestAnimationFrame(frame);});});
 await p.waitForTimeout(3000);report.endPerformanceMs=await p.evaluate(()=>performance.now());const video=p.video();await p.screenshot({path:path.join(out,'settled.png')});await p.close();await c.close();await video.saveAs(path.join(out,'temple-intro.webm'));
 }finally{if(b)await b.close();if(a)a.kill();fs.writeFileSync(path.join(out,'capture-report.json'),JSON.stringify(report,null,2));}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
