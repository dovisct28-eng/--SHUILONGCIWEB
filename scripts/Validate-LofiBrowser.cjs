const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const url = process.env.LOFI_URL || 'http://127.0.0.1:4174/module-a/a01/';
const move = async (page, screens) => {
  await page.evaluate(value => scrollTo(0, value * innerHeight), screens);
  await page.waitForTimeout(300);
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });

  try {
    const response = await page.goto(url, { waitUntil: 'load' });
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.modelReady === true);

    const initial = await page.evaluate(() => ({
      title: document.title,
      story: Boolean(document.querySelector('[data-story]')),
      canvas: Boolean(document.querySelector('iframe').contentDocument.querySelector('canvas')),
    }));
    assert.equal(initial.title, '水龙祠｜A01–A08 空间与壁画叙事');
    assert.equal(initial.story, true);
    assert.equal(initial.canvas, true);

    await move(page, 7);
    assert.match(await page.evaluate(() => document.body.dataset.phase), /^a02/);

    await move(page, 11);
    assert.match(await page.evaluate(() => document.body.dataset.phase), /^a03/);

    await move(page, 14.5);
    await page.getByRole('button', { name: '跳过动画' }).click();
    await page.waitForTimeout(300);
    const a04 = await page.evaluate(() => document.querySelector('iframe').contentWindow.shuilongTemple.getA04State());
    assert.equal(a04.mode, 'completed');
    assert.equal(a04.routeComplete, true);
    assert.deepEqual(a04.growth, [1, 1, 1]);

    const guideChecks = [
      { screens: 18.1, chapter: '05', mural: 'mural-05' },
      { screens: 27.2, chapter: '06', mural: 'mural-01' },
      { screens: 34.2, chapter: '07', mural: 'mural-02' },
    ];
    for (const check of guideChecks) {
      await move(page, check.screens);
      await page.waitForFunction(chapter => {
        const guide = document.querySelector(`.mural-guide[data-chapter="${chapter}"]`);
        return guide && !guide.hidden && guide.querySelector('img').naturalWidth > 0;
      }, check.chapter);
      const guide = await page.evaluate(chapter => {
        const element = document.querySelector(`.mural-guide[data-chapter="${chapter}"]`);
        return { hidden: element.hidden, opacity: Number(getComputedStyle(element).opacity) };
      }, check.chapter);
      assert.equal(guide.hidden, false);
      assert.ok(guide.opacity > 0);
    }

    await move(page, 41);
    const a08 = await page.evaluate(() => {
      const section = document.querySelector('.a08');
      const link = section.querySelector('a');
      return { hidden: section.hidden, opacity: Number(getComputedStyle(section).opacity), href: link.href };
    });
    assert.equal(a08.hidden, false);
    assert.equal(a08.opacity, 1);
    assert.equal(a08.href, 'http://localhost:3000/index.html');

    await move(page, 34.2);
    assert.equal(await page.locator('.mural-guide[data-chapter="07"]').isVisible(), true);
    await move(page, 27.2);
    assert.equal(await page.locator('.mural-guide[data-chapter="06"]').isVisible(), true);

    const resources = await page.evaluate(() => {
      const frame = document.querySelector('iframe').contentWindow;
      return [...performance.getEntriesByType('resource'), ...frame.performance.getEntriesByType('resource')]
        .map(entry => decodeURIComponent(entry.name));
    });
    for (const asset of ['mural-05-display.webp', 'mural-01-display.webp', 'mural-02-display.webp']) {
      assert.ok(resources.some(resource => resource.endsWith(asset)), `${asset} was not loaded`);
    }
    assert.ok(resources.some(resource => resource.endsWith('shuilong-temple.glb')), 'GLB was not loaded');
    assert.deepEqual(errors, []);

    console.log(JSON.stringify({
      url,
      chapters: ['A01', 'A02', 'A03', 'A04', 'A05', 'A06', 'A07', 'A08'],
      a04: { completed: true, routeComplete: true },
      reverseScroll: true,
      model: true,
      murals: true,
      critical404: false,
      consoleErrors: false,
      explorationHref: a08.href,
    }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
