// Capture the unchanged website, never retime an already compressed V3 shot.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{once}=require('node:events');
const {chromium}=require('playwright');
const {capture,step,pause,smooth,port}=require('./capture-v4.cjs');
const {introKeys,tourKeys}=require('./v4-timing.cjs');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'promo-video');
function map(f,keys,ease=true){const i=keys.findIndex(([at])=>at>=f);if(i<0)return keys.at(-1)[1];if(i===0)return keys[0][1];const[a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*(ease?smooth((f-a)/(b-a)):(f-a)/(b-a));}
async function scroll(p,n){await p.evaluate(n=>{scrollTo(0,n*innerHeight);dispatchEvent(new Event('scroll'));},n);}
async function main(){let server,browser;const r={errors:[],captures:[],introKeys,tourKeys,limits:['Unchanged real webpage sampled offline; not live performance evidence.','45-second tour continuously sampled into 22 seconds plus 1-second entrance; movement is editorially accelerated, not live speed.']};try{
 const n=await port();server=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:String(n)},windowsHide:true,stdio:['ignore','pipe','pipe']});await once(server.stdout,'data');
 browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,permissions:[]});const p=await ctx.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>r.errors.push(e.message));await p.clock.install();await p.goto(`http://127.0.0.1:${n}/module-a/a01/`);await p.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.modelReady);await p.waitForTimeout(1800);await p.evaluate(()=>document.fonts.ready);await pause(p);
 await scroll(p,.05);await step(p,300);
 r.captures.push(await capture(p,'a01-a03',1020,f=>scroll(p,map(f,introKeys))));
 r.captures.push(await capture(p,'a04-complete',690,async f=>{if(f<30)await scroll(p,13.2+1.3*smooth(f/29));if(f===30)await p.evaluate(()=>document.querySelector('[data-replay]').click());},f=>f<30?33:Math.round(map(f-29,tourKeys,false)*1000)-Math.round(map(f-30,tourKeys,false)*1000)));
 for(const [name,start,end,count]of[['a05',18.8,24.4,180],['a06',25.8,31.4,180],['a07',32.8,39.4,205]]){
  await scroll(p,start);await step(p,300);await p.evaluate(async()=>{for(const img of document.images)if(img.src&&!img.complete)await img.decode().catch(()=>{});});
  const scanStart=name==='a07'?35.2:start+2.4,scanAt=name==='a07'?80:65;
  const keys=[[0,start],[24,start],[scanAt,scanStart],[count-20,end],[count-1,end]];
  r.captures.push(await capture(p,name,count,f=>scroll(p,map(f,keys))));
 }
 r.status=r.errors.length?'PAGE_ERRORS':'CAPTURED';
 }finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(base,'recordings/v4/capture-a-report.json'),JSON.stringify(r,null,2));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
