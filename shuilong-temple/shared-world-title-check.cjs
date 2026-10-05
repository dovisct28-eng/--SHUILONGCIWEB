// Render comparison: title clearance must improve the actual right-hand glyphs.
const {chromium}=require('playwright'),{PNG}=require('pngjs'),fs=require('node:fs'),assert=require('node:assert/strict');
const {ready,seek}=require('../module-a/a02/capture.cjs');
(async()=>{
  const b=await chromium.launch({channel:'chrome',headless:true}),rows=[];
  try{for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
    const p=await b.newPage({viewport:{width,height}});await p.goto('http://127.0.0.1:4173/module-a/a01/');await ready(p);await seek(p,12.15);
    const state=await p.evaluate(()=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple,r=document.querySelector('.a03-title__out').getBoundingClientRect();return {rects:api.getA01EnvironmentState().titleRects,box:{left:r.left,top:r.top,right:r.right,bottom:r.bottom}};});
    const clear=PNG.sync.read(await p.screenshot());
    await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.setPosterTitleRects([]));await p.waitForTimeout(100);
    const crowded=PNG.sync.read(await p.screenshot());
    await p.locator('.model-shell').evaluate(e=>e.style.visibility='hidden');
    const text=PNG.sync.read(await p.screenshot());await p.locator('.a03-poster').evaluate(e=>e.style.opacity='0');const background=PNG.sync.read(await p.screenshot());
    let glyphs=0,affected=0,clearDistance=0,crowdedDistance=0;
    for(let y=Math.max(0,Math.ceil(state.box.top));y<Math.min(height,state.box.bottom);y++)for(let x=Math.max(0,Math.ceil(state.box.left));x<Math.min(width,state.box.right);x++){
      const i=(y*width+x)*4,d=(a,z)=>Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-z.data[i+c])));
      if(d(text,background)<64)continue;glyphs++;const delta=d(clear,crowded);if(delta>4){affected++;clearDistance+=d(clear,text);crowdedDistance+=d(crowded,text);}
    }
    assert.ok(affected>200,'clearance failed to follow right-hand glyphs');assert.ok(clearDistance<crowdedDistance*.5,'trees still pollute the cleaned glyphs');
    rows.push({width,height,glyphs,affected,meanClearDistance:clearDistance/affected,meanWithoutClearanceDistance:crowdedDistance/affected});console.log('PASS title clearance',width,height,rows.at(-1));await p.close();
  }fs.writeFileSync('docs/validation/shared-temple-world-2026-10-04/title-clearance.json',JSON.stringify(rows,null,2));}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
