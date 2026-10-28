const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.resolve(__dirname,'..'),url='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v24.html';
const save=(name,x)=>fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(x,null,2)+'\n');
const shot=async(p,name,selected=false)=>sharp(await p.screenshot()).webp({quality:88}).toFile(path.join(out,selected?'selected':'local',name+'.webp'));
async function ready(p){await p.goto(url);await p.waitForFunction(()=>window.v24a?.ready&&hybrid.model.mural.status==='ready'&&document.querySelector('.v24a-loading').hidden,null,{timeout:90000});}
async function action(p,selector,state,events){const at=Date.now();await p.locator(selector).click();await p.waitForFunction(s=>hybrid.state===s&&!hybrid.busy,state,{timeout:40000});events?.push({selector,state,elapsedMs:Date.now()-at});}
async function collision(p){return p.evaluate(async()=>{
 const T=await import('./vendor/three.module.js'),{sampleMuralFront}=await import('./src/mural-front.mjs'),{sampleMuralTurn}=await import('./src/mural-transition-controller.mjs'),r=hybrid.model;
 const triangles=[],box=new T.Box3(),bounds=new T.Box3(new T.Vector3(-.3,1.15,4.5),new T.Vector3(4.3,1.8,13.2));r.root.updateMatrixWorld(true);
 r.root.traverse(m=>{if(!m.isMesh||m.parent.name.startsWith('mural-'))return;const g=m.geometry,pos=g.attributes.position,idx=g.index;for(let i=0;i<(idx?.count??pos.count);i+=3){const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(m.matrixWorld));box.setFromPoints(points);if(box.intersectsBox(bounds))triangles.push({tri:new T.Triangle(...points),group:m.parent.name});}});
 const poses=[...Array.from({length:601},(_,i)=>hybrid.sample(.85+1.15*i/600)),...Array.from({length:61},(_,i)=>sampleMuralTurn(i/60)),...Array.from({length:241},(_,i)=>sampleMuralFront(i/240))];
 let min=Infinity;const closest=new T.Vector3(),contacts=[],rayHits=[];
 for(const [i,p]of poses.entries()){const eye=new T.Vector3(...p.position);for(const {tri,group}of triangles){tri.closestPointToPoint(eye,closest);const d=closest.distanceTo(eye);min=Math.min(min,d);if(d<.12)contacts.push({i,d,group,eye:p.position});}if(i)rayHits.push(...r.intersections(poses[i-1].position,p.position),...r.intersections(p.position,poses[i-1].position));}
 // Five independent sightlines to the mural centre/inset corners at the dock.
 const anchor=[4.865,1.55,4.8],eye=sampleMuralFront(1).position;const sightlines=[[0,0],[-.55,-1.6],[-.55,1.6],[.55,1.6],[.55,-1.6]].map(([dy,dz])=>r.intersections(eye,[anchor[0]-.03,anchor[1]+dy,anchor[2]+dz]));
 return {samples:poses.length,radius:.12,nearTriangles:triangles.length,minSurfaceDistance:min,contacts,segmentHits:rayHits.length,sightlines,scope:'Real-camera route .85..2, discovery and front; double-sided envelope proximity and bidirectional segment rays. Virtual reading camera is a projection, not a walk.'};
 });}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={pass:false,browser:b.version(),viewports:[],errors:[],requests:[]},cameras=[];try{
 for(const [width,height]of [[1440,900],[1920,1080],[1366,768]]){
 const first=width===1440,ctx=await b.newContext({viewport:{width,height},reducedMotion:'no-preference',...(first?{recordVideo:{dir:path.join(out,'local'),size:{width,height}}}:{})}),p=await ctx.newPage(),events=[],requests=[];p.on('pageerror',e=>report.errors.push(e.message));p.on('request',r=>requests.push(r.url()));const began=Date.now();await ready(p);const loadMs=Date.now()-began;
 await p.evaluate(()=>{window.__trace=[];let last;function tick(at){const s=hybrid.mural.snapshot();if(hybrid.busy||s.phase!==last)__trace.push({at,phase:s.phase,front:s.front,reading:s.reading,pose:hybrid.model.pose,corners:s.composite.readingCorners,ui:s.composite.phases.ui});last=s.phase;window.__traceRAF=requestAnimationFrame(tick);}tick(performance.now());});
 let discovery,corridor;const resourceCounts=[];
 for(const state of ['approach','gate-close','threshold','gate-interior','stage-turn','corridor-3d','corridor-hybrid','corridor-2_5d','mural-look']){
 await action(p,'#next',state,events);if(first&&['gate-interior','stage-turn','corridor-3d','corridor-hybrid','mural-look'].includes(state)){const h=await p.evaluate(()=>hybrid.model.handoff());cameras.push({id:state,...h});}
 const names={'gate-interior':'05-gate-interior','stage-turn':'06-stage-turn','corridor-3d':'07-new-corridor','mural-look':'08-mural-discovery'};await shot(p,state+'-'+width);if(first&&names[state])await shot(p,names[state],true);
 if(state==='corridor-2_5d')corridor=await p.evaluate(()=>hybrid.model.pose);if(state==='mural-look')discovery=await p.evaluate(()=>hybrid.model.pose);
 }
 const forward=p.locator('#next').click();await forward;await p.waitForFunction(()=>hybrid.mural.snapshot().phase==='mural-front',null,{timeout:10000});const dock=await p.evaluate(()=>({snapshot:hybrid.mural.snapshot(),handoff:hybrid.model.handoff()}));await shot(p,'front-'+width);if(first){cameras.push({id:'mural-front',...dock.handoff});}
 await p.waitForFunction(()=>hybrid.state==='mural-reading'&&!hybrid.busy);const reading=await p.evaluate(()=>hybrid.mural.snapshot());await shot(p,'reading-'+width);if(first)await shot(p,'10-mural-reading',true);
 assert.ok(Math.abs(dock.handoff.camera.position[0]-2.807)<1e-10);assert.equal(dock.snapshot.reading,0);assert.equal(dock.snapshot.composite.phases.ui,0);
 const q=reading.composite.readingCorners;assert.ok(q.every(v=>v.x>0&&v.x<1&&v.y>0&&v.y<1));const ratio=(q[1].x-q[0].x)*width/((q[3].y-q[0].y)*height);assert.ok(Math.abs(ratio-2880/990)<.001);assert.ok(q[1].x>q[0].x&&q[3].y>q[0].y);
 await p.mouse.wheel(0,180);await p.waitForTimeout(350);assert.equal(await p.evaluate(()=>hybrid.state),'mural-reading');await p.locator('#mural-detail-open').click();await p.locator('#mural-detail').waitFor({state:'visible'});await p.locator('[data-zoom="0.25"]').click();assert.equal(await p.locator('[data-zoom-value]').textContent(),'125%');const box=await p.locator('.detail-image').boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+65,box.y+box.height/2+30,{steps:12});await p.mouse.up();const transform=await p.locator('#mural-detail img').evaluate(e=>e.style.transform);assert.ok(!transform.includes('translate(0px, 0px)'));await shot(p,'detail-'+width);await p.locator('[data-zoom="0"]').click();assert.equal(await p.locator('[data-zoom-value]').textContent(),'100%');await p.locator('[data-close]').click();
 await action(p,'#mural-return-wall','mural-look',events);assert.deepEqual(await p.evaluate(()=>hybrid.model.pose),discovery);await action(p,'#previous','corridor-2_5d',events);assert.deepEqual(await p.evaluate(()=>hybrid.model.pose),corridor);if(first)await shot(p,'11-return',true);
 for(const state of ['corridor-hybrid','corridor-3d','stage-turn','gate-interior','threshold','gate-close','approach','overview'])await action(p,'#previous',state,events);
 const trace=await p.evaluate(()=>{cancelAnimationFrame(__traceRAF);return __trace;});const held=trace.filter(x=>x.phase==='mural-front'&&x.front===1);assert.ok(held.length>0);assert.ok(held.every(x=>x.reading===0));const f=trace.findIndex(x=>x.phase==='mural-front'),r=trace.findIndex(x=>x.phase==='mural-reading-transition');assert.ok(trace[r].at-trace[f].at>=300);
 const video=first?p.video():null;
 // End recording after a full normal-speed forward/reverse interaction.
 const metrics=await p.evaluate(()=>({stats:hybrid.model.stats(),runs:hybrid.mural.snapshot().runs}));
 if(first){save('local/interaction-trace',trace);const c=await collision(p);save('route-verification',c);assert.equal(c.contacts.length,0);assert.equal(c.segmentHits,0);assert.ok(c.sightlines.every(x=>x.length===0));}
 report.viewports.push({width,height,loadMs,events,dock:dock.handoff.camera,reading:{corners:q,ratio},metrics,errors:report.errors.length});report.requests.push({width,glb:requests.filter(x=>x.endsWith('shuilong-temple.glb')).length,oldInterior:requests.filter(x=>/assets\/(v24a|generated)|G0[123]|g0[123]\.webp/.test(x))});assert.equal(report.requests.at(-1).glb,1);assert.deepEqual(report.requests.at(-1).oldInterior,[]);
 await ctx.close();if(video){await video.saveAs(path.join(out,'selected/12-full-interaction.webm'));console.log('Recorded complete normal-speed forward + return');}console.log('PASS viewport',width);
 }
 assert.deepEqual(report.errors,[]);report.pass=true;
 }finally{save('browser-results',report);save('camera-manifest',cameras);await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
