const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{once}=require('node:events');
const {chromium}=require('playwright'),{createApp}=require('../../Mural-Exhibition/server.js');
const {capture,step,pause,smooth,port}=require('./capture-v3.cjs');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'promo-video');
function map(f,keys){let i=keys.findIndex(([at])=>at>=f);if(i<0)return keys.at(-1)[1];if(i===0)return keys[0][1];const [a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*smooth((f-a)/(b-a));}
async function scroll(p,n){await p.evaluate(n=>{scrollTo(0,n*innerHeight);dispatchEvent(new Event('scroll'));},n);}
async function main(){let a,browser,b;const r={status:'RUNNING',errors:[],captures:[],events:[],limits:['Offline samples of unchanged real pages, not live frame-rate evidence.','A04 entire path retains turns; moving source time is accelerated with an explicit time map.']};try{
 const n=await port();a=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:String(n)},windowsHide:true,stdio:['ignore','pipe','pipe']});await once(a.stdout,'data');
 // A08 has an existing absolute localhost:3000 entry. Reuse only the known app.
 try{b=createApp().listen(3000,'127.0.0.1');await new Promise((resolve,reject)=>{b.once('listening',resolve);b.once('error',reject);});}catch(e){if(e.code!=='EADDRINUSE')throw e;b=null;const reply=await fetch('http://localhost:3000/api/b03-runtime');const json=await reply.json();r.reusedBServer=json;}
 browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,permissions:[]});const p=await ctx.newPage();p.on('pageerror',e=>r.errors.push(e.message));await p.clock.install();await p.goto(`http://127.0.0.1:${n}/module-a/a01/`);await p.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.modelReady);await p.waitForTimeout(2000);await p.evaluate(()=>document.fonts.ready);await pause(p);
 await scroll(p,.05);await step(p,300);
 r.captures.push(await capture(p,'a01-a03',870,async f=>scroll(p,map(f,[[0,.05],[240,4.8],[285,5.2],[330,6.4],[450,7.2],[540,8.9],[630,9.8],[690,10.4],[720,11.8],[840,11.8],[869,13.2]]))));
 const tourKeys=[[0,0],[54,3],[65,4],[102,6],[119,8],[240,18],[264,22],[385,32],[407,36],[484,41],[539,45]];
 const linear=(f,keys)=>{const i=keys.findIndex(([a])=>a>=f);if(i<0)return keys.at(-1)[1];if(i===0)return keys[0][1];const[a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*(f-a)/(b-a);};
 r.a04TimeMap=tourKeys;r.captures.push(await capture(p,'a04-complete',570,async f=>{if(f<30)await scroll(p,13.2+1.3*smooth(f/29));if(f===30)await p.evaluate(()=>document.querySelector('[data-replay]')?.click());},f=>f<30?33:Math.round(linear(f-29,tourKeys)*1000)-Math.round(linear(f-30,tourKeys)*1000)));
 // Each of the three guides uses the real right-to-left scroll. Editorial cuts
 // move between chapters only; no fabricated focus/zoom/hotspot is introduced.
 for(const [name,start,end,frames]of[['a05',18,24.4,108],['a06',25,31.4,109],['a07',32,39.4,108]]){
  await scroll(p,start);await step(p,300);await p.evaluate(async()=>{for(const img of document.images)if(img.src&&!img.complete)await img.decode().catch(()=>{});});
  r.captures.push(await capture(p,name,frames,async f=>scroll(p,start+(end-start)*smooth(f/(frames-1)))));
 }
 await scroll(p,41.4);await step(p,500);await p.evaluate(()=>document.fonts.ready);
 const entry=await p.locator('.a08 a').boundingBox();if(!entry)throw Error('A08 entry missing');
 await p.evaluate(({x,y})=>{const e=document.createElement('div');e.id='capture-pointer';e.style.cssText=`position:fixed;left:${x}px;top:${y}px;width:14px;height:14px;border:2px solid #f4e9cd;border-radius:50%;z-index:2147483647;pointer-events:none`;document.body.append(e);},{x:entry.x+entry.width/2,y:entry.y+entry.height/2});
 r.captures.push(await capture(p,'a08-entry',90,async f=>{if(f===64){await p.mouse.move(entry.x+entry.width/2,entry.y+entry.height/2);await p.mouse.down();}if(f===65){await p.mouse.up();r.events.push({capture:'a08-entry',frame:f,action:'real-click-entry'});}if(f===89)r.entryUrl=p.url();}));
 r.status=r.errors.length?'PAGE_ERRORS':'CAPTURED';
 }finally{if(browser)await browser.close();if(a)a.kill();if(b)await new Promise(x=>b.close(x));fs.writeFileSync(path.join(base,'recordings/v3/capture-a-full-report.json'),JSON.stringify(r,null,2));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
