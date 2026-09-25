const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const output = path.resolve(__dirname, '../../docs/validation/a08');
fs.mkdirSync(output, { recursive: true });
const url = 'http://127.0.0.1:4175/module-a/a01/';
const move = async (page, screen) => {
  await page.evaluate(value => scrollTo(0, value * innerHeight), screen);
  await page.waitForTimeout(250);
};
const read = page => page.evaluate(() => {
  const guide = document.querySelector('.mural-guide[data-chapter="07"]');
  const image = guide.querySelector('img');
  const button = document.querySelector('.a08 a');
  return {
    screen: scrollY / innerHeight,
    guideVisible: !guide.hidden,
    guideLeft: image.getBoundingClientRect().left,
    a08Visible: !document.querySelector('.a08').hidden,
    buttonVisible: button.getBoundingClientRect().right <= innerWidth && button.getBoundingClientRect().left >= 0,
    overflow: document.documentElement.scrollWidth > innerWidth,
  };
});

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = [];
  try {
    for (const [width, height] of [[1920,1080],[1440,900],[1366,768],[1024,768]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(url);
      await move(page, 39.5);
      await page.waitForFunction(() => document.querySelector('.mural-guide[data-chapter="07"] img').naturalWidth > 0);
      const left = await read(page);
      assert.ok(left.guideVisible && Math.abs(left.guideLeft) < 2 && !left.a08Visible);
      await move(page, 40.5);
      const middle = await read(page);
      assert.ok(middle.guideVisible && middle.a08Visible && Math.abs(middle.guideLeft) < 2);
      await move(page, 42);
      const end = await read(page);
      assert.ok(end.guideVisible && end.a08Visible && end.buttonVisible && !end.overflow);
      await page.screenshot({ path: path.join(output, `end-${width}x${height}.png`) });
      await move(page, 39.5);
      assert.ok(Math.abs((await read(page)).guideLeft) < 2);
      await move(page, 42);
      await page.reload();
      await page.waitForFunction(() => !document.querySelector('.a08').hidden);
      assert.ok(Math.abs((await read(page)).screen - 42) < .02);
      assert.deepEqual(errors, []);
      report.push({ viewport: `${width}x${height}`, left, middle, end, reverse: true, refresh: true });
      if (width === 1440) {
        await page.getByRole('link', { name: '进入探索' }).click();
        await page.waitForURL('http://localhost:3000/index.html');
        await page.goBack();
        await page.waitForFunction(() => !document.querySelector('.a08').hidden);
        assert.ok((await read(page)).screen >= 40);
        report.at(-1).browserBack = true;
      }
      await page.close();
    }
    const reduced = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
    await reduced.goto(url);
    await move(reduced, 42);
    assert.ok((await read(reduced)).buttonVisible);
    await reduced.close();
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ report, reducedMotion: true }, null, 2));
    console.log('A08 browser checks passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
