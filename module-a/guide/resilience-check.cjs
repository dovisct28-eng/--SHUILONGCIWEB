const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=path.resolve(__dirname,'../../docs/validation/guide-transitions');
fs.mkdirSync(output,{recursive:true});
const scroll=async(page,s)=>{await page.evaluate(v=>scrollTo(0,v*innerHeight),s);await page.waitForTimeout(160)};
const read=page=>page.evaluate(()=>({screens:scrollY/innerHeight,guides:[...document.querySelectorAll('.mural-guide')].map(g=>({hidden:g.hidden,scan:Number(g.dataset.scanProgress),offset:Number(g.dataset.offsetPx),status:g.querySelector('.mural-guide__status').textContent})),a04Opacity:Number(getComputedStyle(document.querySelector('.a04')).opacity)}));
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),report={refresh:[],resize:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:4175/module-a/a01/');
  for(const [chapter,point,index] of [['A06 intro',25.85,1],['A06 center',29.3,1],['A06 left',31.4,1],['A07 intro',32.85,2],['A07 center',36.8,2],['A07 left',39.4,2]]){
    await scroll(page,point);await page.waitForFunction(i=>document.querySelectorAll('.mural-guide')[i]?.querySelector('img').naturalWidth>0,index);
    const before=await read(page);assert.equal(before.guides[index].hidden,false);
    await page.reload();await page.waitForFunction(i=>document.querySelectorAll('.mural-guide')[i]?.querySelector('img').naturalWidth>0,index);
    const after=await read(page);assert.equal(after.guides[index].hidden,false);
    assert.ok(Math.abs(after.guides[index].scan-before.guides[index].scan)<.005,chapter);
    assert.ok(Math.abs(after.guides[index].offset-before.guides[index].offset)<3,chapter);
    report.refresh.push(chapter);
  }
  for(const point of [25.2,32.2]){
    await scroll(page,point);
    assert.ok((await read(page)).a04Opacity<.001,`A04 copy is absent during ${point} crossfade`);
  }
  for(const [chapter,point,index] of [['A06',29.3,1],['A07',36.8,2]]){
    await page.setViewportSize({width:1440,height:900});await scroll(page,point);
    const before=await read(page);
    await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(250);
    const after=await read(page);assert.equal(after.guides[index].hidden,false);
    assert.ok(Math.abs(after.guides[index].scan-before.guides[index].scan)<.005,chapter);
    assert.notEqual(after.guides[index].offset,before.guides[index].offset);
    await scroll(page,point-.5);assert.ok((await read(page)).guides[index].scan<after.guides[index].scan);
    report.resize.push(chapter);
  }
  fs.writeFileSync(path.join(output,'resilience.json'),JSON.stringify(report,null,2));
  console.log('guide resilience passed',report);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
