const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const base='http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/',out=path.resolve('docs/validation/interior-visual-v3-label-cleanup');
for(const dir of ['local','selected'])fs.mkdirSync(path.join(out,dir),{recursive:true});
const forbidden=/DEV_ONLY_NOTE|现场测绘|未裁切|位置提示|配准|原图比例|尺度|模型候选墙位|现场资料核对/;
async function settled(p){await p.waitForFunction(()=>window.study?.ready&&!study.busy,null,{timeout:90000});}
async function audienceClean(p){for(const selector of ['#reading','#detail','#spatial','#message'])assert.doesNotMatch(await p.locator(selector).innerText(),forbidden,selector);assert.equal(await p.locator('.reading-copy').count(),0);assert.deepEqual(await p.locator('.reading-head dt').allTextContents(),['位置']);}
async function screenshot(p,name,keep){const buf=await p.screenshot();fs.writeFileSync(path.join(out,'local',name+'.png'),buf);if(keep)await sharp(buf).webp({quality:88}).toFile(path.join(out,'selected',name+'.webp'));}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),report={runs:[],pass:false};try{
for(const [width,height,reduced]of [[1440,900,true],[1920,1080,true],[1366,768,true],[1440,900,false]]){
const p=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
// Poison only the internal note: any future rebinding will fail the audience check.
await p.route('**/interior-visual-v3/murals.json',async r=>{const data=await(await r.fetch()).json();for(const m of data)m.note='DEV_ONLY_NOTE '+m.note;await r.fulfill({json:data});});
await p.goto(base,{waitUntil:'domcontentloaded'});await settled(p);assert.ok((await p.evaluate(()=>study.murals)).every(x=>x.note.startsWith('DEV_ONLY_NOTE')));
await p.evaluate(()=>study.navigate('C'));await settled(p);const murals=[];
for(let i=0;i<5;i++){
if(i){await p.locator('#continue-tour').click();await settled(p);assert.equal(await p.evaluate(()=>study.activeMural),i);assert.equal(await p.evaluate(()=>study.view),'B');await p.locator('#forward').click();await settled(p);}
assert.equal(await p.evaluate(()=>study.view),'C');await audienceClean(p);
const image=await p.locator('#reading-image').evaluate(img=>({w:img.naturalWidth,h:img.naturalHeight,fit:getComputedStyle(img).objectFit}));assert.equal(image.fit,'contain');assert.ok(image.w>0&&image.h>0);
for(const sel of ['#reading-image','.reading-head','.reading-foot','#wall-return','#continue-tour']){const r=await p.locator(sel).boundingBox();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,sel+' outside viewport');}
await screenshot(p,`full-${i+1}-${width}-${reduced}`,width===1440&&reduced&&(i===0||i===3));
await p.locator('#detail-open').click();await settled(p);assert.equal(await p.evaluate(()=>study.view),'D');await audienceClean(p);await p.locator('#detail-viewport').press('+');assert.equal(await p.locator('#zoom-value').innerText(),'125%');
await p.locator('#detail-viewport').press('0');for(let z=0;z<4;z++)await p.locator('#zoom-in').click();await p.waitForTimeout(reduced?50:700);const before=await p.evaluate(()=>study.detail),vp=await p.locator('#detail-viewport').boundingBox();await p.mouse.move(vp.x+vp.width/2,vp.y+vp.height/2);await p.mouse.down();await p.mouse.move(vp.x+vp.width/2+45,vp.y+vp.height/2+35);await p.mouse.up();assert.notDeepEqual(await p.evaluate(()=>study.detail),before);await p.mouse.wheel(0,-100);await p.waitForTimeout(100);assert.ok(await p.evaluate(()=>study.detail.zoom)>before.zoom);
if(width===1440&&reduced&&i===3)await screenshot(p,'detail-4-1440',true);
await p.locator('#detail-return').click();await settled(p);assert.equal(await p.evaluate(()=>study.view),'C');await p.locator('#wall-return').click();await settled(p);assert.equal(await p.evaluate(()=>study.view),'B');await audienceClean(p);await p.locator('#forward').click();await settled(p);assert.equal(await p.evaluate(()=>study.view),'C');murals.push({order:i+1,image,full:true,detail:true,zoom:true,drag:true,returnFull:true,returnWall:true,copyClean:true});
}
await p.locator('#route-open').click();assert.equal(await p.locator('#route-list li').count(),5);assert.doesNotMatch(await p.locator('#route-dialog').innerText(),forbidden);await p.locator('#route-close').click();
for(let i=3;i>=0;i--)assert.equal(await p.evaluate(i=>study.travelTo(i),i),true);assert.equal(await p.evaluate(()=>study.activeMural),0);assert.deepEqual(errors,[]);report.runs.push({width,height,reduced,murals,reverseRoute:true,errors});console.log('PASS',width,height,reduced);await p.close();
}report.pass=true;
}finally{fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
