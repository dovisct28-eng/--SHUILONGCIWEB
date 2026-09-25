const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output=path.resolve(__dirname,'../../docs/validation/guide-transitions');
fs.mkdirSync(output,{recursive:true});
const scroll=async(page,s)=>{await page.evaluate(v=>scrollTo(0,v*innerHeight),s);await page.waitForTimeout(180);};
const snapshot=page=>page.evaluate(()=>({
  sections:[...document.querySelectorAll('.mural-guide')].map(g=>({chapter:g.dataset.chapter,hidden:g.hidden,opacity:Number(getComputedStyle(g).opacity),scan:Number(g.dataset.scanProgress),offset:Number(g.dataset.offsetPx),status:g.querySelector('.mural-guide__status').textContent,loaded:g.querySelector('img').naturalWidth>0})),
  materials:Object.fromEntries(['01','02','03','04','05'].map(n=>{const id=`mural-${n}`;return[id,document.querySelector('iframe').contentWindow.shuilongTemple.getMuralMaterialState(id).map(m=>m.opacity)];})),
  overflow:document.documentElement.scrollWidth>innerWidth,
  modelOpacity:Number(getComputedStyle(document.querySelector('.model-shell')).opacity),
}));

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true}),report={};
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}}),requests=[];
    page.on('request',r=>{if(/mural-(01|02|05)-display\.webp|detail\.webp/.test(r.url()))requests.push(r.url())});
    await page.goto('http://127.0.0.1:4175/module-a/a01/');
    await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
    await scroll(page,15);
    const before=(await snapshot(page)).materials;
    await scroll(page,36.8);
    await page.waitForFunction(()=>document.querySelectorAll('.mural-guide')[2]?.querySelector('img').naturalWidth>0);
    let snap=await snapshot(page);
    assert.deepEqual(snap.sections.map(s=>s.hidden),[true,true,false]);
    assert.ok(snap.modelOpacity<.001);
    assert.ok(Object.values(snap.materials).flat().every(v=>v===1),'rapid skip leaves all mural materials restored');
    const offset=snap.sections[2].offset,progress=snap.sections[2].scan;
    await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(250);
    snap=await snapshot(page);
    assert.deepEqual(snap.sections.map(s=>s.hidden),[true,true,false]);
    assert.ok(Math.abs(snap.sections[2].scan-progress)<.005,`resize keeps story progress: ${progress} -> ${snap.sections[2].scan}`);
    assert.notEqual(snap.sections[2].offset,offset,'resize recalculates horizontal offset');
    await scroll(page,22.3);snap=await snapshot(page);assert.deepEqual(snap.sections.map(s=>s.hidden),[false,true,true]);
    assert.ok(Object.values(snap.materials).flat().every(v=>v===1));
    await scroll(page,17.8);snap=await snapshot(page);assert.ok(snap.materials['mural-05'].some((v,i)=>v<before['mural-05'][i]));
    await scroll(page,36.8);snap=await snapshot(page);assert.ok(Object.values(snap.materials).flat().every(v=>v===1));
    report.rapidReverseResize=true;
    report.requests=Object.fromEntries(['01','02','05'].map(id=>[id,requests.filter(u=>u.includes(`mural-${id}-display.webp`)).length]));
    report.detailRequests=requests.filter(u=>u.includes('detail.webp')).length;
    assert.equal(report.detailRequests,0);
    await page.close();

    const reduced=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4175/module-a/a01/');
    await reduced.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
    await scroll(reduced,27.2);await reduced.waitForFunction(()=>document.querySelectorAll('.mural-guide')[1]?.querySelector('img').naturalWidth>0);
    const firstRight=(await snapshot(reduced)).sections[1];
    await scroll(reduced,31.4);const firstLeft=(await snapshot(reduced)).sections[1];
    assert.ok(firstRight.scan<.001&&firstLeft.scan>.999&&firstLeft.offset>firstRight.offset);
    await scroll(reduced,34.2);await reduced.waitForFunction(()=>document.querySelectorAll('.mural-guide')[2]?.querySelector('img').naturalWidth>0);
    const right=(await snapshot(reduced)).sections[2];
    await scroll(reduced,39.4);const left=(await snapshot(reduced)).sections[2];
    assert.ok(right.scan<.001);assert.ok(left.scan>.999);assert.ok(left.offset>right.offset);
    report.reducedMotion=true;await reduced.close();

    for(const [id,point,index] of [['01',25.85,1],['02',32.85,2]]){
      const failed=await browser.newPage();
      await failed.route(`**/mural-${id}-display.webp`,route=>route.request().frame()===failed.mainFrame()?route.abort():route.continue());
      await failed.goto('http://127.0.0.1:4175/module-a/a01/');
      await failed.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
      await scroll(failed,point);
      await failed.waitForFunction(i=>document.querySelectorAll('.mural-guide')[i]?.querySelector('.mural-guide__status').textContent.includes('无法加载'),index);
      const s=await snapshot(failed);assert.equal(s.sections[index].loaded,false);assert.ok(s.sections[index].status.includes('无法加载'));
      report[`failure${id}`]=true;await failed.close();
    }
    for(const [id,point,index] of [['01',25.85,1],['02',32.85,2]]){
      const failed=await browser.newPage();
      await failed.route(`**/mural-${id}-display.webp`,route=>route.request().frame()!==failed.mainFrame()?route.abort():route.continue());
      await failed.goto('http://127.0.0.1:4175/module-a/a01/');
      await failed.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
      await scroll(failed,14);
      await failed.evaluate(muralId=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;api.setA04({...api.getA04State(),target:`mural-${muralId}`});},id);
      await failed.waitForFunction(muralId=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState(`mural-${muralId}`).requested,id);
      await scroll(failed,point);
      await failed.waitForFunction(i=>document.querySelectorAll('.mural-guide')[i]?.querySelector('img').naturalWidth>0,index);
      assert.equal((await snapshot(failed)).sections[index].loaded,true);
      report[`modelFailure${id}GuideWorks`]=true;await failed.close();
    }
    for(const [id,point,index] of [['01',25.85,1],['02',32.85,2]]){
      const cached=await browser.newPage();
      await cached.goto('http://127.0.0.1:4175/module-a/a01/');
      await cached.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
      await scroll(cached,14);
      await cached.evaluate(muralId=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;api.setA04({...api.getA04State(),target:`mural-${muralId}`});},id);
      await cached.waitForFunction(muralId=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState(`mural-${muralId}`).loaded,id);
      await scroll(cached,point);
      await cached.waitForFunction(i=>document.querySelectorAll('.mural-guide')[i]?.querySelector('img').naturalWidth>0,index);
      const cache=await cached.evaluate(i=>{const frame=document.querySelector('iframe'),url=document.querySelectorAll('.mural-guide')[i].querySelector('img').currentSrc,entries=[...performance.getEntriesByName(url),...frame.contentWindow.performance.getEntriesByName(url)];return {contexts:entries.length,transferBytes:entries.reduce((sum,e)=>sum+e.transferSize,0)}},index);
      const bytes=fs.statSync(path.resolve(__dirname,`../../水龙祠壁画素材/网页展示图/mural-${id}-display.webp`)).size;
      assert.equal(cache.contexts,2);
      assert.ok(cache.transferBytes>=bytes&&cache.transferBytes<=bytes+2048,`mural-${id} shared cache: ${JSON.stringify(cache)}`);
      report[`cache${id}`]=cache;await cached.close();
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
    console.log('multi-guide checks passed',report);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
