const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve(__dirname,'../../../docs/validation/immersive-hybrid-v2-4/local');
fs.mkdirSync(out,{recursive:true});
// Candidate camera positions only. Segment ray tests do not prove body clearance.
const poses=[
 {id:'m01-return',position:[3.85,1.38,7.65],target:[4.05,1.38,2.4],fov:48},
 {id:'east-mid',position:[3.85,1.38,0],target:[3.85,1.38,-7.3],fov:48},
 {id:'hall-approach',position:[3.85,1.38,-6.5],target:[2.5,1.38,-9],fov:48},
 {id:'hall-front',position:[2.5,1.38,-7.5],target:[2.5,1.6,-11],fov:48},
 {id:'hall-inside',position:[2.5,1.38,-9.5],target:[4.515,1.85,-11.75],fov:48},
 {id:'m02-dock',position:[1.4,1.85,-11.75],target:[4.515,1.85,-11.75],fov:48},
 {id:'rear-right',position:[1.4,1.85,-12],target:[2.25,1.85,-14.865],fov:48},
 {id:'rear-left',position:[-1.4,1.85,-12],target:[-2.25,1.85,-14.865],fov:48},
 {id:'m05-dock',position:[-1.4,1.85,-11.75],target:[-4.515,1.85,-11.75],fov:48},
];
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4186/module-a/immersive-hybrid-v1/');
 await page.waitForFunction(()=>window.hybrid?.ready,{timeout:60000});
 const result=await page.evaluate(poses=>{
  const r=hybrid.model,offsets=[[0,0,0],[.065,0,0],[-.065,0,0],[0,.065,0],[0,-.065,0]];
  return poses.slice(1).map((p,i)=>{const a=poses[i].position,b=p.position;
   const hits=offsets.flatMap(d=>{const x=a.map((v,j)=>v+d[j]),y=b.map((v,j)=>v+d[j]);
    return [...r.intersections(x,y),...r.intersections(y,x)].map(h=>({...h,offset:d}));});
   return {from:poses[i].id,to:p.id,hits};});
 },poses);
 for(const pose of poses){await page.evaluate(p=>hybrid.model.setCamera({...p,time:2}),pose);await page.waitForTimeout(200);await page.screenshot({path:path.join(out,pose.id+'.png')});}
 fs.writeFileSync(path.join(out,'route-probe.json'),JSON.stringify({poses,segments:result,limitation:'Five bidirectional rays per straight segment; no continuous swept-volume, eye visibility, floor and step clearance, or interpolation validation.'},null,2));
 console.log(JSON.stringify(result));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
