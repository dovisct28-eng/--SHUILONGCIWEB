const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const output=process.env.MODEL_VALIDATION_DIR;
if(!output)throw new Error('Set MODEL_VALIDATION_DIR to an external screenshot directory');
fs.mkdirSync(output,{recursive:true});
const url='http://127.0.0.1:4175/module-a/a01/';
const read=p=>p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getVisualState());
const seek=async(p,n)=>{await p.evaluate(n=>scrollTo(0,n*innerHeight),n);await p.waitForTimeout(350);};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
 try{
  for(const size of [[1440,900],[1920,1080]]){
   const p=await browser.newPage({viewport:{width:size[0],height:size[1]}}),errors=[],requests=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
   await p.goto(url);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
   await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));
   const states=[];
   for(const [name,n] of [['a01',5.7],['a02',9.8],['a03',12.9]]){
    await seek(p,n);const state=await read(p);assert.equal(state.error,null);states.push({name,...state});
    await p.screenshot({path:path.join(output,`${name}-${size.join('x')}.png`)});
   }
   assert.ok(states[0].environmentOpacity>states[1].environmentOpacity&&states[1].environmentOpacity>states[2].environmentOpacity);
   await seek(p,14.5);await p.getByRole('button',{name:'跳过动画'}).click();
   assert.equal((await read(p)).visible,false);
   await p.screenshot({path:path.join(output,`a04-overview-${size.join('x')}.png`)});
   if(size[0]===1440){
    await p.getByRole('button',{name:'重新观看'}).click();
    for(const [name,time,id] of [['fifth',9,'mural-05'],['first',24,'mural-01'],['second',37,'mural-02']]){
     await p.waitForFunction(t=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed>=t,time,{timeout:45000});
     await p.waitForFunction(id=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState(id).loaded,id);
     const state=await read(p);assert.equal(state.target,id);assert.equal(state.environmentOpacity,0);
     await p.screenshot({path:path.join(output,`a04-${name}-1440x900.png`)});
    }
   }
   await seek(p,18.8);assert.equal(await p.locator('.mural-guide[data-chapter="05"]').isVisible(),true);
   for(const [chapter,n] of [['05',20.2],['06',28],['07',37]]){
    await seek(p,n);await p.waitForFunction(chapter=>Boolean(document.querySelector(`.mural-guide[data-chapter="${chapter}"] img`)?.naturalWidth),chapter);
    assert.equal(await p.locator(`.mural-guide[data-chapter="${chapter}"]`).isVisible(),true);
   }
   await seek(p,42);assert.equal(await p.locator('.a08').isVisible(),true);
   await seek(p,5.7);const {name,...initial}=states[0];assert.deepEqual(await read(p),initial);
   await p.close();report.push({viewport:size,states,errors,singleGLB:requests.filter(r=>r.endsWith('.glb')).length===1});assert.deepEqual(errors,[]);
  }
  for(const failure of ['environment','glb','mural','reduced-motion']){
   const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:failure==='reduced-motion'?'reduce':'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   if(failure==='environment')await p.route('**/environment.mjs',r=>r.abort());
   if(failure==='glb')await p.route('**/*.glb',r=>r.abort());
   if(failure==='mural')await p.route('**/mural-05-display.webp',r=>r.abort());
   await p.goto(url);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
   await seek(p,5.7);const visual=await read(p);assert.equal(Boolean(visual.error),failure==='environment');
   await p.setViewportSize({width:1024,height:768});await seek(p,14.5);
   if(failure!=='reduced-motion')await p.getByRole('button',{name:'跳过动画'}).click();
   await seek(p,18.8);assert.equal(await p.locator('.mural-guide[data-chapter="05"]').isVisible(),true);
   if(failure==='mural'){
    const mural=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getMuralTextureState('mural-05'));
    assert.equal(mural.loaded,false);assert.equal(mural.requested,true);assert.equal(mural.placeholderVisible,true);
   }
   assert.deepEqual(errors,[]);report.push({failure,visual,errors});await p.close();
  }
  fs.writeFileSync(path.join(output,'environment-results.json'),JSON.stringify(report,null,2));console.log('PASS: environment hierarchy, screenshots, reversal, resize, failures and reduced-motion');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
