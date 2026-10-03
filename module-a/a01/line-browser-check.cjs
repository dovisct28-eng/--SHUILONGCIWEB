// Real Chrome acceptance; server.mjs must run on A01_PORT (default 4173).
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {PNG}=require('pngjs');
const output=process.env.A01_VALIDATION_DIR||path.resolve(__dirname,'../../docs/validation/a01-line');
const url=`http://127.0.0.1:${process.env.A01_PORT||4173}/module-a/a01/`;
fs.mkdirSync(output,{recursive:true});
const states=[['initial',0],['travel',.55],['line-early',1.45],['line-complete',2.4],['overlap',2.55],['solid',3.18],['shift',3.675],['hero',5.7],['transition',6.7]];
const read=p=>p.evaluate(()=>{const f=document.querySelector('iframe'),w=f.contentWindow,s=document.querySelector('[data-stage]'),copy=document.querySelector('.copy'),hint=document.querySelector('.scroll-hint');return {progress:document.body.dataset.animationProgress,line:w.shuilongTemple.getA01LineState(),intro:w.shuilongTemple.getIntroState(),visual:w.shuilongTemple.getVisualState(),shift:s.style.getPropertyValue('--model-x'),copyOpacity:s.style.getPropertyValue('--copy-opacity'),copy:JSON.parse(JSON.stringify(copy.getBoundingClientRect())),hint:JSON.parse(JSON.stringify(hint.getBoundingClientRect())),overflow:document.documentElement.scrollWidth>innerWidth,transparent:getComputedStyle(f).backgroundColor==='rgba(0, 0, 0, 0)'&&w.getComputedStyle(w.document.body).backgroundColor==='rgba(0, 0, 0, 0)',labels:[...w.document.querySelectorAll('.mural-label')].filter(e=>!e.hidden&&w.getComputedStyle(e).display!=='none').length,muralGeometry:w.shuilongTemple.getMuralGeometryState(),stats:w.modelStats,canvas:w.document.querySelectorAll('canvas').length};});
const seek=async(p,n)=>{await p.evaluate(n=>scrollTo(0,Math.round(n*innerHeight)),n);await p.waitForTimeout(350);};
const ready=async p=>{await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));await p.waitForFunction(()=>Object.values(document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState().assets).every(s=>s==='loaded'));await p.evaluate(()=>document.fonts.ready);};
const stable=s=>({progress:s.progress,line:s.line,intro:s.intro,visual:s.visual,shift:s.shift,copyOpacity:s.copyOpacity});
function sameImage(a,b){a=PNG.sync.read(a);b=PNG.sync.read(b);let max=0,changed=0,sum=0,significant=0;for(let i=0;i<a.data.length;i+=4){const d=Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])));if(d){changed++;sum+=d;}if(d>3)significant++;max=Math.max(max,d);}// One-code-value alpha rounding in ink mountains and WebGL edge AA are bounded separately.
assert.ok((max<=64&&changed/(a.width*a.height)<.015&&sum/changed<1.2&&significant/(a.width*a.height)<.0002)||max<=1||(max<=3&&changed/(a.width*a.height)<.04&&sum/changed<1.1)||(max<=16&&changed/(a.width*a.height)<.005)||(max<=32&&changed/(a.width*a.height)<.002&&sum/changed<2)||(max<=64&&changed/(a.width*a.height)<.001&&sum/changed<4),`image mismatch: ${max}, ${changed}`);return {significantPixels:significant,maxDelta:max,meanChangedDelta:changed?sum/changed:0,changedPixels:changed,totalPixels:a.width*a.height};}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={viewports:[],failures:[],errors:[]};
try{
 for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
  const p=await browser.newPage({viewport:{width,height}}),requests=[];
  p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await p.goto(url);await ready(p);const row={viewport:[width,height],states:[]},forward=new Map();
  for(const [name,n] of states){await seek(p,n);const s=await read(p);assert.equal(s.overflow,false);assert.equal(s.transparent,true);assert.equal(s.line.error,null);assert.equal(s.labels,0);assert.ok(s.muralGeometry.every(g=>!g.visible));assert.equal(s.canvas,1);
   if(name==='hero'){assert.equal(s.line.visible,false);assert.equal(s.line.solid,1);assert.equal(s.copyOpacity,'1');assert.ok(s.copy.left>=0&&s.copy.right<width*.4);assert.ok(s.hint.bottom<height);}
   if(name==='line-complete'){assert.ok(s.line.solid<.15);assert.ok(s.line.visible);}
   if(name==='overlap'){assert.ok(s.line.solid>.3&&s.line.solid<1);assert.ok(s.line.lineOpacity>0);}
   if(['solid','shift','hero','transition'].includes(name))assert.equal(s.line.drawCalls,0);
   const shot=await p.screenshot({path:path.join(output,`${name}-${width}x${height}.png`)});forward.set(name,{state:stable(s),shot});row.states.push({name,n,...s});
  }
  for(const [name,n] of [...states].reverse()){await seek(p,n);assert.deepEqual(stable(await read(p)),forward.get(name).state);const reversed=await p.screenshot();try{row.pixelComparisons??=[];row.pixelComparisons.push({name,...sameImage(reversed,forward.get(name).shot)});}catch(error){fs.writeFileSync(path.join(output,'reverse-failed.png'),reversed);fs.writeFileSync(path.join(output,'forward-failed.png'),forward.get(name).shot);throw Error(name+' '+width+': '+error.message);}}
  await seek(p,2.55);const stopped=stable(await read(p));await p.waitForTimeout(850);assert.deepEqual(stable(await read(p)),stopped);
  await seek(p,10.2);assert.equal((await read(p)).line.visible,false);assert.equal((await read(p)).labels,5);assert.ok((await read(p)).muralGeometry.every(g=>g.visible));
  await seek(p,5.7);assert.equal((await read(p)).labels,0);
  await seek(p,2.55);await p.reload();await ready(p);assert.ok(Math.abs(Number((await read(p)).progress)-.51)<.001);
  // Rapid jumps must land on the same pure state with no rebuild.
  await p.evaluate(()=>{scrollTo(0,42*innerHeight);scrollTo(0,.55*innerHeight);scrollTo(0,2.55*innerHeight);});await p.waitForTimeout(200);assert.deepEqual(stable(await read(p)),stopped);
  row.requests={glb:requests.filter(r=>r.endsWith('.glb')).length,environment:Object.fromEntries(['watercolor-tree','distant-landscape','ivory-mist'].map(n=>[n,requests.filter(r=>r.includes(n+'.webp')).length])),fonts:requests.filter(r=>r.endsWith('.woff2')).length};
  // Before/after reload: tree and mountain also serve the parent ink layer. No A01 mural request.
  assert.equal(row.requests.glb,2);assert.equal(row.requests.environment['ivory-mist'],2);assert.equal(row.requests.environment['watercolor-tree'],2);assert.equal(row.requests.environment['distant-landscape'],2);assert.equal(row.requests.fonts,4);
  assert.equal(requests.filter(r=>/detail\.webp|mural-\d+-display/.test(r)).length,0);
  row.reversePixels=true;row.stop=true;row.refresh=true;row.rapid=true;report.viewports.push(row);await p.close();
 }
 const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.goto(url);await ready(p);await seek(p,2.55);const count=(await read(p)).line.geometries;
 for(const [width,height] of [[1440,900],[1024,768]]){await p.setViewportSize({width,height});await p.waitForTimeout(300);const s=await read(p);assert.ok(Math.abs(Number(s.progress)-.51)<.002);assert.equal(s.line.geometries,count);}await p.close();report.resize=true;
 for(const mode of ['reduced','line-module','line-data','environment','fonts','glb']){
  const p=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  if(mode==='line-module')await p.route('**/a01-lines.mjs',r=>r.abort());
  if(mode==='line-data')await p.route('**/a01-lines-data.mjs',r=>r.abort());
  if(mode==='environment')await p.route('**/environment.mjs',r=>r.abort());
  if(mode==='fonts')await p.route('**/*.woff2',r=>r.abort());
  if(mode==='glb')await p.route('**/*.glb',r=>r.abort());
  p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await seek(p,2.55);const s=await read(p);
  if(mode==='reduced')assert.equal(s.line.depth,0);
  if(mode.startsWith('line-')){assert.ok(s.line.error);assert.ok(s.intro.elapsed>0);}
  await seek(p,5.7);assert.equal((await read(p)).copyOpacity,'1');assert.equal((await read(p)).overflow,false);await p.screenshot({path:path.join(output,`${mode}-hero-1024x768.png`)});
  report.failures.push({mode,heroAccessible:true});await p.close();
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));console.log('PASS: 36 states, four sizes, pixel reversal, stop/refresh/rapid/resize, six reduced/failure modes');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
