// Capture each pass before continuing. Review real page images, not just metrics.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const output=path.resolve(process.env.A01_VALIDATION_DIR||'docs/validation/a01-cinematic-v2');
const pass=process.argv[2]||'camera';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader Error|WebGLProgram/.test(m.text()))errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173/module-a/a01/');await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
 await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>scrollTo(0,innerHeight*5.7));await page.waitForTimeout(700);
 fs.mkdirSync(path.join(output,pass),{recursive:true});const rows=[];
 for(const camera of pass==='camera'?['A','B','C']:['C']){
  await page.evaluate(c=>document.querySelector('iframe').contentWindow.shuilongTemple.setA01CameraCandidate(c),camera);await page.waitForTimeout(250);
  rows.push(await page.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA01ArtState()));
  await page.screenshot({path:path.join(output,pass,pass==='camera'?`camera-${camera}.png`:'hero.png')});
 }
 if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(output,pass,'results.json'),JSON.stringify(rows,null,2));console.log(`PASS ${pass}`);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
