// Actual browser media playback. Muted to avoid playing four soundtracks at once.
// Audio timing/PCM are verified independently, not claimed as human listening.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{once}=require('node:events');
const {chromium}=require('playwright');
const base=path.resolve(__dirname,'..'),out=path.join(base,'renders/v4-final');
async function main(){
 const files={'/master.mp4':path.join(out,'chubing-rujiang-v4-master.mp4'),'/50mb.mp4':path.join(out,'chubing-rujiang-v4-50mb.mp4')};
 const server=http.createServer((req,res)=>{
  if(req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>V4 playback check</title><style>body{margin:0;background:#0b151a;color:#e7dcc8}video{width:960px;display:block}</style><video controls muted></video></html>');}
  const file=files[req.url];if(!file){res.writeHead(404);return res.end();}
  const size=fs.statSync(file).size;const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  const start=range?+range[1]:0,end=range&&range[2]?Math.min(+range[2],size-1):size-1;
  res.writeHead(range?206:200,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Length':end-start+1,...(range?{'Content-Range':`bytes ${start}-${end}/${size}`}:{})});fs.createReadStream(file,{start,end}).pipe(res);
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');const origin=`http://127.0.0.1:${server.address().port}`;
 const results=[];const browsers=[];
 try{
  // Each browser actually decodes both real files through to the end.
  for(const channel of ['chrome','msedge']){
   const browser=await chromium.launch({channel,headless:true});browsers.push(browser);
   for(const movie of ['master','50mb']){
    const page=await browser.newPage({viewport:{width:1920,height:1080}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);await page.evaluate(src=>{const v=document.querySelector('video');v.src=src;v.load();},origin+'/'+movie+'.mp4');
    await page.waitForFunction(()=>document.querySelector('video').readyState>=3);
    const metadata=await page.evaluate(()=>{const v=document.querySelector('video');return {width:v.videoWidth,height:v.videoHeight,duration:v.duration,canPlay:v.canPlayType('video/mp4; codecs="avc1.640029, mp4a.40.2"')};});
    await page.evaluate(()=>{const v=document.querySelector('video');window.testEvents=[];window.testFrames=0;window.testLastMedia=0;for(const type of ['error','stalled','waiting','ended'])v.addEventListener(type,()=>window.testEvents.push({type,time:v.currentTime}));const tick=(now,m)=>{window.testFrames++;window.testLastMedia=m.mediaTime;v.requestVideoFrameCallback(tick);};v.requestVideoFrameCallback(tick);return v.play();});
    results.push({channel,version:browser.version(),movie,metadata,errors,page});
   }
  }
  const began=Date.now();let allEnded=false;
  while(Date.now()-began<220000){
   const states=await Promise.all(results.map(async r=>({r,state:await r.page.evaluate(()=>{const v=document.querySelector('video');const q=v.getVideoPlaybackQuality();return {time:v.currentTime,ended:v.ended,error:v.error?{code:v.error.code,message:v.error.message}:null,ready:v.readyState,videoFrameCallbacks:window.testFrames,lastMediaTime:window.testLastMedia,quality:{totalVideoFrames:q.totalVideoFrames,droppedVideoFrames:q.droppedVideoFrames,corruptedVideoFrames:q.corruptedVideoFrames},events:window.testEvents};})})));
   if(states.some(x=>x.state.error))throw Error(JSON.stringify(states.map(x=>x.state)));
   if(states.every(x=>x.state.ended)){for(const x of states)x.r.playback=x.state;allEnded=true;break;}
   console.log(JSON.stringify(states.map(x=>({browser:x.r.channel,movie:x.r.movie,time:x.state.time,ended:x.state.ended}))));
   await new Promise(r=>setTimeout(r,10000));
  }
  if(!allEnded)throw Error('Playback did not complete in bounded wall time');
  for(const r of results){
   await r.page.evaluate(()=>{const v=document.querySelector('video');v.currentTime=170.5;});await r.page.waitForFunction(()=>Math.abs(document.querySelector('video').currentTime-170.5)<.05&&document.querySelector('video').readyState>=2);
   await r.page.locator('video').screenshot({path:path.join(base,'local/v4-final',`playback-${r.channel}-${r.movie}.png`)});
   delete r.page;
  }
  const report={status:'BROWSER_FULL_PLAYBACK_PASS',muted:true,results,limits:['Chrome and Edge are separate installed browsers but both use Chromium.','This does not certify Windows Media Player or VLC; neither was visually operated.','Muted automated playback is not human audiovisual listening acceptance.','Video-frame callback counts are not decoded-frame counts or proof of zero dropped presentation frames.']};
  fs.writeFileSync(path.join(base,'docs/v4-final-playback.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 }finally{await Promise.all(browsers.map(b=>b.close()));await new Promise(r=>server.close(r));}
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
