const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = path.resolve(__dirname, '../docs/validation/copy-update-2026-10-05');
const url = process.env.COPY_URL || 'http://127.0.0.1:4175/module-a/a01/';
fs.mkdirSync(out, {recursive: true});
const seek = async (page, point) => {
  await page.evaluate(p => scrollTo(0, p * innerHeight), point);
  await page.waitForTimeout(200);
  await page.evaluate(() => document.fonts.ready);
};
const inspect = (page, selector) => page.locator(selector).evaluate(e => {
  const r = e.getBoundingClientRect();
  const lines = [...e.querySelectorAll('h1,h2,p,.eyebrow,.theme')].flatMap(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    return [...range.getClientRects()].map(r => ({left:r.left, right:r.right, top:r.top, bottom:r.bottom}));
  });
  return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height,
    lines, overflow:document.documentElement.scrollWidth > innerWidth};
});
const fits = (bounds, width, height) => {
  assert.equal(bounds.overflow, false, 'No horizontal document overflow');
  for (const r of bounds.lines) {
    assert.ok(r.left >= 0 && r.right <= width + 1 && r.top >= 0 && r.bottom <= height + 1, `Text outside viewport: ${JSON.stringify(r)}`);
    assert.ok(r.left >= bounds.left - 1 && r.right <= bounds.right + 1, 'Text within its reading column');
  }
};
const guideState = (page, chapter) => page.locator(`.mural-guide[data-chapter="${chapter}"]`).evaluate(e => {
  const r = e.querySelector('img').getBoundingClientRect();
  return {phase:e.dataset.phase, scan:Number(e.dataset.scanProgress), offset:Number(e.dataset.offsetPx),
    left:r.left, right:r.right, height:r.height, hidden:e.hidden,
    intro:Number(getComputedStyle(e.querySelector('.mural-guide__intro')).opacity),
    veil:Number(getComputedStyle(e.querySelector('.mural-guide__veil')).opacity)};
});

(async () => {
  const guides = await Promise.all(['05','06','07'].map(async id => (await import(`./a${id}/content.mjs`))[`a${id}Guide`]));
  const browser = await chromium.launch({channel:'chrome', headless:true});
  const report = [];
  try {
    for (const [width,height] of [[1920,1080],[1440,900],[1366,768],[1024,768],[760,900],[390,844],[390,667]]) {
      const page = await browser.newPage({viewport:{width,height}}), errors = [], requests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
      page.on('response', r => {if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);});
      page.on('request', r => requests.push(r.url()));
      // The existing localhost server has no favicon. Keep its pre-existing 404 out of application-error checks.
      await page.route('**/favicon.ico', route => route.fulfill({status:204,body:''}));
      await page.goto(url);
      await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.modelReady);
      await seek(page, 5.6);
      assert.equal(await page.locator('.copy .eyebrow').textContent(), '湖南江永 · 勾蓝瑶');
      assert.equal(await page.locator('.copy h1').textContent(), '水龙祠');
      assert.equal(await page.locator('.copy .theme').textContent(), '出兵 · 入将');
      assert.equal(await page.locator('.copy p').textContent(), '一座神祠，两侧壁画，留下了一场出发与归来的故事。');
      assert.equal(await page.locator('.scroll-hint').textContent(), '走近水龙祠');
      const hero = await inspect(page, '.copy'); fits(hero, width, height);
      await page.screenshot({path:path.join(out, `a01-${width}x${height}.png`)});
      const spatial = [];
      for (const [point, expected] of [[7.6,'建筑空间'],[8.7,'五幅壁画 · 空间总览'],[9.9,'第五幅 · 第一幅 · 第二幅']]) {
        await seek(page, point);
        assert.equal(await page.locator('[data-a02-status]').textContent(), expected);
        assert.equal(await page.locator('#a02-title').textContent(), '壁画藏在何处');
        assert.equal(await page.locator('[data-a02-description]').textContent(), '五幅壁画散落在水龙祠的不同墙面。\n\n从其中三幅，走进“出兵入将”');
        assert.equal(await page.locator('.a02-note').count(), 0);
        const heading = await inspect(page, '.a02 header'), footer = await inspect(page, '.a02 footer');
        fits(heading, width, height); fits(footer, width, height);
        spatial.push({point, expected, heading, footer});
        await page.screenshot({path:path.join(out, `a02-${point}-${width}x${height}.png`)});
      }
      assert.equal(await page.locator('[data-a02-hint]').textContent(), '继续向下，走近“出兵入将”');
      const reading = [];
      for (const guide of guides) {
        const selector = `.mural-guide[data-chapter="${guide.chapter}"]`;
        await seek(page, guide.start + 1);
        await page.waitForFunction(ch => document.querySelector(`.mural-guide[data-chapter="${ch}"] img`).naturalWidth > 0, guide.chapter);
        for (const [sel, text] of [['.mural-guide__chapter',guide.chapterLabel],['h2',guide.title],
          ['.mural-guide__subtitle',guide.subtitle],['.mural-guide__description',guide.introduction],
          ['.mural-guide__marker',guide.marker],['.mural-guide__next',guide.next]]) {
          assert.equal(await page.locator(`${selector} ${sel}`).textContent(), text);
        }
        const bounds = await inspect(page, `${selector} .mural-guide__intro`); fits(bounds, width, height);
        assert.ok((await guideState(page, guide.chapter)).intro > .99, 'Stable introduction fully visible');
        await page.screenshot({path:path.join(out, `a${guide.chapter}-${width}x${height}.png`)});
        await seek(page, guide.start + 2.2);
        const right = await guideState(page, guide.chapter);
        assert.ok(Math.abs(right.right - width) < 2 && right.scan < .001, 'Scan starts at mural right edge');
        await seek(page, guide.start + 2.4);
        const scanning = await guideState(page, guide.chapter);
        assert.ok(scanning.intro < .001 && scanning.veil < .001, 'Introduction and reading veil exit for scanning');
        await seek(page, guide.end - .6);
        const left = await guideState(page, guide.chapter);
        assert.ok(Math.abs(left.left) < 2 && left.scan > .999, 'Scan ends at mural left edge');
        assert.equal(left.height, right.height, 'Scan retains image scale');
        await seek(page, guide.start + 2.2);
        assert.deepEqual(await guideState(page, guide.chapter), right, 'Reverse restores exact scan state');
        reading.push({chapter:guide.chapter, bounds, right, left});
      }
      assert.ok(Math.max(...reading.map(r=>r.bounds.top)) - Math.min(...reading.map(r=>r.bounds.top)) < 1, 'Three reading columns share the same top anchor');
      assert.ok(Math.max(...reading.map(r=>r.bounds.width)) - Math.min(...reading.map(r=>r.bounds.width)) < 1, 'Three guides share the same line width');
      await seek(page, 39.4); const before = await guideState(page, '07');
      await seek(page, 41); const after = await guideState(page, '07');
      assert.ok(Math.abs(before.left-after.left)<2, 'A08 inherits the left edge within CSS-pixel scroll rounding');
      assert.equal(before.height, after.height);
      assert.deepEqual(errors, []);
      assert.equal(requests.filter(u=>u.includes('detail.webp')).length, 0);
      report.push({viewport:`${width}x${height}`, hero, spatial, reading, errors, a08Inheritance:true, detailRequests:0});
      await page.close();
      console.log(`PASS ${width}x${height}: approved copy, reading bounds, scan/reverse, A08 inheritance, no errors`);
    }
    const page = await browser.newPage({viewport:{width:1024,height:768}, reducedMotion:'reduce'});
    await page.goto(url); await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
    await seek(page, 33);
    await page.setViewportSize({width:1366,height:768}); await page.waitForTimeout(250);
    assert.ok(Math.abs(await page.evaluate(()=>scrollY / innerHeight) - 33) < .01, 'Resize preserves chapter progress');
    await page.reload(); await page.waitForFunction(()=>document.querySelector('.mural-guide[data-chapter="07"] img').naturalWidth > 0);
    await page.waitForTimeout(250); fits(await inspect(page, '.mural-guide[data-chapter="07"] .mural-guide__intro'),1366,768);
    for (const g of guides) {
      await seek(page,g.start+2.2); const right=await guideState(page,g.chapter);
      await seek(page,g.end-.6); const left=await guideState(page,g.chapter);
      assert.ok(right.scan<.001);assert.ok(left.scan>.999);assert.ok(Math.abs(right.height-768*.7)<1);
    }
    await page.close();
    fs.writeFileSync(path.join(out,'results.json'), JSON.stringify({viewports:report, reducedMotion:true, resize:true, refresh:true},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
