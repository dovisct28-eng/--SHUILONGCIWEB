// Same GPU, sequential fresh contexts, exact fab296b3 baseline served via routes.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{execFileSync}=require('child_process');
const out=path.resolve(process.env.A01_VALIDATION_DIR||'docs/validation/a01-cinematic-v2'),baseline='fab296b3a558a7037da99bb2f30c67cf3c5ecafd';
const files=['module-a/a01/app.mjs','module-a/a01/styles.css','module-a/a01/ink-scene.mjs','shuilong-temple/水龙祠-交互预览.html','shuilong-temple/environment.mjs','shuilong-temple/a01-lines.mjs','shuilong-temple/a01-lines-data.mjs','shuilong-temple/a01-art-direction.mjs'];
const old=new Map(files.map(f=>['/'+f,execFileSync('git',['show',baseline+':'+f],{maxBuffer:24*1024*1024})]));
(async()=>{const b=await chromium.launch({channel:'chrome'}),report={baseline,browser:b.version(),samples:[],errors:[]};try{
 for(const [width,height]of [[1440,900],[1920,1080]])for(let sample=0;sample<3;sample++)for(const enabled of [false,true]){
  const context=await b.newContext({viewport:{width,height}}),p=await context.newPage(),requests=[];p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await p.route('**/*',r=>{const name=decodeURIComponent(new URL(r.request().url()).pathname);if(!enabled&&old.has(name))r.fulfill({body:old.get(name),contentType:name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':'text/javascript'});else r.continue();});
  const start=Date.now();await p.goto('http://127.0.0.1:4173/module-a/a01/');await p.locator('.intro-mark').waitFor();const textMs=Date.now()-start;
  await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);const modelMs=Date.now()-start;
  await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));await p.waitForFunction(()=>Object.values(document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState().assets).every(s=>s==='loaded'));
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});const readyMs=Date.now()-start;
  report.gpu??=await p.evaluate(()=>{const gl=document.querySelector('iframe').contentDocument.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:e?gl.getParameter(e.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR)};});
  const states=[];for(const [name,progress]of [['line',2.4],['overlap',2.7],['hero',5.7]]){await p.evaluate(s=>scrollTo(0,s*innerHeight),progress);await p.waitForTimeout(350);states.push({name,stats:await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats())});}
  const intervals=await p.evaluate(async()=>{const values=[];let last;for(let i=0;i<90;i++)await new Promise(resolve=>requestAnimationFrame(now=>{if(last)values.push(now-last);last=now;scrollTo(0,(1+i/89*3.2)*innerHeight);resolve();}));return values.sort((a,b)=>a-b);});
  await p.evaluate(()=>scrollTo(0,5.7*innerHeight));await p.waitForTimeout(350);const before=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats());
  for(const size of [[1024,768],[1920,1080],[width,height]]){await p.setViewportSize({width:size[0],height:size[1]});await p.waitForTimeout(250);}await p.evaluate(()=>scrollTo(0,5.7*innerHeight));await p.waitForTimeout(350);
  const after=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats());assert.equal(after.geometries,before.geometries);assert.equal(after.textures,before.textures);
  assert.equal(requests.filter(u=>u.endsWith('.glb')).length,1);assert.equal(requests.filter(u=>/detail\.webp|mural-\d+-display/.test(u)).length,0);
  report.samples.push({viewport:[width,height],sample,enabled,textMs,modelMs,readyMs,requests:requests.length,glbRequests:1,fontRequests:requests.filter(u=>u.endsWith('.woff2')).length,matteRequests:requests.filter(u=>u.endsWith('karst-valley.webp')).length,medianFrameMs:intervals[Math.floor(intervals.length*.5)],p95FrameMs:intervals[Math.floor(intervals.length*.95)],states,memoryStable:true});console.log(`${width}x${height} ${sample} ${enabled?'v2':'baseline'}: frame median ${intervals[Math.floor(intervals.length*.5)].toFixed(1)} ms`);await context.close();
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify(report,null,2));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
