// Same machine, fresh contexts, sequential cold samples. No cross-device claim.
const {chromium}=require('playwright');const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');const assert=require('node:assert/strict');
const output=process.env.A01_VALIDATION_DIR||path.resolve(__dirname,'../../docs/validation/a01-visual-remaster');
const url='http://127.0.0.1:4173/module-a/a01/';
const baseline=process.env.A01_BASELINE||'9191fed7cd5d2c7dbe50c859231ead46f37cebd1';
const before=new Map(['module-a/a01/app.mjs','module-a/a01/styles.css','shuilong-temple/水龙祠-交互预览.html','shuilong-temple/environment.mjs','shuilong-temple/a01-lines.mjs','shuilong-temple/a01-art-direction.mjs'].map(file=>['/'+file,execFileSync('git',['show',baseline+':'+file],{maxBuffer:24*1024*1024})]));
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={browser:browser.version(),baseline,glbBytes:fs.statSync('shuilong-temple/shuilong-temple.glb').size,samples:[]};try{
 for(let sample=0;sample<3;sample++)for(const enabled of [false,true]){
  const context=await browser.newContext({viewport:{width:1440,height:900}}),p=await context.newPage(),requests=[];
  await p.route('**/*',route=>{const pathname=decodeURIComponent(new URL(route.request().url()).pathname);if(!enabled&&before.has(pathname))route.fulfill({body:before.get(pathname),contentType:pathname.endsWith('.html')?'text/html; charset=utf-8':pathname.endsWith('.css')?'text/css':'text/javascript'});else route.continue();});
  p.on('request',r=>requests.push(r.url()));const start=Date.now();await p.goto(url);await p.locator('.intro-mark').waitFor();const textMs=Date.now()-start;
  await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);const readyMs=Date.now()-start;
  report.gpu??=await p.evaluate(()=>{const gl=document.querySelector('iframe').contentDocument.querySelector('canvas').getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info');return extension?{vendor:gl.getParameter(extension.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)}:{vendor:gl.getParameter(gl.VENDOR),renderer:gl.getParameter(gl.RENDERER)};});
  await p.waitForFunction(()=>Object.values(document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState().assets).every(s=>s==='loaded'));await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});const assetsMs=Date.now()-start;
  const states=[];for(const [name,n] of [['line',2.4],['overlap',2.7],['hero',5.7]]){await p.evaluate(n=>scrollTo(0,n*innerHeight),n);await p.waitForTimeout(250);states.push({name,stats:await p.evaluate(()=>{const w=document.querySelector('iframe').contentWindow;return w.shuilongTemple.getA01RenderStats?.()||w.modelStats;})});}
  const memory=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats?.());
  const intervals=await p.evaluate(async()=>{const intervals=[];let last;for(let i=0;i<90;i++)await new Promise(resolve=>requestAnimationFrame(now=>{if(last)intervals.push(now-last);last=now;scrollTo(0,(1+(i%45)/45*2.2)*innerHeight);resolve();}));return intervals.sort((a,b)=>a-b);});
  for(const size of [[1024,768],[1920,1080],[1440,900]]){await p.setViewportSize({width:size[0],height:size[1]});await p.waitForTimeout(200);}
  await p.evaluate(()=>scrollTo(0,5.7*innerHeight));await p.waitForTimeout(250);
  if(enabled)assert.deepEqual(await p.evaluate(()=>{const s=document.querySelector('iframe').contentWindow.shuilongTemple.getA01RenderStats();return {geometries:s.geometries,textures:s.textures};}),{geometries:memory.geometries,textures:memory.textures});
  assert.equal(requests.filter(r=>r.endsWith('.glb')).length,1);
  assert.equal(requests.filter(r=>/detail\.webp|mural-\d+-display/.test(r)).length,0);
  report.samples.push({sample,enabled,requests:requests.length,blobRequests:requests.filter(r=>r.startsWith('blob:')).length,artModuleRequests:requests.filter(r=>r.endsWith('/a01-art-direction.mjs')).length,textMs,readyMs,assetsMs,medianFrameMs:intervals[Math.floor(intervals.length*.5)],p95FrameMs:intervals[Math.floor(intervals.length*.95)],states,glbRequests:1,fontRequests:requests.filter(r=>r.endsWith('.woff2')).length,environmentRequests:requests.filter(r=>/watercolor-tree|distant-landscape|ivory-mist/.test(r)).length,memoryStable:enabled?true:null});
  await context.close();
 }
 fs.writeFileSync(path.join(output,'performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
