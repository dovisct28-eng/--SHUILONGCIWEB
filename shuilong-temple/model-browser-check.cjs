const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const output = path.resolve(__dirname, '../docs/validation/model-structure');
fs.mkdirSync(output, { recursive: true });
const url = 'http://127.0.0.1:4173/module-a/a01/';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [], errors = [];
  try {
    for (const [width, height] of [[1440, 900], [1024, 768]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const resource = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.url().endsWith('shuilong-temple.glb')) resource.push(request.url()); });
      page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(url);
      await page.waitForFunction(() => document.querySelector('iframe').contentWindow.modelReady);
      const states = [];
      for (const [name, screens] of [['a01', 5.7], ['a02', 9.8], ['a03', 11.7], ['a04', 14.5]]) {
        await page.evaluate(value => scrollTo(0, value * innerHeight), screens);
        await page.waitForTimeout(400);
        const state = await page.evaluate(() => ({
          phase: document.body.dataset.phase,
          murals: document.querySelector('iframe').contentWindow.shuilongTemple.getMurals(),
          overflow: document.documentElement.scrollWidth > innerWidth,
          triangles: document.querySelector('iframe').contentWindow.modelStats?.triangles,
        }));
        assert.equal(state.overflow, false);
        assert.equal(state.murals.length, 5);
        assert.ok(state.triangles > 0);
        states.push({ name, phase: state.phase, triangles: state.triangles });
        await page.screenshot({ path: path.join(output, `${name}-${width}x${height}.png`) });
      }
      assert.equal(resource.length, 1, 'all chapters must share one GLB load');
      if (width === 1440) {
        await page.waitForFunction(() => document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed >= 24, null, { timeout: 35000 });
        const first = await page.evaluate(() => {
          const window = document.querySelector('iframe').contentWindow;
          return { state: window.shuilongTemple.getA04State(), title: document.querySelector('.a04 [data-title]').textContent };
        });
        assert.equal(first.title, '02 / 第一幅');
        assert.equal(first.state.target, 'mural-01');
        await page.screenshot({ path: path.join(output, 'a04-first-1440x900.png') });
        states.push({ name: 'first-mural', title: first.title, camera: first.state.camera });
      }
      results.push({ viewport: `${width}x${height}`, states, singleModelLoad: true });
      await page.close();
    }
    const direct = await browser.newPage();
    direct.on('pageerror', error => errors.push(error.message));
    await direct.goto('http://127.0.0.1:4173/shuilong-temple/水龙祠-交互预览.html?clean&controlled');
    await direct.waitForFunction(() => window.modelReady);
    assert.equal(await direct.evaluate(() => window.shuilongTemple.getMurals().length), 5);
    results.push({ directPreview: true });
    await direct.close();
    const offline = await browser.newPage();
    offline.on('pageerror', error => errors.push(error.message));
    await offline.goto(pathToFileURL(path.resolve(__dirname, '水龙祠-交互预览.html')).href);
    await offline.waitForFunction(() => window.modelReady);
    assert.equal(await offline.evaluate(() => window.shuilongTemple.getMurals().length), 5);
    results.push({ offlineFilePreview: true });
    await offline.close();
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ results, errors }, null, 2));
    console.log('PASS: A01–A04 share corrected model; mural-01 camera and direct preview verified');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
