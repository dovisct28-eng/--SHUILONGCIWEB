const {chromium}=require('playwright'),{PNG}=require('pngjs'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const out=path.resolve('docs/validation/module-a-navigation-2026-10-06'),baseline='20e6cd6deadf73e0c4532205babafe3d48b177f9';
const points=[['hero',5.6],['a01-a02-start',6.2],['recenter',6.7],['a02',7.5],['a02-end',10.2],['a02-a03',10.7],['a03',11.2],['a03-exit',12.9],['a04-entry',13.3],['a04',14.5],['a04-summary',16],['projection',17.65],['a05-entry',18],['a05',18.8],['a05-scan',23],['a05-end',24.95],['a05-a06',25.2],['a06',25.9],['a06-end',31.95],['a06-a07',32.2],['a07',32.9],['a07-scan',38],['a07-a08',40.3],['a08-copy',41],['a08',42]];
const seek=async(p,s)=>{await p.evaluate(s=>scrollTo(0,s*innerHeight),s);await p.waitForTimeout(250);};
(async()=>{
 fs.mkdirSync(path.join(out,'comparison'),{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true}),report={baseline,frames:[]},old=new Map();
 try{
  for(const mode of ['before','after']){
   const p=await b.newPage({viewport:{width:1440,height:900}});
   if(mode==='before'){const body=execFileSync('git',['show',baseline+':module-a/a01/app.mjs']);await p.route('**/module-a/a01/app.mjs',r=>r.fulfill({body,contentType:'text/javascript'}));}
   await p.goto('http://127.0.0.1:4175/module-a/a01/');await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.shuilongTemple.getArchitectureState().every(m=>m.clonesLoaded));
   for(const [name,screen] of points){
    if(screen>13.202&&screen<18){await seek(p,19);await p.waitForFunction(()=>document.querySelector('.mural-guide[data-chapter="05"] img').naturalWidth>0);}
    await seek(p,screen);
    await p.evaluate(async()=>{await document.fonts.ready;await document.querySelector('iframe').contentDocument.fonts.ready;await Promise.all([...document.images].filter(i=>i.src).map(i=>i.decode().catch(()=>{})));});
    const phase=await p.evaluate(()=>document.body.dataset.phase);
    const actual=await p.screenshot();
    await sharp(actual).webp({quality:88}).toFile(path.join(out,'comparison',`${name}-${mode}.webp`));
    if(mode==='before'){
     // User review explicitly moves the existing handoff labels. Preserve the
     // actual screenshot above, but omit only those labels in the pixel proof.
     await p.locator('.mural-guide__next').evaluateAll(els=>els.forEach(e=>e.style.visibility='hidden'));
     old.set(name,{bytes:await p.screenshot(),phase});
     await p.locator('.mural-guide__next').evaluateAll(els=>els.forEach(e=>e.style.removeProperty('visibility')));
    }
    else{
     // Compare the underlying picture, excluding navigation and the authorized handoff labels.
     await p.locator('.story-nav').evaluate(e=>e.style.visibility='hidden');
     await p.locator('.mural-guide__next').evaluateAll(els=>els.forEach(e=>e.style.visibility='hidden'));
     const withoutNav=await p.screenshot();await p.locator('.story-nav').evaluate(e=>e.style.removeProperty('visibility'));
     await p.locator('.mural-guide__next').evaluateAll(els=>els.forEach(e=>e.style.removeProperty('visibility')));
     const a=PNG.sync.read(old.get(name).bytes),c=PNG.sync.read(withoutNav);let changed=0,significant=0,max=0;
     for(let i=0;i<a.data.length;i+=4){const d=Math.max(...[0,1,2].map(j=>Math.abs(a.data[i+j]-c.data[i+j])));if(d)changed++;if(d>4)significant++;max=Math.max(max,d);}
     assert.equal(phase,old.get(name).phase,`${name} phase mismatch`);
     // Preserve strict pixel evidence; allow known low-bit WebGL quantization.
     assert.ok(significant/(a.width*a.height)<.001,`${name}: unexpected underlying picture difference ${significant}`);
     report.frames.push({name,screen,phase,changedFraction:changed/(a.width*a.height),significantFraction:significant/(a.width*a.height),maxDelta:max});
    }
   }
   // Reverse checks retain the same controller-selected phases and loaded murals.
   for(const [name,screen] of [...points].reverse()){await seek(p,screen);if(screen>=18)assert.ok(await p.evaluate(()=>[...document.querySelectorAll('.mural-guide')].filter(e=>!e.hidden).every(e=>e.querySelector('img').naturalWidth>0)),name+' blank mural on reverse');}
   await p.close();console.log(mode+' continuity captured');
  }
  report.limit='1440×900 same host Chrome. Baseline app served from Git; identical protected chapter sources and assets. A04 sampled in completed state for deterministic camera comparison; real automatic play separately tested. Pixel proof omits only new navigation and the handoff label elements explicitly moved by user review; actual screenshots retain both. Permits <0.1% pixels over 4/255 quantization; actual maxima recorded. Label visibility/copy/geometry separately checked.';
  fs.writeFileSync(path.join(out,'comparison-results.json'),JSON.stringify(report,null,2));
  console.log('PASS 25 forward boundary/stable comparisons and reverse mural checks');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
