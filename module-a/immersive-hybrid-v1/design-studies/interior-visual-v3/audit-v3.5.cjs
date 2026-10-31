const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path');
const out=path.resolve('docs/validation/interior-visual-v3-5');
fs.mkdirSync(path.join(out,'local'),{recursive:true});
async function state(p){return p.evaluate(()=>{let s=study.runtime.model.root;while(s.parent)s=s.parent;const walls=[];s.traverse(o=>{if(o.name.includes('real-')||o.name.includes('mural'))walls.push({name:o.name,visible:o.visible,image:o.material?.map?.image?.src,color:o.material?.color?.toArray()});});return{activeMural:study.activeMural,view:study.view,busy:study.busy,route:study.route32,rear:study.rear?.state,pose:study.runtime.model.pose,image:document.querySelector('#reading-image').currentSrc,walls};});}
async function settled(p){await p.waitForFunction(()=>study.ready&&!study.busy,null,{timeout:90000});}
async function shot(p,name){await p.screenshot({path:path.join(out,'local',name+'.png')});}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),report={errors:[],forward:[],reverse:[],second:[]};
try{p.on('pageerror',e=>report.errors.push(e.message));await p.goto('http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/v34.html');await settled(p);
 console.log('Ready',await p.evaluate(()=>({state:study.runtime.state,stops:study.runtime.stops})));
 for(let i=0;i<9&&await p.evaluate(()=>study.view!=='C');i++){await p.locator('#forward').click();await settled(p);console.log('Entrance',await p.evaluate(()=>({state:study.runtime.state,view:study.view})));}
 report.forward.push(await state(p));await shot(p,'before-first-reading');
 for(let index=1;index<=4;index++){
  await p.locator('#continue-tour').click();
  if(index===1){for(const [phase,threshold]of[['dark',0],['title',.2],['revealing',.55]]){await p.waitForFunction(t=>study.activeMural===1&&study.route32.progress===1&&study.route32.reveal>=t,threshold,{timeout:60000});report.second.push({phase,...await state(p)});await shot(p,'before-second-'+phase);}}
  await settled(p);await shot(p,'before-wall-'+index);report.forward.push(await state(p));console.log('Dock',index);
  await p.locator('#forward').click();await settled(p);await shot(p,'before-reading-'+index);
  await p.locator('#detail-open').click();await settled(p);await p.locator('#detail-return').click();await settled(p);await p.locator('#wall-return').click();await settled(p);await p.locator('#forward').click();await settled(p);
 }
 for(let index=3;index>=0;index--){await p.locator('#wall-return').click();await settled(p);await p.locator('#back').click();await settled(p);report.reverse.push(await state(p));await shot(p,'before-reverse-'+index);console.log('Reverse',index);if(index) {await p.locator('#forward').click();await settled(p);}}
 await p.evaluate(()=>study.seekRoute(1,{reveal:.25}));report.debug=await state(p);await shot(p,'before-debug-second');
}finally{fs.writeFileSync(path.join(out,'audit-baseline.json'),JSON.stringify(report,null,2));await c.close();await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
