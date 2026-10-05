const {chromium}=require('playwright'),{execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ready,seek}=require('../module-a/a02/capture.cjs');
const out=path.resolve('docs/validation/shared-temple-world-2026-10-04/comparison');
const files=['module-a/a01/app.mjs','module-a/a01/ink-scene.mjs','module-a/a02/styles.css','module-a/a03/composition.mjs','module-a/a03/lighting.mjs','module-a/a03/styles.css','shuilong-temple/a01-environment.mjs','shuilong-temple/a02-light.mjs','shuilong-temple/director-light.mjs','shuilong-temple/水龙祠-交互预览.html'];
const old=new Map(files.map(f=>[f,execFileSync('git',['show','49eac2f:'+f],{maxBuffer:30*1024*1024})]));
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true}),rows=[];try{
  for(const version of ['before','after']){
    const p=await b.newPage({viewport:{width:1920,height:1080}});
    if(version==='before')await p.route('**/*',r=>{const f=decodeURIComponent(new URL(r.request().url()).pathname).slice(1),body=old.get(f);return body?r.fulfill({body,contentType:f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8'}):r.continue();});
    await p.goto('http://127.0.0.1:4173/module-a/a01/');await ready(p);await seek(p,14.5);await p.getByRole('button',{name:'跳过动画'}).click();await p.waitForTimeout(500);
    rows.push({version,...await p.evaluate(()=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;return {camera:api.getA04State().camera,growth:api.getA04State().growth,light:api.getDirectorState(),environment:api.getA01EnvironmentState()};})});
    await p.screenshot({path:path.join(out,'a04-'+version+'.png')});await p.close();
  }
  assert.deepEqual(rows[0].camera,rows[1].camera);assert.deepEqual(rows[0].growth,rows[1].growth);
  assert.equal(rows[1].light.look,'shared-temple');assert.equal(rows[1].environment.visible,false);
  fs.writeFileSync(path.join(out,'a04-look.json'),JSON.stringify({baseline:'49eac2fbc3e31a545e970a723c0db37120692586',cameraUnchanged:true,growthUnchanged:true,rows},null,2));console.log('PASS A04 shared look, same camera/path state, environment off');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
