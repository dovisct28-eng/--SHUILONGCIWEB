const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({channel:'chrome', headless:true});
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:4175/module-a/a01/');
    await page.waitForFunction(() => document.querySelector('iframe')?.contentWindow?.modelReady);
    const result = await page.evaluate(() => {
      const api = document.querySelector('iframe').contentWindow.shuilongTemple;
      const ids = ['mural-01','mural-02','mural-03','mural-04','mural-05'];
      const read = () => Object.fromEntries(ids.map(id => [id, api.getMuralMaterialState(id)]));
      const before = read();
      api.setMuralTransferOpacity('mural-05', .2);
      const faded = read();
      api.setMuralTransferOpacity('mural-05', 1);
      const restored = read();
      return {before, faded, restored};
    });
    const {before, faded, restored} = result;
    assert.ok(faded['mural-05'].some((item,i) => item.opacity < before['mural-05'][i].opacity));
    for (const id of ['mural-01','mural-02','mural-03','mural-04']) assert.deepEqual(faded[id], before[id], `${id} stays unchanged`);
    assert.deepEqual(restored, before);
    const uuids = Object.values(before).flat().map(item => item.uuid);
    assert.equal(new Set(uuids).size, uuids.length, 'mural materials have separate identities');
    const output=path.resolve(__dirname,'../docs/validation/a04-final/material-isolation');
    fs.mkdirSync(output,{recursive:true});
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({isolated:true,restored:true,murals:Object.fromEntries(Object.entries(faded).map(([id,items])=>[id,items.map(item=>item.opacity)]))},null,2));
    console.log('mural material isolation: passed');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
