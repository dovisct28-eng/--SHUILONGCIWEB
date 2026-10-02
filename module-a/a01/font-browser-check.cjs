// Hold the two real font requests, inspect fallback, then release and inspect swap.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report=[];
try{for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
 const p=await b.newPage({viewport:{width,height}}),pending=[];
 await p.route('**/*.woff2',r=>pending.push(r));
 await p.goto('http://127.0.0.1:4173/module-a/a01/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
 await p.evaluate(()=>scrollTo(0,5.7*innerHeight));await p.waitForTimeout(250);
 const read=()=>p.evaluate(()=>['.intro-mark','.copy','h1','.theme','.copy p','.scroll-hint'].map(selector=>{const e=document.querySelector(selector),r=e.getBoundingClientRect();return {selector,left:r.left,top:r.top,width:r.width,height:r.height};}));
 const fallback=await read();assert.equal(pending.length,2);
 for(const r of pending)await r.continue();await p.evaluate(()=>document.fonts.ready);
 const loaded=await read();assert.deepEqual(loaded,fallback);
 report.push({viewport:[width,height],fallback,loaded,requests:pending.length,boxesStable:true});await p.close();
}const output=process.env.A01_VALIDATION_DIR||path.resolve(__dirname,'../../docs/validation/a01-line');fs.writeFileSync(path.join(output,'font-layout.json'),JSON.stringify(report,null,2));console.log('PASS: four sizes, real delayed font swap, fixed initial/title/body/hint boxes');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
