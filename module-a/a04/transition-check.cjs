const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const output=path.resolve(__dirname,'../../docs/validation/a04-handoff');fs.mkdirSync(output,{recursive:true});

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const errors=[];
  try{
    for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
      const page=await browser.newPage({viewport:{width,height}});
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4173/module-a/a01/');
      await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
      const seek=async n=>{await page.evaluate(n=>scrollTo(0,n*innerHeight),n);await page.waitForTimeout(250)};
      await seek(14.5);await page.getByRole('button',{name:'跳过动画'}).click();
      const samples=[];
      for(const n of [16,16.5,17,17.4,17.6,17.8,17.99,18,18.1,18.8]){
        await seek(n);
        const sample=await page.evaluate(()=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;
          const image=document.querySelector('.mural-guide__image');const rect=image.getBoundingClientRect();
          return {camera:api.getA04State()?.camera,route:api.getA04State()?.routeOpacity,
            projection:api.getMuralProjection('mural-05'),image:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,opacity:Number(getComputedStyle(image).opacity)},
            modelOpacity:Number(getComputedStyle(document.querySelector('.model-shell')).opacity)};});
        assert.ok(sample.projection?.width>0&&sample.projection?.height>0,`${n}: mural projection`);
        samples.push({n,...sample});
        if((width===1440||width===1024)&&[16,17,17.6,17.8,18].includes(n))await page.screenshot({path:path.join(output,`transfer-${n}-${width}x${height}.png`)});
      }
      assert.deepEqual(samples[0].camera.position,samples[0].camera.position);
      assert.ok(samples[2].route<samples[0].route);
      assert.ok(samples[5].image.opacity>0);
      assert.ok(samples[6].modelOpacity<.1,`late model opacity ${samples[6].modelOpacity}`);
      assert.ok(Math.abs(samples[6].image.width-samples[7].image.width)<30);
      if(width===1440){
        await seek(17.6);await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(150);
        const resized=await page.evaluate(()=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple,p=api.getMuralProjection('mural-05'),r=document.querySelector('.mural-guide__image').getBoundingClientRect();return {p,left:r.left,top:r.top,width:r.width}});
        assert.ok(Math.abs(resized.left-resized.p.left)<3&&Math.abs(resized.top-resized.p.top)<3,'resize keeps image on mural projection');
        await page.setViewportSize({width,height});await page.waitForTimeout(150);
      }
      for(const n of [17.8,17.4,16,18,20.2,24.4,18,17.6])await seek(n);
      await page.reload();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
      assert.ok(await page.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralProjection('mural-05')?.width>0));
      await page.waitForFunction(()=>document.querySelector('.mural-guide__image').naturalWidth>0);
      const restored=await page.evaluate(()=>{const p=document.querySelector('iframe').contentWindow.shuilongTemple.getMuralProjection('mural-05'),r=document.querySelector('.mural-guide__image').getBoundingClientRect();return {p,left:r.left}});
      assert.ok(Math.abs(restored.left-restored.p.left)<3,'refresh restores the transfer position');
      console.log(`${width}x${height} transition PASS`);
      await page.close();
    }
    const reduced=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4173/module-a/a01/');
    await reduced.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
    const positions=[];
    for(const n of [16,17,17.6,18]){await reduced.evaluate(n=>scrollTo(0,n*innerHeight),n);await reduced.waitForTimeout(100);positions.push(await reduced.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State().camera.position));}
    assert.notDeepEqual(positions[0],positions[1]);assert.notDeepEqual(positions[1],positions[3]);
    await reduced.close();
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
