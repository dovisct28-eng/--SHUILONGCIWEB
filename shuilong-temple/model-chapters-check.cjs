const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const output = path.resolve(__dirname, '../docs/validation/model-hifi');
const stops = [['05', 20.2], ['06', 28], ['07', 37], ['08', 42]];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    for (const [width, height] of [[1920,1080], [1440,900], [1366,768], [1024,768]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4175/module-a/a01/');
      await page.waitForFunction(() => document.querySelector('iframe').contentWindow.modelReady);
      const states = [];
      for (const [chapter, screen] of stops) {
        await page.evaluate(screen => scrollTo(0, screen * innerHeight), screen);
        await page.waitForTimeout(350);
        const state = await page.evaluate(chapter => {
          const guide = document.querySelector(`.mural-guide[data-chapter="${chapter}"]`);
          const entry = document.querySelector('.a08');
          return { chapter, guideVisible: chapter === '08' ? null : Boolean(guide && !guide.hidden),
            imageLoaded: chapter === '08' ? null : Boolean(guide?.querySelector('img')?.naturalWidth),
            entryVisible: chapter === '08' ? Boolean(entry && !entry.hidden) : null,
            overflow: document.documentElement.scrollWidth > innerWidth };
        }, chapter);
        assert.equal(state.overflow, false);
        if (chapter === '08') assert.equal(state.entryVisible, true);
        else { assert.equal(state.guideVisible, true); assert.equal(state.imageLoaded, true); }
        states.push(state);
      }
      if (width === 1440) await page.screenshot({ path: path.join(output, 'a08-1440x900.png') });
      assert.deepEqual(errors, []);
      results.push({ viewport: `${width}x${height}`, states });
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'chapters-results.json'), JSON.stringify(results, null, 2));
    console.log('PASS: A05–A08 remain reachable at all four viewports');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
