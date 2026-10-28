const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});
const c=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(out,'local/corridor-recording'),size:{width:1440,height:900}}});
const p=await c.newPage(),report={pass:false,segments:[],errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
try{await p.goto('http://127.0.0.1:4186/docs/validation/temple-model-v2/model-comparison.html');await p.waitForFunction(()=>window.previewReady);
for(const recenter of [false,true])for(const id of ['baseline','corridor-a','corridor-b','corridor-c']){
 await p.evaluate(id=>preview.setVariant(id),id);await p.evaluate(r=>preview.setView('corridor',{recenter:r}),recenter);
 const result=await p.evaluate(async recenter=>{
  const id=preview.stats().id,x=recenter?preview.manifest.models[id].structure.corridor.cameraCentreX:3.85;
  document.querySelector('#state').textContent='走廊动态对照 · '+(recenter?'重新居中':'同一世界轨道');const begin=performance.now();let frames=0;
  return new Promise(resolve=>{function f(now){const t=Math.min(1,(now-begin)/2400),u=t*t*(3-2*t);preview.setPose({position:[x,1.55,9.1-2.8*u],target:[x,1.55,-3.5],fov:48});frames++;if(t<1)requestAnimationFrame(f);else resolve({id,recenter,x,fov:48,frames});}requestAnimationFrame(f);});
 },recenter);report.segments.push(result);
}
if(report.errors.length)throw Error(report.errors.join('\n'));report.pass=true;const video=p.video();await c.close();await video.saveAs(path.join(out,'selected/11-corridor-motion-comparison.webm'));
fs.writeFileSync(path.join(out,'corridor-motion-results.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS 8 actual corridor motion comparisons');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
