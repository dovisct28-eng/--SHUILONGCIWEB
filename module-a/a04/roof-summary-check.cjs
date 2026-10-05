const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {open,seek,read}=require('./capture.cjs');
const out=path.resolve('docs/validation/a04-roof-summary-2026-10-05');fs.mkdirSync(out,{recursive:true});
const baseline='45153bd4777a7da537211f9cc9c407a3ab71da08';
const oldFiles=new Map(['shuilong-temple/水龙祠-交互预览.html','module-a/a03/cutaway.mjs','module-a/a04/cutaway-state.mjs'].map(f=>[f,execFileSync('git',['show',baseline+':'+f],{maxBuffer:30*1024*1024})]));
const shot=async(p,name)=>{const bytes=await p.screenshot();await sharp(bytes).webp({quality:92}).toFile(path.join(out,name+'.webp'));};
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),rows=[],errors=[];try{
for(const[w,h]of [[1920,1080],[1440,900],[1366,768],[1024,768]]){
 const p=await open(b,w,h);p.on('pageerror',e=>errors.push(e.message));await seek(p,14.5);await p.locator('[data-skip]').click();await p.waitForTimeout(300);
 for(const[name,n]of [['summary',14.5],['approach-start',16],['approach-middle',16.5],['fifth-close',17.2],['summary-reverse',16]]){
  await seek(p,n);const s=await read(p);assert.equal(s.canvas,1);assert.equal(s.cutaway.movie.summary,n<=16?1:n>=17.2?0:s.cutaway.movie.summary);
  if(n===16.5)assert.ok(s.cutaway.movie.summary>0&&s.cutaway.movie.summary<1);
  const roofs=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getRoofState());assert.ok(roofs.every(r=>r.visible&&r.opacity===1&&r.depthWrite));
  rows.push({viewport:[w,h],name,...s});await shot(p,w+'-'+name);
 }
 await p.emulateMedia({reducedMotion:'reduce'});await seek(p,14.5);assert.equal((await read(p)).cutaway.movie.summary,1);await shot(p,w+'-reduced-motion');
 await seek(p,16.5);assert.ok((await read(p)).cutaway.movie.summary<1);await seek(p,14.5);await p.reload();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(400);assert.equal((await read(p)).cutaway.movie.summary,1);
 for(const n of [12.15,18.8,14.5,12.15])await seek(p,n);assert.equal((await read(p)).state,null);await p.close();console.log(w+' summary/approach/reverse/reload/reduced PASS');
 if(w===1920||w===1024){const old=await b.newPage({viewport:{width:w,height:h}});await old.route('**/*',r=>{const f=decodeURIComponent(new URL(r.request().url()).pathname).slice(1),body=oldFiles.get(f);return body?r.fulfill({body,contentType:f.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8'}):r.continue();});await old.goto('http://127.0.0.1:4175/module-a/a01/');await old.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await seek(old,14.5);await old.locator('[data-skip]').click();await old.waitForTimeout(300);await shot(old,w+'-before');await old.close();}
}
const actual=await open(b,1440,900);await seek(actual,14.5);for(const t of [20,39,41,45]){await actual.waitForFunction(t=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed>=t,t,{timeout:25000});const s=await read(actual);if(t>=41)assert.equal(s.cutaway.movie.summary,1);if(t===20)assert.equal(s.cutaway.movie.summary,0);rows.push({actualPlayback:true,t,...s});await shot(actual,'playback-'+t);}await actual.close();
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({baseline,rows,errors},null,2));
const tiles=[['Before 1920','1920-before'],['After 1920','1920-summary'],['Before 1024','1024-before'],['After 1024','1024-summary'],['Scroll start','1440-approach-start'],['Scroll approaching fifth','1440-approach-middle']],parts=[];
for(let i=0;i<tiles.length;i++){const x=i%2*640,y=Math.floor(i/2)*400;parts.push({input:Buffer.from(`<svg width="640" height="40"><rect width="100%" height="100%" fill="#12191d"/><text x="16" y="27" fill="#e0d8cb" font-family="Arial" font-size="18">${tiles[i][0]}</text></svg>`),left:x,top:y},{input:await sharp(path.join(out,tiles[i][1]+'.webp')).resize(640,360,{fit:'contain',background:'#12191d'}).toBuffer(),left:x,top:y+40});}
await sharp({create:{width:1280,height:1200,channels:3,background:'#12191d'}}).composite(parts).webp({quality:90}).toFile(path.join(out,'comparison.webp'));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
