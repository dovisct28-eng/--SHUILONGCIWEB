const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const baseline='33f3cfdd2a766c1673662666da07ad58c50be624';
const url=process.env.A04_ROOF_URL||'http://127.0.0.1:4173/module-a/a01/';
const out=path.resolve('docs/validation/a04-full-roof-2026-10-05');fs.mkdirSync(out,{recursive:true});
const oldFiles=new Map(['module-a/a03/cutaway.mjs','module-a/a04/cutaway-state.mjs','shuilong-temple/水龙祠-交互预览.html'].map(f=>[f,execFileSync('git',['show',baseline+':'+f],{maxBuffer:30*1024*1024})]));
const seek=async(p,n)=>{await p.evaluate(n=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;if(api)api._roofSnapshot=null;scrollTo(0,n*innerHeight)},n);await p.waitForTimeout(300);};
const capture=async(p,name)=>{const bytes=await p.screenshot();await sharp(bytes).webp({quality:90}).toFile(path.join(out,name+'.webp'));return bytes;};
const read=p=>p.evaluate(()=>{
  const f=document.querySelector('iframe'),api=f.contentWindow.shuilongTemple,root=api.getSharedWorldIdentity().root;
  const movie=api.getA03CutawayState().movie,min=[Infinity,Infinity],max=[-Infinity,-Infinity];let vertices=0,outside=0;
  root.getObjectByName('03_MainHall').traverse(m=>{
    if(!m.isMesh||m.material.userData.textureKey!=='roof')return;
    const positions=m.geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const v=m.position.clone().fromBufferAttribute(positions,i).applyMatrix4(m.matrixWorld),coords=[v.x,v.z];vertices++;
      coords.forEach((n,i)=>{min[i]=Math.min(min[i],n);max[i]=Math.max(max[i],n)});
      if(coords.some((n,i)=>Math.abs(n-movie.center[i])>movie.half[i]-.02))outside++;
    }
  });
  return {movie,roof:{vertices,outside,min,max},state:api.getA04State(),canvas:f.contentDocument.querySelectorAll('canvas').length,
    roofs:api.getRoofState().map(r=>({visible:r.visible,opacity:r.opacity,depthWrite:r.depthWrite})),overflow:document.documentElement.scrollWidth>innerWidth};
});
const pose=async(p,t,sampleTour)=>{
  const overview=await p.evaluate(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04Overview());
  const sample=sampleTour(t,overview);
  await p.evaluate(({sample,t})=>{const api=document.querySelector('iframe').contentWindow.shuilongTemple;
    // Keep deterministic captures stable when an async texture requests a parent render.
    if(!api._roofSetA04){api._roofSetA04=api.setA04;api.setA04=s=>api._roofSetA04(api._roofSnapshot||s);}
    api._roofSnapshot={...api.getA04State(),...sample,elapsed:t,entryProgress:1,routeComplete:t>=45,guideStartProgress:0,mode:'snapshot'};
    api.setA04(api._roofSnapshot);
  },{sample,t});await p.waitForTimeout(160);
};
const compare=async(a,b)=>{
  const x=await sharp(a).ensureAlpha().raw().toBuffer(),y=await sharp(b).ensureAlpha().raw().toBuffer();let changed=0;
  for(let i=0;i<x.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(x[i+c]-y[i+c])))>3)changed++;
  return changed/(x.length/4);
};
const compact=s=>({movie:s.movie,roof:s.roof,state:{mode:s.state.mode,elapsed:s.state.elapsed,storyTime:s.state.storyTime,routeComplete:s.state.routeComplete,guideStartProgress:s.state.guideStartProgress},canvas:s.canvas,roofFlags:{count:s.roofs.length,allVisibleOpaqueWithDepth:s.roofs.every(r=>r.visible&&r.opacity===1&&r.depthWrite)},overflow:s.overflow});
(async()=>{
  const {sampleTour}=await import('./path.mjs'),browser=await chromium.launch({channel:'chrome',headless:true}),rows=[],errors=[];
  const open=async(w,h,old=false)=>{
    const p=await browser.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    await p.route('**/*',r=>{const f=decodeURIComponent(new URL(r.request().url()).pathname).slice(1),body=old&&oldFiles.get(f);
      if(f==='favicon.ico')return r.fulfill({status:204,body:''});
      return body?r.fulfill({body,contentType:f.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8'}):r.continue();
    });
    await p.goto(url);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(400);return p;
  };
  try{
    for(const[w,h]of [[1920,1080],[1440,900],[1366,768],[1024,768],[780,614]]){
      const old=await open(w,h,true),p=await open(w,h);
      await seek(old,12.15);await seek(p,12.15);await p.evaluate(()=>document.fonts.ready);await old.evaluate(()=>document.fonts.ready);
      const posterDifference=await compare(await old.screenshot(),await p.screenshot());assert.ok(posterDifference<.0001,'A03 stable poster unchanged');
      for(const page of [old,p]){await seek(page,14.5);await page.locator('[data-skip]').click();await page.waitForTimeout(600);await pose(page,0,sampleTour);}
      const before=await read(old),after=await read(p);assert.ok(before.roof.outside>0);assert.equal(after.roof.outside,0,'Every main-hall roof vertex inside complete cut');
      assert.equal(after.movie.summary,0);assert.equal(after.movie.weight,1);assert.equal(after.canvas,1);assert.equal(after.overflow,false);
      await capture(old,w+'-before');await capture(p,w+'-after');
      const states=[];
      for(const t of [6,8,9,10,20,34,39,45]){
        await pose(p,t,sampleTour);const s=await read(p);assert.equal(s.canvas,1);
        if(t<=8){assert.equal(s.roof.outside,0,JSON.stringify({t,movie:s.movie,state:s.state}));assert.equal(s.movie.summary,0,JSON.stringify({t,movie:s.movie,state:s.state}));}
        if(t===45){assert.equal(s.movie.summary,1);assert.ok(s.roofs.every(r=>r.visible&&r.opacity===1&&r.depthWrite));}
        states.push({time:t,...s});if([6,10,20,45].includes(t))await capture(p,w+'-time-'+t);
      }
      for(const point of [16,16.5,17.2,16,12.15,14.5]){
        await seek(p,point);const s=await read(p);
        if(point>=16&&point<=17.2){if(point===16)assert.equal(s.movie.summary,1);if(point===17.2)assert.equal(s.roof.outside,0);}
      }
      await p.emulateMedia({reducedMotion:'reduce'});await seek(p,14.5);assert.equal((await read(p)).movie.summary,1);
      await seek(p,17.2);assert.equal((await read(p)).roof.outside,0);
      await seek(p,14.5);await p.reload();await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForTimeout(350);assert.equal((await read(p)).movie.summary,1);
      rows.push({viewport:[w,h],posterDifference,before,after,states,reverse:true,reducedMotion:true,refresh:true});
      await old.close();await p.close();console.log(w+' full roof / movement / summary / A03 regression PASS');
    }
    const actual=await open(780,614);await seek(actual,14.5);await capture(actual,'actual-entry');
    await actual.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.elapsed>=6,{},{timeout:15000});
    const playing=await read(actual);assert.equal(playing.state.mode,'playing');assert.equal(playing.roof.outside,0);assert.equal(playing.movie.wallWeight,0);
    await capture(actual,'actual-fifth');console.log('Live fifth stop PASS; checking natural completion.');
    await actual.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getA04State()?.mode==='completed',{},{timeout:60000});
    const completed=await read(actual);assert.equal(completed.movie.summary,1);assert.ok(completed.roofs.every(r=>r.visible&&r.opacity===1&&r.depthWrite));await capture(actual,'actual-summary');
    await actual.locator('[data-replay]').click();await actual.waitForTimeout(200);await actual.locator('[data-skip]').click();await actual.waitForTimeout(300);assert.equal((await read(actual)).movie.summary,1);await actual.close();
    const reportRows=rows.map(({before,after,states,...checks})=>({...checks,before:compact(before),after:compact(after),states:states.map(({time,...s})=>({time,...compact(s)}))}));
    assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({baseline,browser:browser.version(),rows:reportRows,actualPlayback:compact(playing),naturalCompletion:compact(completed),errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
