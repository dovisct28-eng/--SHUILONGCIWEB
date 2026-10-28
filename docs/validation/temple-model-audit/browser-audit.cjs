// Read-only smoke of the existing V2.4-A.1 rail and its camera clearance.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const local=path.join(__dirname,'local');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={pass:false,errors:[],states:[],limits:'Design-camera line sweeps only; not human accessibility, site dimensions, or a validated route to mural-02.'};
try{const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
await page.goto('http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v24.html');await page.waitForFunction(()=>window.v24a?.ready&&window.hybrid?.ready&&hybrid.model.mural.status==='ready'&&document.querySelector('.v24a-loading').hidden,null,{timeout:90000});
for(const s of ['overview','approach','gate-close','threshold','gate-interior','stage-turn','corridor-3d','corridor-hybrid','corridor-2_5d','mural-look','mural-reading','mural-look','corridor-2_5d','gate-interior','overview']){const current=await page.evaluate(()=>hybrid.state);if(current!==s)assert.equal(await page.evaluate(s=>hybrid.go(s),s),true,s);const state=await page.evaluate(()=>({state:hybrid.state,busy:hybrid.busy,pose:hybrid.model.pose,projection:v24a.layer.state.layers.map(l=>({name:l.name,gain:l.opacity}))}));assert.equal(state.state,s);assert.equal(state.busy,false);report.states.push(state);await page.screenshot({path:path.join(local,`live-${String(report.states.length).padStart(2,'0')}-${s}.png`)});}
report.clearance=await page.evaluate(async()=>{
 const {sampleGallery}=await import('./src/corridor-path.mjs'),{sampleMuralFront}=await import('./src/mural-front.mjs');
 const r=hybrid.model,offsets=[[0,0,0],...[.065].flatMap(d=>[[d,0,0],[-d,0,0],[0,d,0],[0,-d,0],[0,0,d],[0,0,-d]])];
 function sweep(name,poses){let rays=0;const hits=[];for(let i=1;i<poses.length;i++)for(const offset of offsets){const a=poses[i-1].position.map((x,j)=>x+offset[j]),b=poses[i].position.map((x,j)=>x+offset[j]);for(const [from,to]of [[a,b],[b,a]]){rays++;const h=r.intersections(from,to);if(h.length)hits.push({segment:i,offset,from,to,hits:h});}}return {name,segments:poses.length-1,rays,hits};}
 const rails=[sweep('gate-and-right-corridor',Array.from({length:201},(_,i)=>sampleGallery(i/100))),sweep('first-mural-front',Array.from({length:101},(_,i)=>sampleMuralFront(i/100)))];
 const p=sampleMuralFront(1);r.setCamera(p,{immediate:true});
 const h=r.handoff();
 return {envelopeRadius:.065,unit:'model units',bidirectional:true,rails,front:p,gate:h.gatePlane,root:h.model,doorTrianglesRemoved:h.removedTriangles,frontProjection:v24a.layer.state.layers.map(l=>({name:l.name,gain:l.opacity}))};
});
assert.ok(report.clearance.rails.every(r=>r.hits.length===0),'Current camera envelope must not collide');assert.ok(report.clearance.frontProjection.every(l=>l.gain===0),'AI scene projection must fade out at front dock');assert.deepEqual(report.errors,[]);report.pass=true;console.log('PASS existing V2.4-A.1 forward / reading / reverse, original-camera envelope, front projection fallback');
}finally{fs.writeFileSync(path.join(local,'browser-results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
