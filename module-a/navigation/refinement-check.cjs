const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('docs/validation/module-a-navigation-2026-10-06'),mode=process.argv[2]||'after';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),rows=[];try{
 for(const[w,h]of(mode==='before'?[[1440,900]]:[[1920,1080],[1440,900],[1366,768],[1024,768],[1440,650],[760,768],[390,844]])){
  const p=await browser.newPage({viewport:{width:w,height:h}});await p.goto('http://127.0.0.1:4175/module-a/a01/');
  for(const screen of[23,24.8,29,31.8,38,39.8]){
   await p.evaluate(s=>scrollTo(0,s*innerHeight),screen);await p.waitForTimeout(200);await p.waitForFunction(()=>[...document.querySelectorAll('.mural-guide')].filter(g=>!g.hidden).every(g=>g.querySelector('img').naturalWidth>0));
   const state=await p.evaluate(()=>{
    const brand=document.querySelector('.story-nav__brand'),tools=document.querySelector('.story-nav__tools'),guide=[...document.querySelectorAll('.mural-guide')].find(e=>!e.hidden&&e.dataset.carried!=='true'),next=guide.querySelector('.mural-guide__next');
    const range=document.createRange();range.selectNodeContents(next);const r=range.getBoundingClientRect(),n=tools.getBoundingClientRect();
    return {chapter:guide.dataset.chapter,brandHidden:brand.hidden,brandInert:brand.inert,brandDisplay:getComputedStyle(brand).display,prompt:next.textContent,promptOpacity:Number(getComputedStyle(next).opacity),rect:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},tools:{x:n.x,y:n.y,right:n.right,bottom:n.bottom},overlap:Math.min(r.right,n.right)>Math.max(r.left,n.left)&&Math.min(r.bottom,n.bottom)>Math.max(r.top,n.top),bodyPhase:document.body.dataset.phase};
   });
   if(mode==='after'){
    assert.ok(state.brandHidden&&state.brandInert&&state.brandDisplay==='none',`visible scan brand at ${w}x${h} ${screen}`);
    if(state.promptOpacity>.1){assert.ok(!state.overlap,`prompt/nav overlap at ${w}x${h} ${screen}`);assert.ok(state.rect.x>=0&&state.rect.right<=w&&state.rect.bottom<=h);}
   }
   if(w===1440&&h===900&&(screen===23||screen===38||screen===39.8))await p.screenshot({path:path.join(out,'screenshots',`${screen===23?'a05-scan':screen===38?'a07-scan':'a07-handoff'}-${mode}.png`)});
   if(mode==='after'&&screen===39.8)await p.screenshot({path:path.join(out,'screenshots',`a07-handoff-${w}x${h}.png`)});
   rows.push({viewport:`${w}x${h}`,screen,...state});
  }
  await p.close();
 }
 fs.writeFileSync(path.join(out,`refinement-${mode}.json`),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(r=>({viewport:r.viewport,screen:r.screen,brandHidden:r.brandHidden,promptOpacity:r.promptOpacity,overlap:r.overlap})),null,2));console.log('PASS '+mode+' user refinement captures');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
