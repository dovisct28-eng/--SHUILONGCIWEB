import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
test('local font subsets cover A01 copy, match manifest and remain within budget',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('fonts/manifest.json',import.meta.url),'utf8'));
 const html=fs.readFileSync(new URL('index.html',import.meta.url),'utf8');
 const hero=html.split('<div class="hero">')[1].split('<section class="a02"')[0].replace(/<[^>]+>/g,'');
 for(const c of hero)assert.ok(manifest.text.includes(c),`Missing subset character ${c}`);
 assert.equal(manifest.fonts.length,2);
 assert.ok(manifest.fonts.reduce((n,f)=>n+f.bytes,0)<=manifest.budgetBytes);
 for(const font of manifest.fonts){const data=fs.readFileSync(new URL('fonts/'+font.file,import.meta.url));assert.equal(data.subarray(0,4).toString(),'wOF2');assert.equal(data.length,font.bytes);assert.equal(createHash('sha256').update(data).digest('hex'),font.sha256);}
});
