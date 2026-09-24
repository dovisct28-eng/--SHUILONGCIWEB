const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const output = path.resolve(__dirname, '../../docs/validation/a05');
fs.mkdirSync(output, {recursive:true});
const url = 'http://127.0.0.1:4174/module-a/a01/';

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const results = [], errors = [];
  const open = async (viewport, options = {}) => {
    const page = await browser.newPage({viewport, ...options});
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('request', request => {
      if (/detail\.webp|mural-0[12]-display\.webp|Mural-Exhibition/.test(request.url())) errors.push(`unexpected resource ${request.url()}`);
    });
    await page.goto(url);
    await page.waitForFunction(() => document.querySelector('iframe').contentWindow.modelReady);
    return page;
  };
  const scroll = async (page, screens) => {
    await page.evaluate(value => scrollTo(0, value * innerHeight), screens);
    await page.waitForTimeout(350);
  };
  const state = page => page.evaluate(() => {
    const guide = document.querySelector('.mural-guide');
    const img = guide.querySelector('img');
    const rect = img.getBoundingClientRect();
    return {phase:guide.dataset.phase,hidden:guide.hidden,scan:Number(guide.dataset.scanProgress),travel:Number(guide.dataset.travelPx),offset:Number(guide.dataset.offsetPx),left:rect.left,right:rect.right,width:rect.width,viewport:innerWidth,title:guide.querySelector('h2').textContent,introOpacity:Number(getComputedStyle(guide).getPropertyValue('--intro-opacity')),nextOpacity:Number(getComputedStyle(guide).getPropertyValue('--handoff-opacity')),imageLoaded:img.naturalWidth>0,src:img.currentSrc};
  });
  try {
    for (const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]) {
      const page = await open({width,height});
      const tag = `${width}x${height}`;
      await scroll(page,14.5);
      await page.getByRole('button',{name:'跳过动画'}).click();
      await scroll(page,18);
      assert.equal((await state(page)).hidden,true);
      const a04 = await page.evaluate(() => document.querySelector('iframe').contentWindow.shuilongTemple.getA04State());
      assert.equal(a04.mode,'completed');
      assert.equal(a04.target,'mural-05');
      await scroll(page,18.4);
      assert.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector('.mural-guide__intro')).opacity)<.05));
      await scroll(page,18.85);
      await page.waitForFunction(() => document.querySelector('.mural-guide img').naturalWidth > 0);
      const intro = await state(page);
      assert.equal(intro.phase,'introduction');assert.equal(intro.title,'第五幅');assert.equal(intro.introOpacity,1);
      await scroll(page,20.2);
      const right = await state(page);
      assert.ok(right.scan<.001);assert.ok(right.travel>0);assert.ok(Math.abs(right.right-width)<2);
      await scroll(page,22.3);
      const center = await state(page);
      assert.ok(Math.abs(center.scan-.5)<.001);assert.ok(Math.abs(center.offset+center.travel/2)<2);
      await scroll(page,24.4);
      const left = await state(page);
      assert.ok(left.scan>.999);assert.ok(Math.abs(left.left)<2);assert.ok(left.right>=width-2);
      await scroll(page,25);
      assert.equal((await state(page)).phase,'handoff');assert.equal((await state(page)).nextOpacity,1);
      await scroll(page,22.3);
      assert.ok(Math.abs((await state(page)).offset-center.offset)<2);
      await scroll(page,20.2);
      assert.ok(Math.abs((await state(page)).offset-right.offset)<2);
      await scroll(page,18.85);
      assert.equal((await state(page)).introOpacity,1);
      await scroll(page,18);
      assert.equal((await state(page)).hidden,true);
      assert.equal(await page.evaluate(() => document.querySelector('iframe').contentWindow.shuilongTemple.getA04State().mode),'completed');

      for (const [name,point] of [['intro',18.85],['center',22.3],['left',24.4]]) {
        await scroll(page,point);
        await page.reload();
        await page.waitForFunction(() => document.querySelector('.mural-guide img').naturalWidth > 0);
        assert.equal((await state(page)).phase,name==='intro'?'introduction':'scan');
        assert.ok(Math.abs((await state(page)).scan-(name==='center'?.5:name==='left'?1:0))<.001);
      }
      await scroll(page,18);
      await scroll(page,25);
      assert.equal((await state(page)).phase,'handoff');
      await scroll(page,20.2);
      assert.ok((await state(page)).scan<.001);
      if (tag==='1440x900'||tag==='1024x768') {
        const frames = tag==='1440x900' ? [['transition',18.4],['intro',18.85],['right',20.2],['center',22.3],['left',24.4],['handoff',25]] : [['intro',18.85],['center',22.3],['handoff',25]];
        for (const [name,point] of frames) {
          await scroll(page,point);
          await page.screenshot({path:path.join(output,`${name}-${tag}.png`)});
        }
      }
      results.push({viewport:tag,right:{offset:right.offset,travel:right.travel},center:{offset:center.offset},left:{offset:left.offset},reverse:true,refresh:true,rapidCrossing:true});
      await page.close();
    }
    const reduced = await open({width:1024,height:768},{reducedMotion:'reduce'});
    await scroll(reduced,20.2);await reduced.waitForFunction(() => document.querySelector('.mural-guide img').naturalWidth > 0);
    assert.ok(Math.abs((await state(reduced)).right-1024)<2);
    await scroll(reduced,24.4);assert.ok(Math.abs((await state(reduced)).left)<2);
    await reduced.close();
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,errors,reducedMotion:true},null,2));
    console.log('PASS: A05 four viewports, full right-to-left scan, reverse, reload, rapid crossing, reduced motion');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
