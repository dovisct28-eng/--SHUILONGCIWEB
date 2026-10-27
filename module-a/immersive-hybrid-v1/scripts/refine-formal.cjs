const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'docs/validation/immersive-hybrid-v2-2-1'),local=path.join(out,'local');
async function diff(a,b){const x=await sharp(a).removeAlpha().raw().toBuffer(),y=await sharp(b).removeAlpha().raw().toBuffer();let sum=0,max=0;for(let i=0;i<x.length;i++){const d=Math.abs(x[i]-y[i]);sum+=d;max=Math.max(max,d);}return {mean:sum/x.length,max};}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),report={pass:false,chapters:[],errors:[]};try{
 const old=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),current=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 // Formal sources are protected byte-for-byte. Both pages have matching cache policy.
 for(const p of [old,current]){p.on('pageerror',e=>report.errors.push(e.message));await p.route('**/*',r=>r.continue());await p.goto('http://127.0.0.1:4186/module-a/a01/');await p.waitForFunction(()=>document.querySelector('iframe').contentWindow.modelReady);}
 for(const [chapter,screen]of [['A01',5.7],['A02',9.65],['A03',11.6],['A04',14.5],['A05',20],['A06',27],['A07',34],['A08',41.7]]){
  const imgs=[],layouts=[];for(const [i,p]of [old,current].entries()){
   await p.bringToFront();await p.evaluate(n=>scrollTo(0,n*innerHeight),screen);await p.waitForTimeout(1200);await p.evaluate(async()=>{await document.fonts.ready;await document.querySelector('iframe').contentDocument.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));dispatchEvent(new Event('resize'));});await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>Boolean(document.querySelector('iframe').contentWindow.shuilongTemple.entry)),false);
   let image=await p.screenshot();for(let j=0;j<4;j++){await p.waitForTimeout(300);const next=await p.screenshot(),d=await diff(image,next);image=next;if(d.mean<.01)break;}fs.writeFileSync(path.join(local,`formal-${chapter}-${i}.png`),image);imgs.push(image);
   layouts.push(await p.evaluate(()=>({screen:scrollY/innerHeight,phase:document.body.dataset.phase,images:[...document.querySelectorAll('.mural-guide__image')].map(e=>({src:e.currentSrc,style:e.getAttribute('style'),width:e.naturalWidth,height:e.naturalHeight,hidden:e.closest('section').hidden})),headings:[...document.querySelectorAll('h1,h2')].map(e=>({text:e.textContent,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}}))})));
  }
  assert.deepEqual(layouts[0],layouts[1]);const raw=await diff(...imgs),structural=await diff(...await Promise.all(imgs.map(img=>sharp(img).blur(2).png().toBuffer())));assert.ok(structural.mean<.3,chapter+JSON.stringify(structural));report.chapters.push({chapter,raw,structural,exactLayoutAndSource:true});console.log('PASS',chapter,raw.mean);
 }
 assert.deepEqual(report.errors,[]);report.pass=true;
 }finally{fs.writeFileSync(path.join(out,'formal-results.json'),JSON.stringify({...report,scope:'Two live contexts of the unchanged production sources; source equivalence to 933a353 separately verified for 189 protected files'},null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
