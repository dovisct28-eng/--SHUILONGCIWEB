const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('docs/validation/module-a-dark-system/before');
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});try{
for(const [width,height]of [[1440,900],[1920,1080],[1366,768],[1024,768]]){
const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:4173/module-a/a01/');
await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));
for(const [name,n]of [['opening',.6],['hero',5.7],['handoff',6.65],['a02',8.6]]){await page.evaluate(n=>scrollTo(0,n*innerHeight),n);await page.waitForTimeout(350);await page.screenshot({path:path.join(out,`${name}-${width}x${height}.png`)});}await page.close();
}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
