const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4175/shuilong-temple/水龙祠-交互预览.html?clean&controlled');
    await page.waitForFunction(() => window.modelReady);
    await page.waitForFunction(() => window.shuilongTemple.getArchitectureState().every(item => item.base && item.roughness && item.normal), null, { timeout: 10000 });
    const materials = await page.evaluate(() => window.shuilongTemple.getArchitectureState());
    assert.deepEqual(new Set(materials.map(item => item.key)), new Set(['stone', 'paving', 'plaster', 'brick', 'wood', 'roof']));
    assert.ok(materials.every(item => item.wrap === 1000), 'material UVs repeat beyond the first tile');
    assert.ok(materials.every(item => item.clonesLoaded), 'the visible animation material copies have all PBR maps');
    assert.deepEqual(errors, []);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:4175/module-a/a01/');
    await page.waitForFunction(() => document.querySelector('iframe').contentWindow.modelReady);
    await page.evaluate(() => scrollTo(0, 14.5 * innerHeight));
    await page.waitForFunction(() => document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed >= 9, null, { timeout: 20000 });
    await page.screenshot({ path: path.resolve(__dirname, '../docs/validation/model-hifi/textured-fifth.png') });
    const fallback = await browser.newPage();
    const fallbackErrors = [];
    fallback.on('pageerror', error => fallbackErrors.push(error.message));
    await fallback.route('**/shuilong-temple.glb', route => route.abort());
    await fallback.goto('http://127.0.0.1:4175/shuilong-temple/水龙祠-交互预览.html?clean&controlled');
    await fallback.waitForFunction(() => window.modelReady);
    assert.equal(await fallback.evaluate(() => window.shuilongTemple.getMurals().length), 5);
    assert.deepEqual(fallbackErrors, []);
    await fallback.close();
    const failedTextures = await browser.newPage();
    const textureErrors = [];
    failedTextures.on('pageerror', error => textureErrors.push(error.message));
    await failedTextures.addInitScript(() => {
      const create = URL.createObjectURL;
      URL.createObjectURL = function(blob) { return blob.type === 'image/jpeg' ? 'data:image/jpeg;base64,AA==' : create.call(URL, blob); };
    });
    await failedTextures.goto('http://127.0.0.1:4175/shuilong-temple/水龙祠-交互预览.html?clean&controlled');
    await failedTextures.waitForFunction(() => window.modelReady);
    await failedTextures.waitForTimeout(400);
    const failedState = await failedTextures.evaluate(() => ({ count: window.shuilongTemple.getMurals().length, maps: window.shuilongTemple.getArchitectureState().map(item => item.base) }));
    assert.equal(failedState.count, 5);
    assert.ok(failedState.maps.every(value => value === false), 'base colors remain when JPEG decoding fails');
    assert.deepEqual(textureErrors, []);
    await failedTextures.close();
    console.log('PASS: architectural PBR maps, GLB fallback, and texture failure fallback');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
