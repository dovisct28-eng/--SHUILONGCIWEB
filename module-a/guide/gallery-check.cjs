const {chromium}=require('playwright');
const sharp=require('sharp');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out=path.resolve('docs/validation/a05-a08-refinement-2026-10-06');
const url='http://127.0.0.1:4175/module-a/a01/';
const sizes=process.env.GALLERY_VIEWPORTS?JSON.parse(process.env.GALLERY_VIEWPORTS):[[1440,900],[1920,1080],[1366,768],[1024,768]];
async function seek(page,point){
  await page.evaluate(p=>scrollTo(0,p*innerHeight),point);
  await page.waitForTimeout(180);
  if(point>=17.4) await page.waitForFunction(()=>[...document.querySelectorAll('.mural-guide')].filter(g=>!g.hidden).every(g=>g.querySelector('img').naturalWidth>0));
  await page.evaluate(()=>document.fonts.ready);
  // Read a committed scroll render, including reverse seeks under GPU contention.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
async function read(page){return page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const css=e=>getComputedStyle(e);
  const guides=[...document.querySelectorAll('.mural-guide')].filter(g=>!g.hidden).map(g=>{
    const image=g.querySelector('img'),head=g.querySelector('header'),h2=g.querySelector('h2');
    return {chapter:g.dataset.chapter,phase:g.dataset.phase,opacity:+css(g).opacity,scan:+g.dataset.scanProgress,stage:+g.dataset.introStage,expand:+g.dataset.galleryExpand,
      image:box(image),nativeWidth:parseFloat(image.style.width),nativeHeight:parseFloat(image.style.height),ratio:image.naturalWidth/image.naturalHeight,src:image.currentSrc,transform:image.style.transform,filter:css(image).filter,shadow:css(image).boxShadow,border:css(image).borderWidth,
      canvasClip:css(g.querySelector('.mural-guide__canvas')).clipPath,canvas:box(g.querySelector('.mural-guide__canvas')),background:css(g).backgroundColor,
      intro:+css(head).opacity,veil:+css(g.querySelector('.mural-guide__veil')).opacity,headline:{box:box(h2),opacity:+css(h2).opacity,size:css(h2).fontSize},
      marker:{text:g.querySelector('.mural-guide__marker').textContent,size:css(g.querySelector('.mural-guide__marker')).fontSize},
      subtitle:{box:box(g.querySelector('.mural-guide__subtitle')),size:css(g.querySelector('.mural-guide__subtitle')).fontSize},
      axis:box(g.querySelector('.mural-guide__axis')),axisOpacity:+css(g.querySelector('.mural-guide__axis')).opacity,rail:box(g.querySelector('.mural-guide__rail')),point:box(g.querySelector('.mural-guide__rail b')),
      layers:[...g.querySelectorAll('.mural-guide__reading')].map(l=>({opacity:+css(l).opacity,box:box(l),text:l.textContent,scroll:css(l).overflowY,role:l.dataset.readingRole,
        paragraphs:[...l.querySelectorAll('p')].map(p=>({role:p.dataset.typeRole,size:css(p).fontSize,font:css(p).fontFamily,box:box(p)}))}))};
  });
  const a08=document.querySelector('.a08'),link=a08.querySelector('a'),ambient=document.querySelector('.gallery-ambient');
  return {screen:scrollY/innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,guides,
    a08:{hidden:a08.hidden,opacity:+css(a08).opacity,ctaOpacity:+css(link).opacity,inert:a08.inert,background:css(a08).backgroundImage,panel:box(a08.querySelector('.a08__panel')),cta:box(link),href:link.href,tabIndex:link.tabIndex},
    ambient:{count:document.querySelectorAll('.gallery-ambient').length,hidden:ambient.hidden,weight:+css(ambient).getPropertyValue('--ambient-weight'),opacity:+css(ambient).opacity,src:[...ambient.querySelectorAll('img')].map(i=>i.currentSrc)},
    canvases:document.querySelector('iframe').contentDocument.querySelectorAll('canvas').length};
});}
async function shot(page,name,tag,folder='after'){
  const file=path.join(out,folder,`${name}-${tag}.webp`);fs.mkdirSync(path.dirname(file),{recursive:true});
  await sharp(await page.screenshot()).webp({quality:91}).toFile(file);return file;
}
async function contrast(page,selector){
  const el=page.locator(selector),data=await el.evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,color:getComputedStyle(e).color.match(/[\d.]+/g).slice(0,3).map(Number)}});
  await el.evaluate(e=>e.style.visibility='hidden');const {data:pixels,info}=await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({resolveWithObject:true});await el.evaluate(e=>e.style.visibility='');
  const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),a=lum(data.color);let minimum=100;
  for(let y=Math.ceil(data.y+4);y<Math.min(info.height,data.y+data.h-4);y+=4)for(let x=Math.ceil(data.x+2);x<Math.min(info.width,data.x+data.w-2);x+=4){const i=(y*info.width+x)*info.channels,b=lum([...pixels.subarray(i,i+3)]);minimum=Math.min(minimum,(Math.max(a,b)+.05)/(Math.min(a,b)+.05));}return minimum;
}
const close=(a,b,message,tolerance=1)=>assert.ok(Math.abs(a-b)<tolerance,`${message}: ${a} / ${b}`);
function check(state,scene,w,h,reduced=false){
  assert.equal(state.overflow,false,scene.name);assert.equal(state.canvases,1);assert.equal(state.ambient.count,1);
  for(const g of state.guides){
    assert.equal(g.filter,'none');assert.equal(g.shadow,'none');assert.equal(g.border,'0px');assert.equal(g.veil,0);assert.equal(g.canvasClip,'none');assert.equal(g.background,'rgba(0, 0, 0, 0)');
    assert.equal(g.marker.size,'13px');assert.ok(g.marker.text.startsWith('A'));assert.ok(g.image.width>0);
    if(scene.point>=18) close(g.nativeWidth/g.nativeHeight,g.ratio,'native ratio',.001);
    if(g.intro>.99){
      assert.ok(g.image.x>=0&&g.image.right<=w+1,'complete original visible');close(g.image.x,w-g.image.right,'balanced gutters');
      assert.ok(g.headline.box.bottom<g.image.y-16&&g.subtitle.box.bottom<g.image.y-16,'identity above mural');
      for(const l of g.layers.filter(l=>l.opacity>.99)){
        assert.ok(l.box.x>g.headline.box.right,'separate right column');
        assert.ok(l.box.bottom<g.image.y-16,`${scene.name}: reading clears mural ${JSON.stringify(l.box)}`);
        assert.notEqual(l.scroll,'auto');assert.ok(l.box.right<=w-20);
        for(const p of l.paragraphs)assert.ok(p.box.right<=w-20);
      }
      if(g.stage>0)close(g.headline.opacity,.82,'headline de-emphasis',.001);
    }
    if(g.phase==='scan'){
      assert.equal(g.intro,0);assert.equal(g.expand,1);assert.match(g.transform,/^translate3d\(/);
      close(g.image.height/h,reduced?.82:w<=1100?.86:.88,'scan height',.001);
      assert.ok(g.axis.bottom<=h&&g.axis.y>=g.image.bottom,'axis outside original');
    }
  }
  const g=state.guides.at(-1);
  if(scene.name.endsWith('-right')){close(g.image.right,w,'right edge');assert.equal(g.scan,0);close(g.point.x+g.point.width/2,g.rail.right,'axis right');}
  if(scene.name.endsWith('-left')){close(g.image.x,0,'left edge');assert.equal(g.scan,1);close(g.point.x+g.point.width/2,g.rail.x,'axis left');}
  if(scene.point>=40){
    close(g.canvas.x,0,'A08 left-end anchor');assert.ok(g.nativeHeight>=h*.82,'giant wall scale');
    assert.equal(state.a08.background,'none');assert.equal(g.axisOpacity,0);
    if(state.a08.opacity>0)assert.ok(g.canvas.right<state.a08.panel.x-12,'type is outside the aperture');
    if(scene.point>=41.23){close(g.canvas.width,w*(w<=1100?.68:.72),'A08 visible aperture width');assert.ok(state.a08.cta.height>=44&&!state.a08.inert&&state.a08.tabIndex===0);assert.ok(state.a08.panel.bottom<h);}
    else if(state.a08.ctaOpacity<.8)assert.equal(state.a08.inert,true);
  }
}
async function board(files,target,columns=2){
  const tileW=640,tileH=422,tiles=[];
  for(const [i,file]of files.entries())tiles.push({input:await sharp(file).resize(tileW,400,{fit:'contain',background:'#10191f'}).toBuffer(),left:i%columns*tileW,top:Math.floor(i/columns)*tileH});
  await sharp({create:{width:columns*tileW,height:Math.ceil(files.length/columns)*tileH,channels:3,background:'#10191f'}}).composite(tiles).webp({quality:89}).toFile(target);
}
(async()=>{
 const guides=await Promise.all(['05','06','07'].map(async id=>(await import(`../a${id}/content.mjs`))[`a${id}Guide`]));
 const scenes=[{name:'a04-wall',point:17.6},{name:'a05-transfer',point:17.8}];
 for(const guide of guides){
   const weights=[1,...guide.introBeats.map(b=>b.weight)],total=weights.reduce((a,b)=>a+b,0),length=guide.introLength||3.2;let boundary=0;
   for(let i=0;i<weights.length;i++){
     const point=i===0?guide.start+.85:guide.start+.55+(boundary+weights[i]/2)/total*(length-1.1);
     scenes.push({name:`a${guide.chapter}-${i===0?'opening':guide.introBeats[i-1].role}`,point});boundary+=weights[i];
   }
   scenes.push({name:`a${guide.chapter}-middle-reading`,point:guide.start+.55+.5*(length-1.1)},{name:`a${guide.chapter}-text-exit`,point:guide.start+length-.48},{name:`a${guide.chapter}-expand-half`,point:guide.start+length-.2},
     {name:`a${guide.chapter}-right`,point:guide.start+length},{name:`a${guide.chapter}-center`,point:(guide.start+length+guide.end-.6)/2},
     {name:`a${guide.chapter}-left`,point:guide.end-.6});
 }
 scenes.push({name:'a08-transition-25',point:40.1625},{name:'a08-transition-75',point:40.4875},{name:'a08-wall-stable',point:40.65},{name:'a08-transition-50',point:40.325},{name:'a08-half',point:40.5},{name:'a08-text-enter',point:40.825},{name:'a08-stable',point:42});
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});
 const report={scenes,sizes:[],resize:[],refresh:[],reduced:[],fontFallback:[],short:[],narrow:[],debug:[],errors:[]};
 try{
  for(const [width,height]of sizes){
   const page=await browser.newPage({viewport:{width,height}}),tag=`${width}x${height}`,requests=[];
   page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>requests.push(r.url()));
   await page.goto(url);assert.equal(await page.locator('[data-debug]').isVisible(),false,'normal viewer has no debug box');await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
   await seek(page,14.5);await page.locator('[data-skip]').click();const rows=[];
   for(const scene of scenes){
     await seek(page,scene.point);const state=await read(page);check(state,scene,width,height);
     if(width===1440&&state.guides.at(-1)?.stage>0&&state.guides.at(-1)?.intro>.99){const g=state.guides.at(-1),i=g.layers.findIndex(l=>l.opacity>.99);if(i>=0){state.readingContrast=await contrast(page,`.mural-guide[data-chapter="${g.chapter}"] .mural-guide__reading:nth-child(${i+1}) p:last-child`);assert.ok(state.readingContrast>=4.5,'reading text contrast');}}
     const file=await shot(page,scene.name,tag,width===1440?'after':'responsive');rows.push({name:scene.name,state,file});
   }
   const opening=rows.filter(r=>r.name.endsWith('-opening')).map(r=>r.state.guides.at(-1));
   for(const g of opening){assert.equal(g.headline.size,opening[0].headline.size);assert.equal(g.subtitle.size,opening[0].subtitle.size);}
   for(const guide of guides){
     const text=await page.locator(`.mural-guide[data-chapter="${guide.chapter}"] .mural-guide__description`).textContent();
     assert.equal(text.replace(/\s/g,''),guide.introduction.replace(/\s/g,''),'verbatim original copy');
   }
   const textContrast={body:await contrast(page,'.a08__body p:last-child'),cta:await contrast(page,'.a08 a')};
   assert.ok(textContrast.body>=4.5&&textContrast.cta>=4.5,JSON.stringify(textContrast));
   await page.locator('.a08 a').hover();await page.waitForTimeout(230);await shot(page,'a08-hover',tag,width===1440?'after':'responsive');
   await page.mouse.move(2,2);await page.keyboard.press('Tab');await page.locator('.a08 a').focus();
   assert.ok(await page.locator('.a08 a').evaluate(e=>e.matches(':focus-visible')));assert.equal(await page.locator('.a08 a').evaluate(e=>getComputedStyle(e).outlineWidth),'2px');
   await shot(page,'a08-focus',tag,width===1440?'after':'responsive');
   for(const scene of [...scenes].reverse()){
     await seek(page,scene.point);const current=await read(page),previous=rows.find(r=>r.name===scene.name).state;
     for(const g of current.guides){const old=previous.guides.find(o=>o.chapter===g.chapter);assert.equal(g.stage,old.stage);close(g.image.x,old.image.x,`reverse x ${scene.name} A${g.chapter} screen ${current.screen}`);close(g.image.width,old.image.width,`reverse width ${scene.name}`);}
     if(scene.point<40)assert.equal(current.a08.hidden,true);
   }
   for(const point of [22.8,29.8,37.8]){await seek(page,point);const before=await read(page);await page.waitForTimeout(250);assert.deepEqual((await read(page)).guides.map(g=>g.image),before.guides.map(g=>g.image));}
   if(width===1440){
     for(const point of [18.85,22.8,25.85,29.8,32.85,39.4,42]){
       await seek(page,point);const before=await read(page);await page.reload();await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
       await page.waitForFunction(()=>[...document.querySelectorAll('.mural-guide')].filter(g=>!g.hidden).every(g=>g.querySelector('img').naturalWidth>0));await page.waitForTimeout(180);
       const after=await read(page);close(after.screen,before.screen,'reload screen',.002);assert.deepEqual(after.guides.map(g=>[g.stage,g.image]),before.guides.map(g=>[g.stage,g.image]));report.refresh.push(point);
     }
     for(const point of [17.6,18.85,20.3,21,22.8,25.2,34.5,37.8,40.325,42]){
       await seek(page,point);const before=await read(page);await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(250);const small=await read(page);
       close(small.screen,point,'resize screen',.002);assert.deepEqual(small.guides.map(g=>[g.chapter,g.stage]),before.guides.map(g=>[g.chapter,g.stage]));
       await page.setViewportSize({width,height});await page.waitForTimeout(250);const after=await read(page);
       for(let i=0;i<after.guides.length;i++){close(after.guides[i].image.x,before.guides[i].image.x,'resize restore x',3);close(after.guides[i].image.width,before.guides[i].image.width,'resize restore width',3);}report.resize.push(point);
     }
     await seek(page,22.8);const start=(await read(page)).guides[0].image.x;await page.mouse.wheel(0,300);await page.waitForTimeout(250);assert.ok((await read(page)).guides[0].image.x>start);
     await page.mouse.wheel(0,-300);await page.waitForTimeout(250);close((await read(page)).guides[0].image.x,start,'native wheel reverse',2);
     await seek(page,42);await page.locator('.a08 a').click();await page.waitForURL('http://localhost:3000/index.html');await page.waitForSelector('canvas',{state:'attached'});
     await page.goBack();await page.waitForFunction(()=>!document.querySelector('.a08').hidden&&document.querySelector('iframe')?.contentWindow?.modelReady);close((await read(page)).screen,42,'actual B return',.02);
   }
   assert.equal(requests.filter(u=>/detail\.webp/.test(u)).length,0);
   const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/karst-valley|mural-02-display/.test(r.name)).map(r=>({url:r.name,transfer:r.transferSize})));
   report.sizes.push({tag,rows,textContrast,resources,reverse:true,stopStable:true});
   fs.writeFileSync(path.join(out,'gallery-results.json'),JSON.stringify(report,null,2));await page.close();console.log('gallery '+tag+' PASS');
  }
  for(const mode of ['reduced','fontFallback','short']){
   const width=mode==='short'?1440:1024,height=mode==='short'?650:768,page=await browser.newPage({viewport:{width,height},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
   if(mode==='fontFallback')await page.route('**/*.woff2',r=>r.abort());await page.goto(url);await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
   for(const scene of scenes.filter(s=>s.point>=18&&!s.name.includes('expand'))){await seek(page,scene.point);const state=await read(page);check(state,scene,width,height,mode==='reduced');report[mode].push(scene.name);}
   await shot(page,mode,`${width}x${height}`,'responsive');await page.close();console.log(mode+' PASS');
  }
  for(const [width,height]of [[390,844],[760,768]]){
    const page=await browser.newPage({viewport:{width,height}});await page.goto(url);await page.waitForFunction(()=>document.querySelector('iframe')?.contentWindow?.modelReady);
    for(const scene of scenes.filter(s=>s.point>=18)){
      await seek(page,scene.point);const state=await read(page);assert.equal(state.overflow,false);
      const g=state.guides.at(-1);if(g.intro>.99){
        assert.ok(g.subtitle.box.bottom<g.image.y-16);
        for(const l of g.layers.filter(l=>l.opacity>.99)){assert.ok(l.box.y>=g.subtitle.box.bottom+10);assert.ok(l.box.bottom<g.image.y-16);assert.ok(l.box.right<=width);}
      }
      if(scene.point>=41.23){assert.ok(g.canvas.bottom<state.a08.panel.y-10);assert.ok(state.a08.panel.bottom<=height);assert.ok(state.a08.cta.height>=44&&!state.a08.inert);assert.ok(g.nativeWidth>g.canvas.width);}
      if(/opening|lead|arrival|stable/.test(scene.name))await shot(page,scene.name,width+'x'+height,'narrow');
    }
    report.narrow.push({width,height,pass:true});await page.close();console.log('narrow '+width+' PASS');
  }
  const debugPage=await browser.newPage();await debugPage.goto(url+'?debug');await debugPage.waitForFunction(()=>document.querySelector('[data-debug]').textContent.includes('A01'));assert.equal(await debugPage.locator('[data-debug]').isVisible(),true);report.debug={normalHidden:true,optInVisible:true};await debugPage.close();
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'gallery-results.json'),JSON.stringify(report,null,2));
  const primary=report.sizes.find(s=>s.tag==='1440x900');
  if(primary){
    fs.mkdirSync(path.join(out,'comparison'),{recursive:true});
    await board(primary.rows.filter(r=>/opening|center|stable/.test(r.name)).map(r=>r.file),path.join(out,'comparison','editorial-and-scan.webp'));
    const pairs=[];for(const name of ['a05-opening','a07-opening']){pairs.push(path.resolve('docs/validation/a05-a08-editorial-2026-10-06/before',name+'.webp'),primary.rows.find(r=>r.name===name).file);}pairs.push(path.resolve('docs/validation/a05-a08-editorial-2026-10-06/before/a08.webp'),primary.rows.find(r=>r.name==='a08-stable').file);
    await board(pairs,path.join(out,'comparison','before-after.webp'));
  }
  console.log('PASS: full originals, editorial bounds, shared typography, sequential expansion/scan, A08 real space, native wheel, reverse, reload, resize, actual B return, reduced motion, fallback, short screen');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
