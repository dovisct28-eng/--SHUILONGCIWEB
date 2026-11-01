const {chromium}=require('playwright'),assert=require('assert/strict');
const origin=process.env.V35_ORIGIN||'http://127.0.0.1:4186';
const idle=p=>p.waitForFunction(()=>document.body.dataset.ready==='true'&&document.body.dataset.busy==='false',null,{timeout:90000});
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));try{
 for(const query of ['', '?layout=model', '?layout=report']){await p.goto(origin+'/module-a/gallery/'+query);await idle(p);assert.equal(await p.getAttribute('body','data-route-case'),'model');assert.equal(await p.locator('#route-layout').count(),0);await p.locator('#route-open').click();assert.match(await p.locator('#route-case-note').innerText(),/③麒麟在右.*④盘龙在左/);await p.locator('#route-close').click();}
 await p.evaluate(()=>sessionStorage.setItem('shuilongci-v3-return','mural-05:report'));await p.reload();await idle(p);assert.equal(await p.getAttribute('body','data-mural-index'),'0');assert.equal(await p.evaluate(()=>sessionStorage.getItem('shuilongci-v3-return')),null);
 await p.evaluate(()=>sessionStorage.setItem('shuilongci-v3-return','mural-05:model'));await p.reload();await idle(p);assert.equal(await p.getAttribute('body','data-view'),'C');assert.equal(await p.getAttribute('body','data-mural-index'),'4');assert.deepEqual(errors,[]);console.log('Single route, old URLs and return markers PASS');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
