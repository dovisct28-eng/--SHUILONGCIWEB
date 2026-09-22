// Run with NODE_PATH pointing at a Playwright installation; uses installed Chrome.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const output = path.resolve(__dirname, '../../docs/validation/a02');
  fs.mkdirSync(output, {recursive:true});
  const rows = [];
  try {
    for (const [width, height] of [[1440,900],[1440,1024],[1366,768],[1920,1080],[1024,768]]) {
      await page.setViewportSize({width,height});
      await page.goto('http://127.0.0.1:4173/module-a/a01/');
      await page.waitForFunction(() => document.querySelector('iframe').contentWindow.modelReady === true);
      const stop = async screens => {
        await page.evaluate(y => scrollTo(0,y), Math.round(screens*height));
        await page.waitForTimeout(150);
        return page.evaluate(() => {
          const f = document.querySelector('iframe').contentWindow;
          const labels = [...f.document.querySelectorAll('.mural-label')].filter(el => !el.hidden && f.getComputedStyle(el).display !== 'none').map(el => {
            const r = el.getBoundingClientRect();
            return {id:el.dataset.muralId,core:el.dataset.core,opacity:+el.style.opacity,x:r.x,y:r.y,w:r.width,h:r.height};
          });
          return {phase:document.body.dataset.phase, x:document.querySelector('[data-stage]').style.getPropertyValue('--model-x'),camera:f.shuilongTemple.getIntroState(),labels,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth};
        });
      };
      const stages = [['hero',5.7],['handoff',6.7],['center',7.5],['overview',8.7],['core',10.2]];
      const states = [];
      let heroImage;
      for (const [name, screens] of stages) {
        const state = await stop(screens);
        assert.equal(state.overflow,false);
        assert.equal(state.labels.length, ['overview','core'].includes(name) ? 5 : 0);
        for (let i=0;i<state.labels.length;i++) for(let j=i+1;j<state.labels.length;j++) {
          const a=state.labels[i],b=state.labels[j];
          assert.ok(a.x+a.w<=b.x || b.x+b.w<=a.x || a.y+a.h<=b.y || b.y+b.h<=a.y, 'overlapping labels');
        }
        if (name==='core') {
          assert.equal(state.labels.filter(l=>l.core==='true'&&l.opacity===1).length,3);
          assert.equal(state.labels.filter(l=>l.core==='false'&&l.opacity<.5).length,2);
        }
        states.push(state);
        if (name==='hero') heroImage = await page.screenshot();
        if (width===1440&&height===900 || name==='overview'||name==='core') await page.screenshot({path:path.join(output,`${name}-${width}x${height}.png`)});
      }
      assert.deepEqual(await stop(10.2), states.at(-1), 'stopped state changes');
      for (let i=stages.length-1;i>=0;i--) assert.deepEqual(await stop(stages[i][1]),states[i], 'reverse state differs');
      assert.deepEqual(await page.screenshot(),heroImage,'A01 pixels not restored after roof fade');
      await page.screenshot({path:path.join(output,`returned-hero-${width}x${height}.png`)});
      // Real wheel input must advance the same scroll-driven story.
      await page.mouse.wheel(0, height*3);
      await page.waitForTimeout(350);
      assert.equal(await page.evaluate(()=>document.body.dataset.phase), 'a02-overview');
      rows.push({width,height,passed:true,states});
    }
    assert.deepEqual(errors,[]);
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({errors,rows},null,2));
    console.log('PASS: five viewports, forward/reverse, pause, real wheel, labels, no page errors.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
