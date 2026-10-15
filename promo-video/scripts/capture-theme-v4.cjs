// Second take of A03 only: correct the visible title endpoint, keep A01/A02.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{once}=require('node:events');
const {chromium}=require('playwright'),{capture,step,pause,smooth,port}=require('./capture-v4.cjs');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'promo-video');
const {themeKeys:keys}=require('./v4-timing.cjs');
function position(f){const i=keys.findIndex(([at])=>at>=f);if(i<=0)return keys[0][1];const[a,x]=keys[i-1],[b,y]=keys[i];return x+(y-x)*smooth((f-a)/(b-a));}
async function main(){let server,browser;const report={keys,errors:[],visualStates:[],purpose:'Title and composition establish at absolute F747; no website source changes.'};try{
 const n=await port();server=spawn(process.execPath,['module-a/a01/server.mjs'],{cwd:root,env:{...process.env,A01_PORT:String(n)},windowsHide:true,stdio:['ignore','pipe','pipe']});await once(server.stdout,'data');browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.clock.install();await p.goto(`http://127.0.0.1:${n}/module-a/a01/`);await p.waitForFunction(()=>document.querySelector('iframe')?.contentWindow.modelReady);await p.waitForTimeout(1800);await p.evaluate(()=>document.fonts.ready);await pause(p);await p.evaluate(()=>{scrollTo(0,10.1*innerHeight);dispatchEvent(new Event('scroll'));});await step(p,300);
 report.capture=await capture(p,'a03-theme-r2',360,async f=>{await p.evaluate(n=>{scrollTo(0,n*innerHeight);dispatchEvent(new Event('scroll'));},position(f));if(f>=60&&f<=90)report.visualStates.push(await p.evaluate(f=>({frame:f+660,scroll:scrollY/innerHeight,titleOpacity:getComputedStyle(document.querySelector('.a03-title')).opacity,composition:document.querySelector('.stage')?.style.getPropertyValue('--a03-title')||getComputedStyle(document.documentElement).getPropertyValue('--a03-title')}),f));});
 report.status=report.errors.length?'PAGE_ERRORS':'CAPTURED';
 }finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(base,'recordings/v4/capture-theme-r2-report.json'),JSON.stringify(report,null,2));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
