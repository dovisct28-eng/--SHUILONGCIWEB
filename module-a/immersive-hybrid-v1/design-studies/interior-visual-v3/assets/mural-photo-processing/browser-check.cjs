// Review page checks only. This does not claim new gallery-route acceptance.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../../../../..');
const out = path.join(root, 'docs/validation/interior-visual-v3-3-stage-a');
const local = path.join(out, 'local');
const url = 'http://127.0.0.1:4188/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/mural-photo-processing/';

(async () => {
  fs.mkdirSync(local, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { scope: 'crop-review-page-only', runs: [], pass: false };
  try {
    for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768]]) {
      for (const reduce of [false, true]) {
        const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
        const page = await context.newPage();
        const errors = [];
        const ignoredBrowserRequests = [];
        page.on('pageerror', e => errors.push(e.message));
        // Chrome's native image document asks for /favicon.ico; the source-only
        // HTTP fixture has none. Keep that diagnostic separate from review errors.
        page.on('console', m => { if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(m.text()); });
        page.on('response', r => {
          if (r.status() >= 400) {
            const item = `${r.status()} ${r.url()}`;
            if (new URL(r.url()).pathname === '/favicon.ico') ignoredBrowserRequests.push(item);
            else errors.push(item);
          }
        });
        await page.goto(url);
        await page.locator('img').evaluateAll(images => Promise.all(images.map(im => im.decode())));
        const state = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          images: [...document.images].map(im => ({ width: im.naturalWidth, height: im.naturalHeight, fit: getComputedStyle(im).objectFit })),
          externalResources: performance.getEntriesByType('resource').filter(r => new URL(r.name).origin !== location.origin).length,
        }));
        assert.equal(state.overflow, false);
        assert.equal(state.externalResources, 0);
        assert.deepEqual(state.images.map(im => [im.width, im.height]), [[1280, 960], [1280, 960], [1280, 664], [1280, 1707], [1280, 1707], [1280, 1372]]);
        assert.ok(state.images.every(im => im.fit === 'contain'));
        // Follow actual candidate and parameter links; inspect decoded original-sized PNG.
        const candidateLink = page.locator('a[href="mural-04-crop-candidate.png"]');
        await candidateLink.click();
        await page.waitForURL('**/mural-04-crop-candidate.png');
        await page.locator('img').evaluate(im => im.decode());
        assert.deepEqual(await page.locator('img').evaluate(im => [im.naturalWidth, im.naturalHeight]), [1280, 1372]);
        await page.goBack();
        await page.locator('img').evaluateAll(images => Promise.all(images.map(im => im.decode())));
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'A');
        assert.deepEqual(errors, []);
        await page.screenshot({ path: path.join(local, `review-${width}-${height}-${reduce ? 'reduce' : 'normal'}.png`), fullPage: true });
        report.runs.push({ width, height, reducedMotion: reduce, ...state, directCandidateLink: true, keyboardLink: true, errors, ignoredBrowserRequests });
        await context.close();
      }
    }
    report.pass = true;
  } finally {
    fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
  console.log(`Crop review browser checks passed: ${report.runs.length}/6`);
})().catch(e => { console.error(e); process.exitCode = 1; });
