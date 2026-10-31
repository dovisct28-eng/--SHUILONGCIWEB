const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.join(__dirname,'local'),name=process.env.CLEANUP_PHASE||'before';fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={phase:name,pass:false,assets:[],errors:[],cyber:{physicalCamera:'not tested'}};try{
 const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(e.message));
 const scan=await(await p.request.get('http://localhost:3000/api/scan-assets')).json();report.assetScan=scan;
 await p.goto('http://localhost:3000/index.html');await p.locator('#btn-gallery-track').click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-map');
 report.hotspots=await p.locator('.hotspot').evaluateAll(es=>es.map(e=>({ids:e.dataset.ids,title:e.textContent})));
 for(let i=0;i<report.hotspots.length;i++){
  const hotspot=p.locator('.hotspot').nth(i);await hotspot.click();await p.waitForFunction(()=>document.body.dataset.explorationState==='gallery-detail');
  try{await p.waitForFunction(()=>document.querySelector('#img-org').naturalWidth>0,null,{timeout:10000});report.assets.push({hotspot:report.hotspots[i],loaded:true,src:await p.locator('#img-org').getAttribute('src'),title:await p.locator('#info-title').textContent()});}catch(e){report.assets.push({hotspot:report.hotspots[i],loaded:false,error:e.message});}
  if(i===0){for(const [button,selector]of[['高清线稿','#img-line'],['数字色稿','#img-color']]){await p.getByRole('button',{name:button,exact:true}).click();await p.waitForTimeout(500);report[selector]=await p.locator(selector).evaluate(e=>({src:e.getAttribute('src'),width:e.naturalWidth,display:getComputedStyle(e).display}));}report.infoText=await p.locator('#info-text').textContent();}
  await p.locator('#back-btn').click();
 }
 await p.locator('#pano-back-btn').click();await p.locator('#btn-cyber-track').click();await p.waitForTimeout(20000);
 report.cyber=await p.evaluate(()=>({physicalCamera:'not tested',state:document.body.dataset.explorationState,message:document.querySelector('#gesture-message')?.textContent,feedback:document.querySelector('#b01-feedback')?.textContent,resources:performance.getEntriesByType('resource').filter(r=>/mediapipe|gsap|three|hands|pose/i.test(r.name)).map(r=>({url:r.name,duration:r.duration,transferSize:r.transferSize}))}));
 report.pass=report.assets.every(x=>x.loaded);console.log(JSON.stringify({phase:name,pass:report.pass,characters:report.assets.map(x=>({ids:x.hotspot.ids,loaded:x.loaded})),errors:report.errors,cyber:report.cyber},null,2));
 }finally{fs.writeFileSync(path.join(out,'b-'+name+'-browser.json'),JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
