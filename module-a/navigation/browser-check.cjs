const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('docs/validation/module-a-navigation-2026-10-06');
fs.mkdirSync(path.join(out,'screenshots'),{recursive:true});
const url='http://127.0.0.1:4175/module-a/a01/';
const seek=async(page,screen)=>{await page.evaluate(s=>scrollTo(0,s*innerHeight),screen);await page.waitForTimeout(220);};
const inspect=page=>page.evaluate(()=>{
 const nav=document.querySelector('.story-nav'),menu=nav.querySelector('.story-nav__directory');
 const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
 return {screen:scrollY/innerHeight,phase:document.body.dataset.phase,visible:nav.dataset.visible==='true',stage:Number(nav.dataset.stage),layout:nav.dataset.layout,quiet:nav.dataset.quiet,inert:nav.inert,menuHidden:menu.hidden,menuInert:menu.inert,expanded:nav.querySelector('button').getAttribute('aria-expanded'),brand:rect(nav.querySelector('.story-nav__brand>span')),tools:rect(nav.querySelector('.story-nav__tools')),menu:rect(menu),toggle:rect(nav.querySelector('button')),overflow:document.documentElement.scrollWidth>innerWidth,focus:document.activeElement.className,model:document.querySelector('iframe').contentWindow.shuilongTemple?.getA04State?.()};
});
const open=async(page)=>{await page.getByRole('button',{name:'章节目录',exact:true}).click();assert.equal((await inspect(page)).expanded,'true');};
const jump=async(page,name)=>{await open(page);await page.locator('#story-directory').getByRole('link',{name,exact:true}).click();await page.waitForTimeout(250);};
const shot=async(page,name)=>page.screenshot({path:path.join(out,'screenshots',name+'.png')});
function contained(r,w,h){assert.ok(r.x>=0&&r.y>=0&&r.right<=w+1&&r.bottom<=h+1,JSON.stringify(r));}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={viewports:[],functional:[],returns:[],continuity:[],errors:[]};
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
  report.anchors=await page.evaluate(()=>import('../navigation/state.mjs').then(m=>m.ANCHORS));
  const a=report.anchors;
  for(const screen of [0,2,5.6,6.5,7.2]){await seek(page,screen);const s=await inspect(page);assert.ok(!s.visible&&s.inert&&s.menuInert);}
  await seek(page,a.hero);await shot(page,'a01-hero');
  await seek(page,a.space);assert.equal((await inspect(page)).stage,0);await shot(page,'a02-default');
  await open(page);const before=await inspect(page);await shot(page,'directory-open');
  await page.keyboard.press('Escape');let s=await inspect(page);assert.ok(s.menuHidden&&s.menuInert&&s.focus==='story-nav__toggle');assert.equal(s.screen,before.screen);
  const toggle=page.getByRole('button',{name:'章节目录',exact:true});
  await toggle.focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#story-directory a').first().evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('End');assert.equal(await page.locator('#story-directory a').last().evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await page.waitForTimeout(250);
  assert.equal((await inspect(page)).stage,1);assert.ok(Math.abs((await inspect(page)).screen-a.theme)<.01);await shot(page,'a03-poster');
  await open(page);await page.mouse.click(720,600);assert.ok((await inspect(page)).menuHidden);
  await open(page);await toggle.click();assert.ok((await inspect(page)).menuHidden);
  await toggle.evaluate(e=>{for(let i=0;i<20;i++)e.click();});assert.ok((await inspect(page)).menuHidden);
  await jump(page,'图像导读');await page.waitForFunction(()=>document.querySelector('.mural-guide[data-chapter="05"] img').naturalWidth>0);
  assert.ok(Math.abs((await inspect(page)).screen-a.guide)<.01);assert.equal((await inspect(page)).phase,'a05-introduction');assert.ok((await inspect(page)).menuHidden);await shot(page,'a05-intro');
  for(const [screen,name,stage] of [[23,'a05-scan',3],[25.9,'a06-intro',3],[32.9,'a07-intro',3],[38,'a07-scan',3],[42,'a08-final',3]]){
   await seek(page,screen);await page.waitForFunction(()=>[...document.querySelectorAll('.mural-guide')].filter(e=>!e.hidden).every(e=>e.querySelector('img').naturalWidth>0));assert.equal((await inspect(page)).stage,stage);await shot(page,name);
  }
  const image=await page.evaluate(()=>{window.__carry=document.querySelector('.mural-guide[data-chapter="07"] img');return performance.getEntriesByName(window.__carry.currentSrc).length;});
  await seek(page,39.4);await seek(page,42);assert.equal(await page.evaluate(()=>window.__carry===document.querySelector('.mural-guide[data-chapter="07"] img')),true);
  assert.equal(await page.evaluate(()=>performance.getEntriesByName(window.__carry.currentSrc).length),image);
  // New navigation leaves the existing A04 process and controls in ownership.
  await seek(page,a.space);await seek(page,14.5);await page.waitForFunction(()=>document.body.dataset.a04Mode==='playing');
  await open(page);const cameraBefore=await inspect(page);await page.waitForTimeout(150);await toggle.click();assert.equal((await inspect(page)).phase,'a04-playing');assert.equal((await inspect(page)).screen,cameraBefore.screen);
  assert.equal(await page.evaluate(async()=>{let n=0;const observer=new MutationObserver(changes=>n+=changes.length);observer.observe(document.querySelector('.story-nav'),{subtree:true,attributes:true,childList:true});await new Promise(resolve=>setTimeout(resolve,200));observer.disconnect();return n;}),0,'stable A04 playback must not rewrite navigation DOM each frame');
  await jump(page,'建筑空间');assert.ok(!(await inspect(page)).phase.startsWith('a04'));assert.equal(await page.evaluate(()=>document.body.dataset.a04Mode),undefined);
  await seek(page,14.5);await page.waitForFunction(()=>document.body.dataset.a04Mode==='playing');await jump(page,'图像导读');assert.equal((await inspect(page)).phase,'a05-introduction');
  await seek(page,14.5);if(await page.locator('[data-skip]').isVisible())await page.locator('[data-skip]').click();await page.waitForTimeout(200);assert.equal((await inspect(page)).phase,'a04-completed');await shot(page,'a04-summary');
  await page.locator('[data-replay]').click();await page.waitForTimeout(120);assert.equal((await inspect(page)).phase,'a04-playing');await page.locator('[data-skip]').click();
  for(let i=0;i<3;i++){await jump(page,'出兵·入将');await jump(page,'图像导读');await jump(page,'建筑空间');}
  await page.locator('.story-nav__brand').click();await page.waitForTimeout(250);s=await inspect(page);assert.ok(!s.visible&&s.inert);assert.ok(Math.abs(s.screen-a.hero)<.01);
  // Native wheel remains reversible after jumps and skipped content remains reachable.
  await seek(page,a.space);await jump(page,'图像导读');await page.mouse.wheel(0,-6000);await page.waitForTimeout(300);assert.ok((await inspect(page)).screen<a.guide);
  for(const [screen,expected] of [[42,3],[38,3],[26,3],[19,3],[14.5,2],[11.5,1],[8.5,0],[5.6,-1]]){await seek(page,screen);assert.equal((await inspect(page)).stage,expected);}
  report.functional=['A01/recenter hidden & inert','stable targets','phase-driven stages/reverse','toggle/outside/Escape/rapid clicks','arrow/Home/End/Enter','brand stable Hero','A04 play/leave/reenter/skip/replay','rapid chapter jumps','native reverse wheel','A07/A08 same image/request'];
  // Actual independent B document, with browser-native scroll restoration.
  for(const screen of [a.space,a.guide,42]){
   await seek(page,screen);await open(page);await page.locator('[data-exploration]').click();await page.waitForURL('http://localhost:3000/index.html');
   assert.ok((await page.locator('body').innerHTML()).length>1000);await page.goBack();await page.waitForFunction(()=>document.querySelector('.story-nav')&&document.querySelector('iframe').contentWindow.modelReady);await page.waitForTimeout(500);
   assert.ok(Math.abs((await inspect(page)).screen-screen)<.02);report.returns.push({source:screen,restored:(await inspect(page)).screen});
  }
  await seek(page,42);await page.locator('.a08 a').click();await page.waitForURL('http://localhost:3000/index.html');await page.goBack();await page.waitForFunction(()=>document.querySelector('.a08')&&!document.querySelector('.a08').hidden);await page.waitForTimeout(400);assert.ok(Math.abs((await inspect(page)).screen-42)<.02);
  report.functional.push('A08 CTA to real B and back');
  await page.route('http://localhost:3000/**',r=>r.abort('connectionrefused'));
  for(const entry of ['nav','cta']){
   if(entry==='nav'){await open(page);await page.locator('[data-exploration]').click();}else await page.locator('.a08 a').click();
   await page.waitForFunction(()=>!document.querySelector('.exploration-notice').hidden);assert.equal(page.url(),url);await page.getByRole('button',{name:'关闭',exact:true}).click();
  }
  report.functional.push('B unavailable: both entries stay in A with recovery');await page.unroute('http://localhost:3000/**');
  // Refresh and resize retain story position. No custom competing scroll state.
  for(const screen of [a.space,a.theme,a.guide,26,33,42]){await seek(page,screen);await page.reload();await page.waitForFunction(()=>document.querySelector('.story-nav'));await page.waitForTimeout(300);assert.ok(Math.abs((await inspect(page)).screen-screen)<.02);}
  await seek(page,23);await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(300);assert.ok(Math.abs((await inspect(page)).screen-23)<.02);
  report.functional.push('refresh/resize story restoration');await page.close();
  for(const [w,h] of [[1920,1080],[1440,900],[1366,768],[1024,768],[1440,650],[760,768],[390,844]]){
   const p=await browser.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);
   const rows=[];
   for(const screen of [a.space,a.theme,14.5,a.guide,23,25.9,32.9,38,42]){
    await seek(p,screen);s=await inspect(p);assert.ok(s.visible&&!s.inert&&!s.overflow);contained(s.brand,w,h);contained(s.tools,w,h);assert.ok(s.toggle.width>=44&&s.toggle.height>=44);
    const collision=await p.evaluate(()=>{
     const nav=document.querySelector('.story-nav'),brand=nav.querySelector('.story-nav__brand>span').getBoundingClientRect(),tools=nav.querySelector('.story-nav__tools').getBoundingClientRect();
     const intersects=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
     const visible=e=>e&&!e.closest('[hidden]')&&Number(getComputedStyle(e).opacity)>.5;
     const labels=[document.querySelector('.a02-kicker'),document.querySelector('.a02 h2'),document.querySelector('.a03-kicker'),document.querySelector('.a04-controls'),...document.querySelectorAll('.mural-guide__marker,.mural-guide__scan-marker')];
     const layout=nav.dataset.layout;
     const relevant=layout==='route'?labels.filter(e=>e?.className==='a04-controls'):layout==='guide'?labels.filter(e=>e?.className==='mural-guide__marker'):layout==='scan'?labels.filter(e=>e?.className==='mural-guide__scan-marker'):labels.filter(e=>e?.closest('.'+(document.body.dataset.phase.startsWith('a02')?'a02':'a03')));
     const textRect=e=>{if(e.className==='a04-controls')return e.getBoundingClientRect();const range=document.createRange();range.selectNodeContents(e);return range.getBoundingClientRect();};
     return relevant.filter(visible).filter(e=>intersects(brand,textRect(e))||intersects(tools,textRect(e))).map(e=>e.className);
    });assert.deepEqual(collision,[],`${w}x${h} screen ${screen}: collision`);
    rows.push({screen,phase:s.phase,layout:s.layout,brand:s.brand,tools:s.tools,collision});
   }
   await seek(p,a.theme);await open(p);s=await inspect(p);contained(s.menu,w,h);await shot(p,`nav-open-${w}x${h}`);
   // Tab reaches all links; closing removes them from sequential focus.
   await p.keyboard.press('Escape');assert.ok((await inspect(p)).menuInert);await p.locator('.story-nav__toggle').focus();await p.keyboard.press('Enter');await p.keyboard.press('Tab');assert.equal(await p.locator('#story-directory a').first().evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Escape');
   report.viewports.push({viewport:`${w}x${h}`,rows,menu:s.menu,touchTargets:true});await p.close();
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',hasTouch:true,isMobile:true});await reduced.goto(url);await seek(reduced,a.space);await reduced.locator('.story-nav__toggle').tap();await reduced.locator('[data-jump="guide"]').tap();await reduced.waitForTimeout(250);assert.equal((await inspect(reduced)).phase,'a05-introduction');
  await reduced.locator('.story-nav__brand').tap();await reduced.waitForTimeout(200);assert.ok(!(await inspect(reduced)).visible);await reduced.close();report.functional.push('390px touch + reduced motion');
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(report,null,2));console.log('PASS immersive navigation, 7 viewports, real B return, keyboard/touch/reduced motion');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
