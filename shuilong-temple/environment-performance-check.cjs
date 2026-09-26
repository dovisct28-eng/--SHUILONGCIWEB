// Relative headless smoke measurement, not a guarantee for every PC/GPU.
const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});const result=[];
try{for(const enabled of [false,true]){
 const p=await browser.newPage({viewport:{width:1440,height:900}});let glb=0;
 p.on('request',r=>{if(r.url().endsWith('.glb'))glb++;});
 if(!enabled)await p.route('**/environment.mjs',r=>r.abort());
 const start=Date.now();await p.goto('http://127.0.0.1:4175/module-a/a01/');
 await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
 const readyMs=Date.now()-start;
 await p.evaluate(()=>scrollTo(0,5.7*innerHeight));await p.waitForTimeout(1200);
 const metrics=await p.evaluate(async()=>{
   const win=document.querySelector('iframe').contentWindow,intervals=[];let previous=performance.now();
   for(let i=0;i<90;i++)await new Promise(resolve=>requestAnimationFrame(now=>{intervals.push(now-previous);previous=now;resolve();}));
   intervals.shift();intervals.sort((a,b)=>a-b);
   return {medianFrameMs:intervals[Math.floor(intervals.length*.5)],p95FrameMs:intervals[Math.floor(intervals.length*.95)],render:win.modelStats,visual:win.shuilongTemple.getVisualState()};
 });
 assert.equal(glb,1);result.push({enabled,readyMs,glb,...metrics});await p.close();
}
const output=process.env.MODEL_VALIDATION_DIR;if(!output)throw new Error('Set MODEL_VALIDATION_DIR');
fs.writeFileSync(path.join(output,'performance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
