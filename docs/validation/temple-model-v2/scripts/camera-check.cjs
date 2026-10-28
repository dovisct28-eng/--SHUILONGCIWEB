// Current candidate geometry, real ray/triangle intersections, same method as phase 1.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out=path.resolve(__dirname,'..'),url='http://127.0.0.1:4186/docs/validation/temple-model-v2/model-comparison.html';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={pass:false,method:'400 route segments; centre plus axis offsets ±.065; both directions. Eye envelope, not pedestrian/site measurements.',variants:[],errors:[]};try{const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));await page.goto(url);await page.waitForFunction(()=>window.previewReady,null,{timeout:60000});
for(const id of Object.keys(await page.evaluate(()=>preview.manifest.models))){await page.evaluate(id=>preview.setVariant(id),id);const check=await page.evaluate(()=>{
 const offsets=[[0,0,0],...[.065].flatMap(d=>[[d,0,0],[-d,0,0],[0,d,0],[0,-d,0],[0,0,d],[0,0,-d]])],collisions=[];let rays=0;
 const poses=Array.from({length:401},(_,i)=>preview.sampleRoute(i/400));for(let i=1;i<poses.length;i++)for(const offset of offsets){const a=poses[i-1].position.map((v,j)=>v+offset[j]),b=poses[i].position.map((v,j)=>v+offset[j]);for(const [from,to]of [[a,b],[b,a]]){rays++;const hits=preview.intersections(from,to);if(hits.length&&collisions.length<30)collisions.push({segment:i,time:i/400,from,to,offset,hits});}}
 preview.setView('mural-front',{recenter:true});const corners=preview.projectMural(),front=preview.stats().pose;
 // Corners touch the coplanar backing at their very end; exclude the last .06.
 const sightlines=[[4.865,1.55,4.8],[4.865,2.1,3.05],[4.865,2.1,6.55],[4.865,1,3.05],[4.865,1,6.55]].map(point=>{const end=point.map((v,i)=>v+(front.position[i]-v)*.06/Math.hypot(...point.map((v,i)=>v-front.position[i])));return {point,hits:preview.intersections(front.position,end)};});
 const feet=preview.intersections(front.position,[front.position[0],0,front.position[2]]);
 // Preliminary extension along the wall side of hall's front right column.
 const x=preview.manifest.models[preview.stats().id].structure.corridor.cameraCentreX;
 const next=[[x,1.55,4.8],[x,1.55,-7.8],[4.05,1.68,-8.7],[3.7,1.68,-11.75]];
 const extension=next.slice(1).map((p,i)=>({from:next[i],to:p,hits:[...preview.intersections(next[i],p),...preview.intersections(p,next[i])]}));
 return {id:preview.stats().id,rays,collisions,front,corners,sightlines,floor:feet.slice(0,1),extension,keys:preview.routeKeys(),removedDoorTriangles:preview.stats().removedDoorTriangles};
});report.variants.push(check);console.log(id+': '+check.collisions.length+' route hits; sightlines '+check.sightlines.reduce((n,s)=>n+s.hits.length,0)+'; extension '+check.extension.reduce((n,s)=>n+s.hits.length,0));}
assert.deepEqual(report.errors,[]);assert.ok(report.variants.every(v=>v.collisions.length===0),'Camera collision: see candidate/components/coordinates in camera-results.json');assert.ok(report.variants.every(v=>v.sightlines.every(s=>s.hits.length===0)));report.pass=true;
}finally{fs.writeFileSync(path.join(out,'camera-results.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
