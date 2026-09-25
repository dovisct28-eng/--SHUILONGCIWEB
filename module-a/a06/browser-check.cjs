const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const output = path.resolve(__dirname, '../../docs/validation/a06');
fs.mkdirSync(output,{recursive:true});
const scroll = async (page, screens) => {
  await page.evaluate(value => scrollTo(0,value*innerHeight),screens);
  await page.waitForTimeout(150);
};
const state = page => page.evaluate(() => [...document.querySelectorAll('.mural-guide')].map(guide => {
  const image=guide.querySelector('img'),rect=image.getBoundingClientRect();
  return {chapter:guide.dataset.chapter,hidden:guide.hidden,opacity:Number(getComputedStyle(guide).opacity),scan:Number(guide.dataset.scanProgress),left:rect.left,right:rect.right,offset:Number(guide.dataset.offsetPx),travel:Number(guide.dataset.travelPx),loaded:image.naturalWidth>0,src:image.currentSrc};
}));

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const report=[];
  try {
    for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
      const page=await browser.newPage({viewport:{width,height}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4175/module-a/a01/');
      await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
      for(const [name,point] of [['a05-left',24.4],['transition',25.2],['intro',25.85],['right',27.2],['center',29.3],['left',31.4]]){
        await scroll(page,point);
        await page.waitForFunction(()=>document.querySelectorAll('.mural-guide')[1]?.querySelector('img').naturalWidth>0);
        const [a05,a06]=await state(page);
        if(name==='transition'){assert.equal(a05.hidden,false);assert.equal(a06.hidden,false);assert.ok(a05.opacity>0&&a06.opacity>0);}
        if(name==='right'){assert.ok(Math.abs(a06.right-width)<2);assert.ok(a06.travel>0);}
        if(name==='center'){assert.ok(Math.abs(a06.offset+a06.travel/2)<2);}
        if(name==='left'){assert.ok(Math.abs(a06.left)<2);assert.equal(a05.hidden,true);}
        if(width===1440) await page.screenshot({path:path.join(output,`${name}-${width}x${height}.png`)});
      }
      await scroll(page,29.3);const center=(await state(page))[1];
      await scroll(page,24.4);assert.equal((await state(page))[0].hidden,false);
      await scroll(page,29.3);assert.ok(Math.abs((await state(page))[1].offset-center.offset)<2);
      await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.mural-guide')[1]?.querySelector('img').naturalWidth>0);
      assert.ok(Math.abs((await state(page))[1].offset-center.offset)<2);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[]);
      report.push({viewport:`${width}x${height}`,reverse:true,refresh:true});
      await page.close();
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
    console.log('A06 browser checks passed',report);
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
