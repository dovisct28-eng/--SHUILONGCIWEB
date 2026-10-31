const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const out=path.resolve('docs/validation/interior-visual-v3-5'),local=path.join(out,'local'),origin='http://127.0.0.1:4186';
const idle=p=>p.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.busy==='false',null,{timeout:90000});
async function click(p,s){await p.locator(s).click();await idle(p);}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={pass:false,errors:[]};const c=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:path.join(local,'formal-video'),size:{width:1440,height:900}}}),p=await c.newPage();try{
 p.on('pageerror',e=>report.errors.push(e.message));await p.goto(origin+'/module-a/a01/');await p.waitForFunction(()=>document.querySelector('.a03-title'));await p.evaluate(()=>scrollTo(0,innerHeight*12));await p.waitForTimeout(1800);assert.equal(await p.locator('.a03-title__in').innerText(),'入庙');assert.equal(await p.locator('.a03-title__out').innerText(),'出庙');assert.equal(await p.locator('.a05').count(),0);await p.screenshot({path:path.join(local,'formal-a03.png')});
 await Promise.all([p.waitForURL('**/module-a/gallery/'),p.locator('a[data-a03-reading-hint]').click()]);await idle(p);assert.equal(await p.evaluate(()=>typeof window.study),'undefined');assert.equal(await p.locator('#options-open').isVisible(),false);report.formalEntry=true;
 for(let i=0;i<9;i++)await click(p,'#forward');assert.equal(await p.getAttribute('body','data-view'),'C');
 for(let index=0;index<5;index++){
  if(index){await click(p,'#continue-tour');assert.equal(await p.getAttribute('body','data-mural-index'),String(index));await p.screenshot({path:path.join(local,'formal-wall-'+index+'.png')});await click(p,'#forward');}
  await p.waitForTimeout(500);if(index===2){await click(p,'#detail-open');await click(p,'#zoom-in');await p.locator('#detail-viewport').focus();await p.keyboard.press('ArrowRight');await click(p,'#reset');await click(p,'#detail-return');}
 }
 // Same real browser, failure of the actual target connection, no fake B page.
 await p.route('http://localhost:3000/**',r=>r.abort('connectionrefused'));await click(p,'#continue-tour');assert.equal(p.url(),origin+'/module-a/gallery/');assert.match(await p.locator('#message').textContent(),/暂不可达/);report.unavailable='browser connection-refused for localhost:3000; stayed at fifth';await p.screenshot({path:path.join(local,'formal-b-unavailable.png')});await p.unroute('http://localhost:3000/**');
 await Promise.all([p.waitForURL('http://localhost:3000/index.html',{waitUntil:'domcontentloaded'}),p.locator('#continue-tour').click()]);await p.locator('#btn-gallery-track').waitFor();await p.locator('#btn-cyber-track').waitFor();report.moduleB=true;await p.screenshot({path:path.join(local,'formal-module-b.png')});
 await p.goBack({waitUntil:'domcontentloaded'});await idle(p);await p.waitForFunction(()=>document.body.dataset.muralIndex==='4'&&document.body.dataset.view==='C',null,{timeout:90000});report.browserBack=true;
 await p.reload({waitUntil:'domcontentloaded'});await idle(p); // Simulate a discarded document return with the real stored handoff marker.
 await p.evaluate(()=>sessionStorage.setItem('shuilongci-v3-return','mural-05'));await p.reload({waitUntil:'domcontentloaded'});await idle(p);await p.waitForFunction(()=>document.body.dataset.muralIndex==='4'&&document.body.dataset.view==='C',null,{timeout:90000});report.coldReturn=true;await p.screenshot({path:path.join(local,'formal-fifth-return.png')});
 assert.deepEqual(report.errors,[]);report.pass=true;console.log('Formal entry + full route + B + both return paths PASS');
 }finally{const video=p.video();await c.close();report.video=await video.path();fs.writeFileSync(path.join(out,'integration-results.json'),JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
