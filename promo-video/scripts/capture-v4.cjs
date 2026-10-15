// Offline samples of the unchanged real page. No optical interpolation or recordVideo.
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'promo-video');
const out=path.join(base,'recordings/v4');fs.mkdirSync(out,{recursive:true});
const ff=path.join(base,'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe');
const smooth=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v);};
async function port(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const n=s.address().port;await new Promise(r=>s.close(r));return n;}
async function pause(p){await p.clock.pauseAt(await p.evaluate(()=>Date.now()+100));}
async function step(p,ms){await p.clock.runFor(ms);await p.evaluate(async ms=>{
 for(const a of document.getAnimations()){if(a.playState==='running'){a.pause();a.currentTime=0;}else if(a.playState==='paused')a.currentTime=Number(a.currentTime||0)+ms;}
 // Browser Clock does not control HTML media playback. Seek the already existing
 // source video, rather than letting slow offline screenshots accelerate it.
 for(const v of document.querySelectorAll('video')){
  if(v.hidden||!v.currentSrc||!Number.isFinite(v.duration)||v.duration<=0)continue;
  v.pause();if(v.__captureSource!==v.currentSrc){v.__captureSource=v.currentSrc;v.__captureTime=performance.now();}
  const t=(performance.now()-v.__captureTime)/1000;
  if(t>=v.duration){v.dispatchEvent(new Event('ended'));continue;}
  if(Math.abs(v.currentTime-t)>.001)await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=t;});
 }
 },ms);}
async function capture(p,name,frames,update,stepMs=1000/30){
 const file=path.join(out,name+'.mp4');if(fs.existsSync(file))throw Error('Refusing to overwrite '+file);
 const encoder=spawn(ff,['-v','error','-framerate','30','-f','image2pipe','-c:v','png','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','0','-pix_fmt','yuv420p','-movflags','+faststart',file],{windowsHide:true,stdio:['pipe','ignore','pipe']});
 let errors='';encoder.stderr.on('data',d=>errors+=d);const ended=once(encoder,'exit');
 const cdp=await p.context().newCDPSession(p),began=Date.now();const times=[];
 let failure=null,navigationBoundary=false;
 try{for(let f=0;f<frames;f++){
  if(update)await update(f,frames);
  const ms=typeof stepMs==='function'?stepMs(f):Math.round((f+1)*stepMs)-Math.round(f*stepMs);
  await step(p,ms);
  const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false,optimizeForSpeed:true});
  const buffer=Buffer.from(shot.data,'base64');if(!encoder.stdin.write(buffer))await once(encoder.stdin,'drain');
  times.push(await p.evaluate(()=>({time:performance.now(),scrollY,phase:document.body.dataset.phase,animation:document.body.dataset.animationProgress})));
  if(f%60===0)console.log(name,f+'/'+frames,'wallSeconds',((Date.now()-began)/1000).toFixed(1));
 }}catch(e){if(name==='a08-entry'&&/Execution context was destroyed/.test(e.message))navigationBoundary=true;else failure=e;}
 finally{encoder.stdin.end();}
 const [code]=await ended;if(code)throw Error(errors);if(failure)throw failure;
 return {name,file:path.relative(base,file),frames:times.length,requestedFrames:frames,navigationBoundary,fps:30,mode:'offline-browser-clock-png-lossless-h264',stepMs:typeof stepMs==='function'?'editorial time map':stepMs,pageTimes:times,wallSeconds:(Date.now()-began)/1000};
}
module.exports={capture,step,pause,smooth,port};
