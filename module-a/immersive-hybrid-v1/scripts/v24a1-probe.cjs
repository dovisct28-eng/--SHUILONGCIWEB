const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,'../../../docs/validation/immersive-hybrid-v2-4/local/v24a1');fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v24.html';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await page.goto(url);await page.waitForFunction(()=>window.v24a?.ready&&hybrid.model.mural.status==='ready',null,{timeout:90000});
 await page.evaluate(async()=>{await hybrid.go('corridor-2_5d');await hybrid.go('mural-look');});
 const results=await page.evaluate(async()=>{
  const {sampleMuralTurn}=await import('./src/mural-transition-controller.mjs'),{muralCorners}=await import('./src/mural-anchor.mjs');
  const r=hybrid.model,original=sampleMuralTurn(1),center=[4.865,1.55,4.8];
  const candidates=[{id:'original-oblique',...original},...[[3.30,1.55,4.8],[3.40,1.55,4.8],[3.55,1.55,4.8],[3.55,1.55,5.0],[3.65,1.55,4.8],[2.30,1.55,4.8],[2.65,1.55,4.8],[3.0,1.55,4.8]].map((position,i)=>({id:'candidate-'+i,time:2,position,target:center,fov:48}))];
  const offsets=[[0,0,0],...[.065,.12].flatMap(d=>[[d,0,0],[-d,0,0],[0,d,0],[0,-d,0],[0,0,d],[0,0,-d]])];
  return candidates.map(p=>{
   r.setCamera(p,{immediate:true});const c=r.mural.state(),delta=center.map((x,i)=>p.position[i]-x),distance=Math.hypot(...delta),angle=Math.acos(-delta[0]/distance)*180/Math.PI;
   const pathHits=offsets.flatMap(offset=>{const a=original.position.map((x,i)=>x+offset[i]),b=p.position.map((x,i)=>x+offset[i]);return [...r.intersections(a,b),...r.intersections(b,a)].map(h=>({...h,offset}));});
   const occlusion=muralCorners().concat([center]).map(point=>({point,hits:r.intersections(p.position,point)}));
   const nearHits=offsets.slice(1).flatMap(o=>r.intersections(p.position,p.position.map((x,i)=>x+o[i])));
   const floor=r.intersections(p.position,[p.position[0],0,p.position[2]]).slice(0,1);
   return {pose:p,distance,angle,corners:c.corners,pathHits,nearHits,floor,occlusion};
  });
 });
 for(const item of results){await page.evaluate(p=>hybrid.model.setCamera(p,{immediate:true}),item.pose);await page.waitForTimeout(150);await sharp(await page.screenshot()).webp({quality:88}).toFile(path.join(out,item.pose.id+'.webp'));}
 fs.writeFileSync(path.join(out,'camera-probe.json'),JSON.stringify({browser:browser.version(),viewport:[1440,900],basis:'Original running GLB; 13 offset bidirectional line sweeps, local clearance and five mural sightlines. Camera envelope only, not pedestrian/site survey.',results},null,2));
 console.log(JSON.stringify(results.map(x=>({id:x.pose.id,position:x.pose.position,angle:x.angle,pathHits:x.pathHits.length,nearHits:x.nearHits.length,occlusion:x.occlusion.map(x=>x.hits.length),floor:x.floor,corners:x.corners})),null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
