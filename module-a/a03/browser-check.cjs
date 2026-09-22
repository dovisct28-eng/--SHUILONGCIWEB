// NODE_PATH may point to the bundled Playwright installation. Start the A01 server first.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
// WebGL shadow/edge rounding can vary slightly after layer recomposition.
// State remains exact; image comparison permits <=16/255 channel noise only.
function comparePixels(before,after) {
  const a=PNG.sync.read(before),b=PNG.sync.read(after);
  assert.equal(a.width,b.width);assert.equal(a.height,b.height);
  let changed=0,maxDelta=0;
  for(let i=0;i<a.data.length;i+=4) {
    const delta=Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])));
    maxDelta=Math.max(maxDelta,delta);if(delta)changed++;
    assert.ok(delta<=16,`visible pixel difference: ${delta} at pixel ${i/4}`);
  }
  assert.ok(changed/(a.width*a.height)<.005,'widespread visual difference');
  return {changed,maxDelta};
}

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const output=path.resolve(__dirname,'../../docs/validation/a03');
  fs.mkdirSync(output,{recursive:true});
  const errors=[],rows=[];
  try {
    for(const [width,height] of [[1440,900],[1440,1024],[1366,768],[1920,1080],[1024,768]]) {
      const page=await browser.newPage({viewport:{width,height}});
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
      const resources=[];
      page.on('request',r=>resources.push(r.url()));
      await page.goto('http://127.0.0.1:4173/module-a/a01/');
      await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
      const capture=()=>page.evaluate(()=>{
        const win=document.querySelector('iframe').contentWindow;
        const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
        return {
          phase:document.body.dataset.phase,
          vars:document.querySelector('[data-stage]').getAttribute('style'),
          camera:win.shuilongTemple.getIntroState(),
          labels:[...win.document.querySelectorAll('.mural-label')].filter(el=>!el.hidden&&win.getComputedStyle(el).display!=='none').map(el=>({id:el.dataset.muralId,opacity:el.style.opacity,rect:rect(el)})),
          copy:rect(document.querySelector('[data-a03-copy]')),
          frame:rect(document.querySelector('iframe')),
          copyHidden:document.querySelector('[data-a03-copy]').getAttribute('aria-hidden'),
          handoffHidden:document.querySelector('[data-a03-handoff]').getAttribute('aria-hidden'),
          overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,
        };
      });
      const stop=async screens=>{await page.evaluate(y=>scrollTo(0,y),Math.round(screens*height));await page.waitForTimeout(350);return capture();};
      const hero=await stop(5.7),heroImage=await page.screenshot();
      const a02=await stop(10.2),a02Image=await page.screenshot();
      await page.screenshot({path:path.join(output,`a02-before-${width}x${height}.png`)});
      assert.equal(a02.labels.length,5);
      const states=[];
      for(const [name,screens] of [['transition',10.9],['reading',11.7],['exit',12.7],['handoff',13.2]]) {
        const state=await stop(screens);states.push({name,screens,state});
        assert.equal(state.overflow,false);
        assert.deepEqual(state.labels.map(p=>p.id),['mural-01','mural-02','mural-05']);
        assert.deepEqual(state.camera,a02.camera,'A03 must not replay growth or change camera');
        for(const p of state.labels) {
          assert.ok(p.rect.x>=0 && p.rect.y>=0);
        }
        if(name==='reading') {
          assert.equal(state.phase,'a03-reading');assert.equal(state.copyHidden,'false');
          assert.ok(state.copy.y>=0 && state.copy.y+state.copy.h<height-65,'text clips or covers hint');
          assert.ok(state.copy.x+state.copy.w<=state.frame.x,'text overlaps model frame');
          await page.waitForTimeout(600);assert.deepEqual(await capture(),state,'pause changes state');
        }
        if(name==='handoff') {assert.equal(state.copyHidden,'true');assert.equal(state.handoffHidden,'false');}
        await page.screenshot({path:path.join(output,`${name}-${width}x${height}.png`)});
      }
      for(const {screens,state} of states.toReversed()) assert.deepEqual(await stop(screens),state,'reverse differs');
      assert.deepEqual(await stop(10.2),a02);
      await page.screenshot({path:path.join(output,`a02-returned-${width}x${height}.png`)});
      const a02Diff=comparePixels(a02Image,await page.screenshot());
      assert.deepEqual(await stop(5.7),hero);
      const heroDiff=comparePixels(heroImage,await page.screenshot());
      await stop(10.2);await page.mouse.wheel(0,1.5*height);await page.waitForTimeout(650);
      assert.equal((await capture()).phase,'a03-reading');
      await page.reload();await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await page.waitForTimeout(500);
      assert.equal((await capture()).phase,'a03-reading','reload loses position');
      assert.ok(resources.every(url=>!url.includes('水龙祠壁画素材')&&!url.includes('相关文献')&&!url.includes('Mural-Exhibition')),'unexpected heavy resources');
      rows.push({width,height,passed:true,a02Diff,heroDiff,states});
      await page.close();
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({errors,rows},null,2));
    console.log('PASS: A03 five viewports; readable copy; core-only markers; stable camera; reverse pixels; wheel; reload; no page errors.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
