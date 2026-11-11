const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=require('./validation-paths-v3.5.cjs').out,local=path.join(out,'local');fs.mkdirSync(local,{recursive:true});
const layout=process.env.V35_LAYOUT||'model',reportName=layout==='report'?'results-report.json':'results.json';
const base=process.env.V35_ORIGIN||'http://127.0.0.1:4173',url=base+'/module-a/gallery/?debug&layout='+layout;
const sizes=[[2880,990],[6000,1357],[2400,1850],[2400,1200],[6000,1617]];
async function idle(p){await p.waitForFunction(()=>window.study?.ready&&!study.busy,null,{timeout:90000});}
async function click(p,s){await p.locator(s).click();await idle(p);}
async function snap(p,name){await p.screenshot({path:path.join(local,(layout==='report'?'report-':'')+name+'.png')});}
async function imageState(p){return p.locator('#reading-image').evaluate(im=>{const r=im.getBoundingClientRect(),scale=Math.min(r.width/im.naturalWidth,r.height/im.naturalHeight);return{natural:[im.naturalWidth,im.naturalHeight],fit:getComputedStyle(im).objectFit,width:im.naturalWidth*scale,height:im.naturalHeight*scale,x:r.x+(r.width-im.naturalWidth*scale)/2,y:r.y+(r.height-im.naturalHeight*scale)/2,src:im.currentSrc};});}
async function observeWallMotion(p){
 await p.evaluate(()=>{
  const {model}=study.runtime;
  let scene=model.root;
  while(scene.parent)scene=scene.parent;
  const names=['V32-real-second-mural-candidate',...['03','04','05'].map(i=>'V33-real-mural-'+i)];
  window.wallMotion=[];
  const setCamera=model.setCamera;
  model.setCamera=(pose,options)=>{
   setCamera(pose,options);
   const progress=pose.route12??pose.rearProgress;
   if(study.view!=='A'||!study.busy||document.body.dataset.routeTravel!=='true'||document.body.dataset.tourPhase==='sweep'||progress<=.1||progress>=.9||progress==null)return;
   const first=model.mural.state();
   const walls=names.map(name=>{
    const mesh=scene.getObjectByName(name);
    return mesh?.visible&&mesh.material.opacity===1&&mesh.material.color.toArray().every(c=>c<=.12);
   });
   wallMotion.push({first:first.originalVisible&&first.originalOpacity===1&&first.brightness===.14,walls});
  };
 });
}
async function observeFirstWallHandoff(p){
 await p.evaluate(()=>{
  const runtime=study.runtime;
  const go=runtime.go;
  window.firstWallHandoffs=[];
  runtime.go=(stop,options)=>{
   if(study.activeMural===0&&runtime.state==='mural-reading'&&stop==='mural-look'){
    firstWallHandoffs.push({
     readingHidden:document.querySelector('#reading').hidden,
     spaceVisible:getComputedStyle(document.querySelector('#space')).visibility==='visible',
    });
   }
   return go.call(runtime,stop,options);
  };
 });
}
async function assertWallMotion(p){
 const samples=await p.evaluate(()=>wallMotion.splice(0));
 assert.ok(samples.length,'sampled the walls during spatial movement');
 for(const {first,walls} of samples){
  assert.equal(first,true,'first mural remains dark and attached');
  assert.deepEqual(walls,[true,true,true,true],'second through fifth murals remain dark and attached');
 }
 return samples.length;
}
async function guidedTour(p,keep){
 const {width,height}=p.viewportSize();
 assert.deepEqual(await p.evaluate(()=>[study.view,study.runtime.state,study.runtime.stops.length]),['A','overview',9]);
 await p.mouse.move(width/2,height/2);
 await p.evaluate(async()=>{
  const {sampleGuidedGallery}=await import('/module-a/immersive-hybrid-v1/src/corridor-path.mjs');
  const h=study.runtime,marks=[.78,.92,1,1.6,2];
  window.guidedCrossings=[];
  let start;
  function sample(now){
   if(h.progress>0)start??=now;
   while(marks.length&&h.progress>=marks[0]){
    const pose=h.model.pose,expected=sampleGuidedGallery(h.progress);
    const poseError=Math.hypot(...['position','target'].flatMap(key=>pose[key].map((v,i)=>v-expected[key][i])));
    guidedCrossings.push({position:marks.shift(),ms:now-start,poseError});
   }
   if(marks.length)requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
 });
 const start=Date.now();
 await p.mouse.wheel(0,120);
 await p.waitForFunction(()=>study.busy);
 await idle(p);
 const elapsedMs=Date.now()-start;
 const wall=await p.evaluate(async()=>{
  const {sampleMuralFront,FIRST_FRONT_DOCK}=await import('/module-a/immersive-hybrid-v1/src/mural-front.mjs');
  const h=study.runtime,s=h.mural.snapshot(),expected=sampleMuralFront(0,FIRST_FRONT_DOCK),pose=h.model.pose;
  const poseError=Math.max(...['position','target'].flatMap(k=>pose[k].map((v,i)=>Math.abs(v-expected[k][i]))),Math.abs(pose.fov-expected.fov));
  return{view:study.view,state:h.state,progress:h.progress,turn:s.turn,front:s.front,reading:s.reading,brightness:s.brightness,cueOpacity:s.cueOpacity,pose,poseError,railFrameMs:h.metrics(),phases:s.runs.map(r=>r.field),readingHidden:document.querySelector('#reading').hidden};
 });
 assert.deepEqual([wall.view,wall.state,wall.progress,wall.turn,wall.front,wall.reading,wall.brightness,wall.cueOpacity,wall.readingHidden],['B','mural-look',2,1,0,0,1,0,true]);
 assert.ok(wall.poseError<1e-6,'first mural wall camera');
 const reduced=await p.evaluate(()=>document.body.dataset.reducedMotion==='true');
 assert.deepEqual(wall.phases,reduced?['turn','mural-cue-hold']:['turn','mural-cue-in','mural-cue-hold','mural-brighten']);
 const crossings=await p.evaluate(()=>guidedCrossings);
 assert.deepEqual(crossings.map(c=>c.position),[.78,.92,1,1.6,2]);
 if(!reduced){
  assert.ok(crossings.slice(0,4).every(c=>c.poseError<1e-8),'guided motion uses the continuous turn');
  const corridorMs=crossings[4].ms-crossings[3].ms;
  assert.ok(Math.abs(corridorMs-4996)<500,'normal pace along the right corridor');
 }
 if(keep)await snap(p,'guided-first-wall');
 await p.waitForTimeout(650);
 assert.equal(await p.evaluate(()=>study.runtime.state),'mural-look');
 await p.mouse.wheel(0,120);await p.waitForFunction(()=>study.view==='C');await idle(p);
 return{elapsedMs,crossings,...wall};
}
async function stressTour(p){
 await p.reload();await idle(p);
 // Keep the key down through arrival and deliver repeat events after unlocking.
 await p.keyboard.down('ArrowDown');await p.waitForFunction(()=>study.busy);
 for(const selector of ['#forward','.chapters [data-view="C"]'])assert.ok(await p.locator(selector).isDisabled());
 await p.evaluate(()=>{document.querySelector('#forward').click();document.querySelector('.chapters [data-view="C"]').click();});
 await p.keyboard.down('ArrowDown');
 for(let i=0;i<3;i++)await p.mouse.wheel(0,120);
 await p.waitForFunction(()=>study.runtime.mural.snapshot().phase==='mural-brighten',null,{timeout:90000});
 // Carry an inertial train past completion and beyond the fixed cooldown.
 await p.evaluate(()=>{window.inertia=[];const end=performance.now()+2100;window.inertiaTimer=setInterval(()=>{
  inertia.push({view:study.view,busy:study.busy});document.body.dispatchEvent(new WheelEvent('wheel',{deltaY:90,bubbles:true}));
  if(performance.now()>=end)clearInterval(inertiaTimer);
 },70);});
 await idle(p);await p.keyboard.down('ArrowDown');await p.keyboard.up('ArrowDown');
 await p.waitForTimeout(2300);
 const state=await p.evaluate(()=>({view:study.view,state:study.runtime.state,arrivals:study.runtime.mural.snapshot().runs.filter(r=>r.field==='turn').length,inertiaDuring:inertia.some(r=>r.busy),inertiaAfter:inertia.some(r=>!r.busy)}));
 assert.deepEqual(state,{view:'B',state:'mural-look',arrivals:1,inertiaDuring:true,inertiaAfter:true});
 await p.keyboard.press('ArrowUp');await idle(p);assert.equal(await p.evaluate(()=>study.runtime.state),'corridor-2_5d');
 await click(p,'#back');assert.equal(await p.evaluate(()=>study.runtime.state),'corridor-hybrid');
 await click(p,'#forward');assert.equal(await p.evaluate(()=>study.runtime.state),'corridor-2_5d');
 await click(p,'#forward');assert.equal(await p.evaluate(()=>study.view),'C');
 return state;
}
async function controls(p,index){
 await click(p,'#detail-open');assert.equal(await p.evaluate(()=>study.detail.zoom),index>=2?1.15:1);
 assert.equal(await p.locator('#detail-continue-tour').isVisible(),true);
 const observations=await p.evaluate(()=>study.observations);
 assert.equal(observations.length,[3,3,0,0,3][index]);
 for(const region of observations){
  const button=p.locator(`[data-observation="${region.id}"]`);
  await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('#observation-title').textContent(),region.title);
  assert.equal(await p.locator('#observation-copy').textContent(),region.copy);
  assert.doesNotMatch(await p.locator('.observation-note').textContent(),/第\s*\d+\s*页|发现报告|郑富天|李济民|刘灿姣/);
  const visible=await p.locator('#mini-window').evaluate(r=>Object.fromEntries(['x','y','width','height'].map(k=>[k,+r.getAttribute(k)])));
  const [x,y]=region.center.map((value,axis)=>value*sizes[index][axis]);
  assert.ok(x>=visible.x&&x<=visible.x+visible.width&&y>=visible.y&&y<=visible.y+visible.height,region.id);
  if((index===1||index===4)&&p.viewportSize().width===1440&&await p.getAttribute('body','data-reduced-motion')==='false'){await p.waitForTimeout(700);await snap(p,region.id);}
 }
 if(observations.length){
  await click(p,'#whole-image');assert.equal(await p.locator('#observation-number').textContent(),'整铺简介');
 }
 await click(p,'#zoom-in');await p.locator('#detail-viewport').focus();await p.keyboard.press('+');
 const vp=await p.locator('#detail-viewport').boundingBox();await p.mouse.move(vp.x+vp.width/2,vp.y+vp.height/2);const before=await p.evaluate(()=>study.detail.zoom);await p.mouse.wheel(0,-120);await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>study.detail.zoom)>before);
 await p.mouse.down();await p.mouse.move(vp.x+vp.width/2+70,vp.y+vp.height/2+35,{steps:4});await p.mouse.up();const drag=await p.evaluate(()=>study.detail);assert.ok(Math.abs(drag.x)>0||Math.abs(drag.y)>0);await p.keyboard.press('ArrowRight');const moved=await p.evaluate(()=>study.detail);assert.notEqual(moved.x,drag.x);
 const map=await p.locator('#minimap').boundingBox();assert.ok(Math.abs(map.width/map.height-sizes[index][0]/sizes[index][1])<.02,'minimap ratio');await p.mouse.click(map.x+map.width*.7,map.y+map.height*.3);
 const q=await p.locator('#mini-window').evaluate(r=>Object.fromEntries(['x','y','width','height'].map(k=>[k,+r.getAttribute(k)])));assert.ok(q.x>=0&&q.y>=0&&q.x+q.width<=sizes[index][0]+.01&&q.y+q.height<=sizes[index][1]+.01);
 if(index===2&&p.viewportSize().width===1440)await snap(p,'detail-third');await click(p,'#reset');assert.deepEqual(await p.evaluate(()=>study.detail),{zoom:1,x:0,y:0});assert.equal(await p.locator('#minimap svg').getAttribute('viewBox'),`0 0 ${sizes[index].join(' ')}`);await p.locator('#detail-viewport').focus();await p.keyboard.press('+');await p.keyboard.press('0');assert.equal(await p.evaluate(()=>study.detail.zoom),1);await click(p,'#detail-return');return{drag,moved,minimap:q,observations:observations.map(r=>r.id)};
}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={routeCase:layout,runs:[],pass:false};try{
 const configs=process.env.V35_ONE?[[1440,900,false]]:[[1440,900,false],[1920,1080,false],[1366,768,false],[1440,900,true],[1920,1080,true],[1366,768,true]];
 for(const[width,height,reduced]of configs){const keep=width===1440&&!reduced,c=await b.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference',...(keep?{recordVideo:{dir:path.join(local,'video'),size:{width,height}}}:{})}),p=await c.newPage(),errors=[],failed=[],run={width,height,reduced,murals:[],reverse:[],errors,failed};
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});p.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 await p.goto(url);await idle(p);await p.evaluate(()=>{window.perf35={frames:[],long:[],last:performance.now()};new PerformanceObserver(list=>perf35.long.push(...list.getEntries().map(e=>({start:e.startTime,duration:e.duration})))).observe({type:'longtask',buffered:true});function tick(now){if(study.busy)perf35.frames.push(now-perf35.last);perf35.last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 await observeWallMotion(p);run.wallMotion=[];
 run.recordStart=Date.now();run.guided=await guidedTour(p,keep);assert.equal(await p.evaluate(()=>study.view),'C');
 for(let index=0;index<5;index++){
  if(index===1)await observeFirstWallHandoff(p);
  if(index){if(index===4)await click(p,'#detail-open');await p.locator(index===4?'#detail-continue-tour':'#continue-tour').click();if(index===1&&!reduced){run.second=[];for(const[phase,t]of[['dark',0],['title',.3],['revealing',.55]]){await p.waitForFunction(t=>study.activeMural===1&&study.route32.progress===1&&study.route32.reveal>=t,t,{timeout:60000});if(phase==='title')assert.equal(await p.locator('#second-wall-label').evaluate(e=>!e.hidden&&getComputedStyle(e).visibility==='visible'&&+getComputedStyle(e).opacity>.1),true);run.second.push(await p.evaluate(phase=>{let s=study.runtime.model.root;while(s.parent)s=s.parent;const mesh=s.getObjectByName('V32-real-second-mural-candidate');return{phase,activeMural:study.activeMural,reveal:study.route32.reveal,texture:mesh.material.map.image.src,model:study.runtime.state,composite:study.runtime.model.mural.state(),image:document.querySelector('#reading-image').currentSrc};},phase));if(keep)await snap(p,'after-second-'+phase);}}
   if(index>=2&&!reduced){await p.waitForFunction(i=>study.activeMural===i&&study.rear.state.progress===1&&(study.rear.state.reveals[i]??0)>=.3,index,{timeout:60000});assert.equal(await p.locator('#rear-wall-label').evaluate(e=>!e.hidden&&getComputedStyle(e).visibility==='visible'&&+getComputedStyle(e).opacity>.1),true);}
   await idle(p);run.wallMotion.push(await assertWallMotion(p));assert.equal(await p.evaluate(()=>study.activeMural),index);if(keep)await snap(p,'after-wall-'+index);await click(p,'#forward');
  }
  if(index===1)assert.deepEqual(await p.evaluate(()=>firstWallHandoffs),[{readingHidden:true,spaceVisible:true}]);
  if(index>=2){const expectedX=(index===2?2.25:index===3?-2.25:-4.515);assert.equal(await p.evaluate(i=>study.rear.state.bindings.find(b=>b.index===i).position[0],index),expectedX);}
  const im=await imageState(p);assert.deepEqual(im.natural,sizes[index]);assert.equal(im.fit,'contain');if(index===2||index===3)assert.ok(im.src.endsWith('/mural-0'+(index+1)+'-dng-warm.webp'));assert.ok(im.x>=0&&im.y>=0&&im.x+im.width<=width+.1&&im.y+im.height<=height+.1);if(keep)await snap(p,'after-reading-'+index);
  const detail=await controls(p,index);run.murals.push({index,image:im,detail});await click(p,'#wall-return');assert.equal(await p.evaluate(()=>study.view),'B');await click(p,'#forward');
 }
 if(keep)await snap(p,'after-fifth-handoff');run.recordEnd=Date.now();
 for(let index=3;index>=0;index--){await click(p,'#wall-return');await click(p,'#back');run.wallMotion.push(await assertWallMotion(p));assert.equal(await p.evaluate(()=>study.activeMural),index);run.reverse.push({index,pose:await p.evaluate(()=>study.runtime.model.pose)});await click(p,'#forward');assert.deepEqual((await imageState(p)).natural,sizes[index]);}
 // Diagnostics checked separately after the real round trip.
 await p.evaluate(()=>study.seekRoute(1,{reveal:.25}));assert.equal(await p.evaluate(()=>study.runtime.state),'corridor-2_5d');assert.match(await p.evaluate(()=>study.route32.wall?document.querySelector('#reading-image').currentSrc:''),/mural-02-display.webp/);run.diagnostic='second material + original reading compositor exited';if(keep)await snap(p,'after-debug-second');
 run.collisions=await p.evaluate(()=>study.rear.validate());assert.deepEqual(run.collisions,[]);run.performance=await p.evaluate(()=>{const f=perf35.frames.sort((a,b)=>a-b);return{samples:f.length,p50:f[Math.floor(f.length*.5)],p95:f[Math.floor(f.length*.95)],max:f.at(-1),over50:f.filter(x=>x>50).length,longTasks:perf35.long,heap:performance.memory?.usedJSHeapSize,userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,preparation:study.preparation,stats:study.runtime.model.stats()};});
 if(keep){await p.mouse.move(width/2,height/2);run.inputStress=await stressTour(p);}
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);const video=keep?p.video():null;await c.close();if(video)run.video=await video.path();report.runs.push(run);fs.writeFileSync(path.join(out,reportName),JSON.stringify(report,null,2));console.log('V3.5 passed',width,height,reduced);
 }report.pass=true;
 }finally{fs.writeFileSync(path.join(out,reportName),JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
