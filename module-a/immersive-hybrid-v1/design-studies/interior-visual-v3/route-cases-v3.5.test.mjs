import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {applyRouteCase,routeCase,returnMarker,returnMatchesCase} from './route-cases-v3.5.mjs';
const source=JSON.parse(fs.readFileSync(new URL('./murals.json',import.meta.url)));
test('confirmed route uses the warm DNG derivatives at the correct stops', () => {
 const result = applyRouteCase(source);
 for (const [index, id, x, original] of [[2,'mural-03',2.25,'第三铺'],[3,'mural-04',-2.25,'第四铺']]) {
  const mural = result[index];
  assert.equal(mural.id,id);
  assert.equal(mural.position[0],x);
  assert.equal(mural.image,'./assets/'+id+'-dng-warm.webp');
  assert.ok(mural.source.endsWith(original+'壁画原图.DNG'));
  assert.ok(fs.existsSync(new URL(mural.image,import.meta.url)));
 }
 assert.equal(routeCase('report').id,'model');
});
test('old URLs select the confirmed route and obsolete report return markers are discarded',()=>{assert.equal(returnMarker('report'),'mural-05:model');assert.equal(returnMatchesCase('mural-05:report','model'),false);assert.equal(returnMatchesCase('mural-05:model','model'),true);});
