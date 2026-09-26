const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(__dirname, '../docs/validation/wall-finish');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [1024, 768]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      await page.route('**/favicon.ico', route => route.fulfill({ status: 204, body: '' }));
      const errors = [], requests = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('request', r => requests.push(r.url()));
      await page.goto('http://127.0.0.1:4175/shuilong-temple/水龙祠-交互预览.html?clean&controlled');
      await page.waitForFunction(() => window.modelReady && window.shuilongTemple.getArchitectureState().every(m => m.clonesLoaded));
      await page.evaluate(() => window.shuilongTemple.setIntroProgress(1));
      const views = [
        ['exterior-side', [18, 5, 4], [5, 1.4, 0]],
        ['exterior-rear', [13, 7, -27], [0, 1.4, -15]],
        ['entrance', [11, 5, 26], [0, 1.6, 11.93]],
        ['interior-gallery', [-1, 2.2, 4.8], [4.89, 1.4, 4.8]],
        ['interior-entry', [4.15, 1.8, 8], [3.25, 1.5, 11.93]],
      ];
      for (const [name, position, target] of views) {
        await page.evaluate(({ position, target }) => window.shuilongTemple.setA04({
          camera: { position, target }, paths: [[[0, 0, 0], [0, 0, 1]], [[0, 0, 1], [0, 0, 2]], [[0, 0, 2], [0, 0, 3]]],
          growth: [0, 0, 0], roofOpacity: 1, routeOpacity: 0, labelOpacity: 0, entryProgress: 1,
        }), { position, target });
        await page.waitForTimeout(150);
        if (width === 1440) await page.screenshot({ path: path.join(output, `${name}.png`) });
      }
      assert.deepEqual(errors, []);
      assert.equal(requests.filter(url => url.endsWith('shuilong-temple.glb')).length, 1);
      assert.equal(requests.filter(url => url.includes('-display.webp')).length, 0, 'architectural inspection never preloads murals');
      results.push({ viewport: [width, height], views: views.map(v => v[0]), singleModelLoad: true, muralRequests: 0, errors });
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
    console.log('PASS: exterior/interior wall views render at four viewport sizes without extra model or mural requests');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
