import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
test('opening removes obsolete spatial frames and title plates',()=>{
 const html=read('./index.html'),css=read('./styles.css'),app=read('./app.mjs');
 assert.doesNotMatch(html+css,/depth-layer|depth-back|depth-mid|depth-front|depth-note|低保真空间入口|素材待替换/);
 assert.doesNotMatch(app+css,/--travel/);
 assert.match(css,/\.copy\{[^}]*background:none/);
 assert.match(css,/\.model-shell iframe\{[^}]*background:transparent/);
 // Ink landscape may use gradients; interface title plates remain absent.
 assert.doesNotMatch(css,/backdrop-filter/);
});
