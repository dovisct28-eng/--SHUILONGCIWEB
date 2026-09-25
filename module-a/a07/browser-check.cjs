const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const output = path.resolve(__dirname,'../../docs/validation/a04-final/a07-regression');
fs.mkdirSync(output,{recursive:true});
const scroll=async(page,screens)=>{await page.evaluate(v=>scrollTo(0,v*innerHeight),screens);await page.waitForTimeout(160);};
const state=page=>page.evaluate(()=>[...document.querySelectorAll('.mural-guide')].map(g=>{const image=g.querySelector('img'),r=image.getBoundingClientRect();return {chapter:g.dataset.chapter,hidden:g.hidden,opacity:Number(getComputedStyle(g).opacity),scan:Number(g.dataset.scanProgress),travel:Number(g.dataset.travelPx),offset:Number(g.dataset.offsetPx),left:r.left,right:r.right,width:r.width,loaded:image.naturalWidth>0,status:g.querySelector('.mural-guide__status').textContent};}));

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
  try{
    for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
      const page=await browser.newPage({viewport:{width,height}}),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4175/module-a/a01/');
      await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
      for(const [name,point] of [['a06-left',31.4],['transition',32.2],['intro',32.85],['right',34.2],['center',36.8],['left',39.4],['end',40]]){
        await scroll(page,point);await page.waitForFunction(()=>document.querySelectorAll('.mural-guide')[2]?.querySelector('img').naturalWidth>0);
        const [a05,a06,a07]=await state(page);
        if(name==='transition'){assert.equal(a05.hidden,true);assert.equal(a06.hidden,false);assert.equal(a07.hidden,false);assert.ok(a06.opacity>0&&a07.opacity>0);}
        if(name==='right'){assert.ok(Math.abs(a07.right-width)<2);assert.ok(a07.travel>0);}
        if(name==='center')assert.ok(Math.abs(a07.offset+a07.travel/2)<2);
        if(name==='left'||name==='end'){assert.ok(Math.abs(a07.left)<2);assert.equal(a06.hidden,true);}
        if(width===1440||name==='intro')await page.screenshot({path:path.join(output,`${name}-${width}x${height}.png`)});
      }
      await scroll(page,36.8);const center=(await state(page))[2];
      await scroll(page,31.4);assert.equal((await state(page))[1].hidden,false);
      await scroll(page,24.4);assert.equal((await state(page))[0].hidden,false);
      await scroll(page,36.8);assert.ok(Math.abs((await state(page))[2].offset-center.offset)<2);
      await page.reload();await page.waitForFunction(()=>document.querySelectorAll('.mural-guide')[2]?.querySelector('img').naturalWidth>0);
      assert.ok(Math.abs((await state(page))[2].offset-center.offset)<2);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(errors,[]);
      report.push({viewport:`${width}x${height}`,reverse:true,refresh:true});
      await page.close();
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2));
    console.log('A07 browser checks passed',report);
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
