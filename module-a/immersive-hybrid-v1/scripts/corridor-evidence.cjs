const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'docs/validation/immersive-hybrid-v2-2'),local=path.join(out,'local'),selected=path.join(out,'selected'),assets=path.join(root,'module-a/immersive-hybrid-v1/assets/hybrid-v2-2');
for(const dir of [local,selected])fs.mkdirSync(dir,{recursive:true});
const url='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/';
const tick=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const png=(file,data)=>fs.writeFileSync(file,Buffer.from(data.split(',')[1],'base64'));
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 const p=await b.newPage({viewport:{width:1920,height:1080},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>window.hybrid?.ready&&hybrid.model.hybrid.status==='ready');await p.evaluate(()=>document.fonts.ready);
 const gpu=await p.evaluate(()=>{const renderer=document.querySelector('iframe').contentWindow.shuilongTemple.getSharedWorldIdentity().renderer,gl=renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,version:gl.getParameter(gl.VERSION)};});
 for(const [name,state]of [['01-gate-interior','gate-interior'],['02-stage-turn','stage-turn'],['03-corridor-3d','corridor-3d']]){await p.evaluate(s=>hybrid.go(s),state);await tick(p);await p.screenshot({path:path.join(selected,name+'.png')});}
 await p.evaluate(()=>hybrid.go('corridor-hybrid'));await tick(p);
 const handoff=await p.evaluate(()=>hybrid.model.handoff());fs.writeFileSync(path.join(out,'handoff-match-camera.json'),JSON.stringify(handoff,null,2));
 await p.evaluate(()=>hybrid.model.hybrid.setMode('original'));await tick(p);await p.locator('.entry-header').evaluate(e=>e.hidden=true);await p.locator('.entry-footer').evaluate(e=>e.hidden=true);
 const original=await p.screenshot({path:path.join(assets,'corridor-reference-rgb.png')});
 const originalDepth=await p.evaluate(()=>hybrid.model.captureDepth());
 const floatBuffer=Buffer.alloc(originalDepth.depth.length*4);originalDepth.depth.forEach((v,i)=>floatBuffer.writeFloatLE(v,i*4));fs.writeFileSync(path.join(assets,'corridor-eye-depth.f32.gz'),zlib.gzipSync(floatBuffer));
 const depthMeta={...originalDepth,depth:undefined,file:'corridor-eye-depth.f32.gz',compression:'gzip',camera:handoff.camera,quantizationMaxError:60/16777215/2,background:0};fs.writeFileSync(path.join(assets,'depth.json'),JSON.stringify(depthMeta,null,2));
 const visual=Buffer.from(originalDepth.depth.map(d=>d?Math.round(255*(1-Math.min(d,30)/30)):0));await sharp(visual,{raw:{width:originalDepth.width,height:originalDepth.height,channels:1}}).png().toFile(path.join(selected,'04-corridor-depth.png'));
 png(path.join(assets,'corridor-foreground-mask.png'),await p.evaluate(()=>hybrid.model.captureMask(2.8)));
 png(path.join(assets,'corridor-surface-regions.png'),await p.evaluate(()=>hybrid.model.captureRegions()));
 await p.evaluate(()=>{hybrid.model.hybrid.setMode('hybrid');hybrid.model.hybrid.setBlend(1);});await tick(p);const enhanced=await p.screenshot({path:path.join(assets,'corridor-enhanced-rgb.png')});
 const enhancedDepth=await p.evaluate(()=>hybrid.model.captureDepth());let maxDepthDifference=0;for(let i=0;i<originalDepth.depth.length;i++)maxDepthDifference=Math.max(maxDepthDifference,Math.abs(originalDepth.depth[i]-enhancedDepth.depth[i]));
 // Coplanar triangles can interpolate a few RGB24/Float32 depth quanta apart.
 // 0.0001 design units is <1/2000 of the original .22 wall thickness.
 const depthTolerance=.0001;assert.ok(maxDepthDifference<=depthTolerance,'surface depth exceeds raster quantization tolerance');
 if(process.argv.includes('--depth-only')){const saved=JSON.parse(fs.readFileSync(path.join(out,'motion-evidence.json')));saved.maxDepthDifference=maxDepthDifference;saved.depthTolerance=depthTolerance;saved.depthEncodingRechecked=true;fs.writeFileSync(path.join(out,'motion-evidence.json'),JSON.stringify(saved,null,2));assert.ok(originalDepth.depth.every(v=>Number.isFinite(v)&&v>=0&&v<=originalDepth.maxDepth));await p.close();console.log('PASS: refreshed RGB, masks and matched linear depth; max difference',maxDepthDifference);return;}
 fs.copyFileSync(path.join(assets,'corridor-enhanced-rgb.png'),path.join(selected,'05-corridor-enhanced.png'));
 await p.evaluate(()=>{document.querySelector('.entry-header').hidden=false;document.querySelector('.entry-footer').hidden=false;hybrid.model.hybrid.setBlend(.5);});await tick(p);await p.screenshot({path:path.join(selected,'06-hybrid-50.png')});
 await p.evaluate(()=>hybrid.model.hybrid.setBlend(null));await p.evaluate(()=>hybrid.go('corridor-2_5d'));await tick(p);const final=await p.screenshot({path:path.join(selected,'07-hybrid-final.png')});
 const tileInputs=[];for(const [i,[label,buffer]]of [[0,['3D / matching camera',original]],[1,['Hybrid / matching camera',enhanced]],[2,['Hybrid / final dock',final]]]){
  const thumb=await sharp(buffer).resize(640,360).toBuffer(),caption=Buffer.from(`<svg width="640" height="360"><rect y="330" width="640" height="30" fill="#101519"/><text x="16" y="351" fill="#d8d2c5" font-family="Arial" font-size="16">${label}</text></svg>`);tileInputs.push({input:await sharp(thumb).composite([{input:caption}]).png().toBuffer(),left:i*640,top:0});
 }await sharp({create:{width:1920,height:360,channels:3,background:'#101519'}}).composite(tileInputs).webp({quality:90}).toFile(path.join(selected,'08-comparison.webp'));
 // Dense adjacent-frame evidence. Sampling is separate from the real-time video.
 const adjacent=[];for(let i=0;i<=60;i++){const t=1.5+i/120;await p.evaluate(t=>hybrid.model.setCamera(hybrid.sample(t)),t);await tick(p);await p.screenshot({path:path.join(local,`adjacent-${String(i).padStart(2,'0')}.png`)});adjacent.push({time:t,pose:await p.evaluate(()=>hybrid.model.pose),weights:await p.evaluate(()=>hybrid.model.hybrid.state().weights)});}
 fs.writeFileSync(path.join(out,'adjacent-poses.json'),JSON.stringify(adjacent,null,2));
 const door=await p.evaluate(()=>{hybrid.model.setDoorOpen(false);const closed=hybrid.model.intersections([0,1.38,12.5],[0,1.38,11.4]);hybrid.model.setDoorOpen(true);const open=hybrid.model.intersections([0,1.38,12.5],[0,1.38,11.4]);const lintel=hybrid.model.intersections([0,1.7,12.7],[0,1.7,11.4]);return {closed,open,lintel};});assert.ok(door.closed.length&&door.lintel.length);assert.equal(door.open.length,0);await p.close();
 console.log('Recording browser forward/reverse corridor, normal motion');
 const recording=await require('./corridor-record.cjs').record(b);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'motion-evidence.json'),JSON.stringify({pass:true,gpu,...recording,maxDepthDifference,depthTolerance,adjacentFrames:adjacent.length,door,errors},null,2));console.log({pass:true,maxDepthDifference,forwardMetrics:recording.forwardMetrics,reverseMetrics:recording.reverseMetrics});
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
