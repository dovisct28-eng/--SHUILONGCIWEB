const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const output=process.env.MODEL_VALIDATION_DIR?path.resolve(process.env.MODEL_VALIDATION_DIR):path.resolve(__dirname,'../../docs/validation/model-hifi');fs.mkdirSync(output,{recursive:true});
const muralOutput=path.join(output,'mural-textures');fs.mkdirSync(muralOutput,{recursive:true});

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const errors=[];
  try{
    for(const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
      const page=await browser.newPage({viewport:{width,height}});
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4175/module-a/a01/');
      await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
      const seek=async n=>{await page.evaluate(n=>scrollTo(0,n*innerHeight),n);await page.waitForTimeout(100);if(n>=16&&n<=18){const expected=n<=17.65?1:(()=>{const t=Math.max(0,Math.min(1,(n-17.65)/.35));return 1-t*t*(3-2*t)})();await page.waitForFunction(expected=>Math.abs(Number(getComputedStyle(document.querySelector('.model-shell')).opacity)-expected)<.02,expected,{timeout:3000});}};
      await seek(14.5);await page.getByRole('button',{name:'跳过动画'}).click();
      const samples=[];
      for(const n of [16,16.5,17,17.4,17.6,17.8,17.99,18,18.1,18.8]){
        await seek(n);
        const sample=await page.evaluate(()=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;
          const frame=document.querySelector('iframe'),image=document.querySelector('.mural-guide__image');const rect=image.getBoundingClientRect(),local=api.getMuralProjection('mural-05'),frameRect=frame.getBoundingClientRect(),stageRect=document.querySelector('.stage').getBoundingClientRect(),sx=frameRect.width/frame.clientWidth,sy=frameRect.height/frame.clientHeight;
          const projection={left:frameRect.left-stageRect.left+local.left*sx,top:frameRect.top-stageRect.top+local.top*sy,width:local.width*sx,height:local.height*sy};
          return {screen:scrollY/innerHeight,camera:api.getA04State()?.camera,route:api.getA04State()?.routeOpacity,
            projection,image:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,opacity:Number(getComputedStyle(image).opacity)},
            modelOpacity:Number(getComputedStyle(document.querySelector('.model-shell')).opacity)};});
        assert.ok(sample.projection?.width>0&&sample.projection?.height>0,`${n}: mural projection`);
        samples.push({n,...sample});
        if((width===1440||width===1024)&&[16,17,17.4,17.6,17.8,17.99,18,18.1].includes(n)){
          const file=`transfer-${n}-${width}x${height}.png`;await page.screenshot({path:path.join(output,file)});
          if(width===1440)await page.screenshot({path:path.join(muralOutput,`a04-a05-${n}.png`)});
          if(width===1440&&n===18.1)await page.screenshot({path:path.join(muralOutput,'a05-entry.png')});
        }
      }
      assert.deepEqual(samples[0].camera.position,samples[0].camera.position);
      assert.ok(samples[2].route<samples[0].route);
      assert.ok(samples[5].image.opacity>0);
      assert.ok(samples[6].modelOpacity<.1,`late model opacity ${samples[6].modelOpacity}`);
      assert.ok(Math.abs(samples[6].image.width-samples[7].image.width)<30);
      if(width===1440){
        await seek(17.6);await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(150);
        const resized=await page.evaluate(()=>{const p=JSON.parse(document.querySelector('.mural-guide').dataset.projection),r=document.querySelector('.mural-guide__image').getBoundingClientRect(),ratio=6000/1617,width=Math.min(p.width,p.height*ratio),height=width/ratio;return {p,left:r.left,top:r.top,expected:{left:p.left+(p.width-width)/2,top:p.top+(p.height-height)/2}}});
        assert.ok(Math.abs(resized.left-resized.expected.left)<3&&Math.abs(resized.top-resized.expected.top)<3,'resize keeps contain-fitted image on mapped mural projection');
        await page.setViewportSize({width,height});await page.waitForTimeout(150);
      }
      for(const n of [17.8,17.4,16,18,20.2,24.4,18,17.6])await seek(n);
      if(width===1440)await page.screenshot({path:path.join(muralOutput,'reverse.png')});
      await page.reload();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
      await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState('mural-05').loaded);
      assert.ok(await page.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralProjection('mural-05')?.width>0));
      await page.waitForFunction(()=>document.querySelector('.mural-guide__image').naturalWidth>0);
      const restored=await page.evaluate(()=>{const p=JSON.parse(document.querySelector('.mural-guide').dataset.projection),image=document.querySelector('.mural-guide__image'),r=image.getBoundingClientRect(),ratio=image.naturalWidth/image.naturalHeight,width=Math.min(p.width,p.height*ratio),height=width/ratio;return {screen:scrollY/innerHeight,p,left:r.left,top:r.top,width:r.width,height:r.height,style:{left:image.style.left,top:image.style.top,width:image.style.width,height:image.style.height},expected:{left:p.left+(p.width-width)/2,top:p.top+(p.height-height)/2}}});
      assert.ok(Math.abs(restored.left-restored.expected.left)<3&&Math.abs(restored.top-restored.expected.top)<3,`refresh restores the contain-fitted image to the parent-space mural projection: ${JSON.stringify(restored)}`);
      console.log(`${width}x${height} transition PASS`);
      await page.close();
    }
    const reduced=await browser.newPage({viewport:{width:1024,height:768},reducedMotion:'reduce'});
    await reduced.goto('http://127.0.0.1:4175/module-a/a01/');
    await reduced.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
    const positions=[];
    for(const n of [16,17,17.6,18]){await reduced.evaluate(n=>scrollTo(0,n*innerHeight),n);await reduced.waitForTimeout(100);positions.push(await reduced.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State().camera.position));}
    assert.notDeepEqual(positions[0],positions[1]);assert.notDeepEqual(positions[1],positions[3]);
    await reduced.close();
    assert.deepEqual(errors,[]);
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
