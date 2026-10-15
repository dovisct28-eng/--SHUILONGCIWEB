const fs=require('node:fs'),path=require('node:path'),{once}=require('node:events');
const {chromium}=require('playwright'),{createApp}=require('../../Mural-Exhibition/server.js');
const {capture,step,pause,smooth}=require('./capture-v4.cjs');
const base=path.resolve(__dirname,'..'),full=process.argv.includes('--full');
async function main(){let server,browser;const report={errors:[],events:[],kind:'real-B02-offline-input-capture'};try{
 server=createApp().listen(0,'127.0.0.1');await once(server,'listening');browser=await chromium.launch({channel:'chrome',headless:true});const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,permissions:[]});const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.clock.install();await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);await p.locator('#btn-gallery-track').click();await p.waitForFunction(()=>document.getElementById('panorama-bg').naturalWidth>0);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1000);
 // Preload actual image variants through the existing controls; return to panorama.
 await p.locator('.hotspot[data-ids="01"]').click();
 for(const [id,label] of [['org','原壁画'],['line','高清线稿'],['color','数字色稿']]){await p.getByRole('button',{name:label,exact:true}).click();await p.waitForFunction(id=>document.getElementById('img-'+id).naturalWidth>0,id);}
 await p.getByRole('button',{name:'原壁画',exact:true}).click();await p.locator('#back-btn').click();await p.waitForTimeout(1000);await pause(p);
 await p.evaluate(()=>{const n=document.createElement('div');n.id='capture-pointer';n.style.cssText='position:fixed;z-index:2147483647;left:0;top:0;width:16px;height:16px;border:2px solid #f4e9cd;border-radius:50%;box-shadow:0 1px 4px #000;pointer-events:none;transform:translate(-50%,-50%)';document.body.append(n);});
 const cursor=async(x,y)=>{await p.mouse.move(x,y);await p.evaluate(({x,y})=>{const e=document.getElementById('capture-pointer');e.style.left=x+'px';e.style.top=y+'px';},{x,y});};
 const click=async(selector,f)=>{const box=await p.locator(selector).boundingBox();if(!box)throw Error('Missing visible '+selector);await cursor(box.x+box.width/2,box.y+box.height/2);await p.mouse.click(box.x+box.width/2,box.y+box.height/2);report.events.push({frame:f,selector});};
 report.capture=await capture(p,full?'b02-full':'probe-b02',full?1170:150,async f=>{
  if(!full){
   if(f===0){await cursor(1150,540);await p.mouse.down();}
   if(f<28)await cursor(1150-180*smooth(f/27),540);
   if(f===28){await p.mouse.up();await click('#pano-reset-btn',f);}
   if(f===35)await click('.hotspot[data-ids="01"]',f);
   if(f===75)await click('button.layer-btn:nth-child(2)',f);
   if(f===112)await click('button.layer-btn:nth-child(3)',f);
  }else{
   if(f===120){await cursor(1150,540);await p.mouse.down();}
   if(f>=120&&f<195)await cursor(1150-360*smooth((f-120)/74),540);
   if(f===195){await p.mouse.up();await p.mouse.wheel(0,-170);report.events.push({frame:f,action:'zoom'});}
   if(f===300)await click('#pano-reset-btn',f);
   if(f===360)await click('.hotspot[data-ids="01"]',f);
   if(f===540)await click('button.layer-btn:nth-child(2)',f);
   if(f===660)await click('button.layer-btn:nth-child(3)',f);
   if(f===900)await click('#index-toggle',f);
   if(f===930){const item=p.locator('#menu li').filter({hasText:'东门陈五猖'});const box=await item.boundingBox();if(!box)throw Error('second character unavailable');await cursor(box.x+box.width/2,box.y+box.height/2);await p.mouse.click(box.x+box.width/2,box.y+box.height/2);report.events.push({frame:f,action:'select-character-02'});
    let ready=false;for(let i=0;i<90;i++){await step(p,16);ready=await p.evaluate(()=>{const e=document.getElementById('img-org');return !e.hidden&&e.complete&&e.naturalWidth>0&&!document.getElementById('info-text').textContent.includes('正在读取');});if(ready)break;}if(!ready)throw Error('Character02 resources not ready; refusing to capture blank');
   }
   if(f===1000){await cursor(1560,700);await p.locator('#info-text').evaluate(e=>e.scrollTo({top:120,behavior:'smooth'}));report.events.push({frame:f,action:'read-existing-info'});}
  }
 });
 report.status=report.errors.length?'PAGE_ERRORS':'CAPTURED';
 }finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(base,'recordings/v4',full?'capture-b02-full-report.json':'capture-b02-probe-report.json'),JSON.stringify(report,null,2));}}
main().catch(e=>{console.error(e);process.exitCode=1;});
