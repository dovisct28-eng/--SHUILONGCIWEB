// Verify actual asset decoding, failure fallbacks, reversibility and local/offline paths.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const output=process.env.MODEL_VALIDATION_DIR;if(!output)throw Error('Set MODEL_VALIDATION_DIR');
fs.mkdirSync(output,{recursive:true});
const base='http://127.0.0.1:4175/module-a/a01/';
const state=p=>p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState());
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true,args:['--allow-file-access-from-files']});const report=[];
try{
 for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
  const p=await b.newPage({viewport:{width,height}}),errors=[],assets=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(r.url().includes('/environment-assets/'))assets.push(r.url());});
  await p.goto(base);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
  await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));
  await p.waitForFunction(()=>Object.values(document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState().assets).every(s=>s==='loaded'));
  for(const [name,n] of [['a01',5.7],['a02',9.8],['a03',12.9],['reverse',5.7]]){
   await p.evaluate(n=>scrollTo(0,n*innerHeight),n);await p.waitForTimeout(400);
   await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.model-shell')).opacity)>.999);
   const s=await state(p);assert.equal(s.error,null);assert.equal(s.resourceRequests,3);
   assert.ok(s.triangles<1000);await p.screenshot({path:path.join(output,`watercolor-${name}-${width}x${height}.png`)});
  }
  assert.equal(assets.length,3);assert.deepEqual(errors,[]);
  report.push({viewport:[width,height],assets,errors,state:await state(p)});await p.close();
 }
 for(const name of ['watercolor-tree','distant-landscape','ivory-mist']){
  const p=await b.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route(`**/${name}.webp`,r=>r.abort());await p.goto(base);
  await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
  await p.waitForFunction(()=>Object.values(document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState().assets).every(s=>s==='loaded'||s==='failed'));
  const s=await state(p);assert.equal(Object.values(s.assets).filter(s=>s==='failed').length,1);assert.equal(s.error,null);
  await p.evaluate(()=>scrollTo(0,14.5*innerHeight));await p.waitForTimeout(400);await p.getByRole('button',{name:'跳过动画'}).click();
  assert.equal((await state(p)).visible,false);await p.evaluate(()=>scrollTo(0,18.8*innerHeight));await p.waitForTimeout(400);
  assert.equal(await p.locator('.mural-guide[data-chapter="05"]').isVisible(),true);assert.deepEqual(errors,[]);
  report.push({failure:name,state:s,errors});await p.close();
 }
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'水龙祠-交互预览.html')).href+'?clean&controlled');
 await p.waitForFunction(()=>window.modelReady);await p.evaluate(()=>window.shuilongTemple.setIntroProgress(1));
 await p.waitForFunction(()=>Object.values(window.shuilongTemple.getVisualState().assets).every(s=>s==='loaded'));
 await p.screenshot({path:path.join(output,'watercolor-offline.png')});assert.deepEqual(errors,[]);
 report.push({offline:true,state:await p.evaluate(()=>window.shuilongTemple.getVisualState()),errors});await p.close();
 fs.writeFileSync(path.join(output,'watercolor-results.json'),JSON.stringify(report,null,2));console.log('PASS: four sizes, three asset failure paths, reverse, A04/A05, offline assets');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
