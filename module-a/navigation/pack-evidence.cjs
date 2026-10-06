// Compact copies of our browser captures; original PNG evidence stays local.
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('docs/validation/module-a-navigation-2026-10-06');
(async()=>{
 const dir=path.join(out,'screenshots');
 for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.png')))await sharp(path.join(dir,file)).webp({quality:90}).toFile(path.join(dir,file.replace('.png','.webp')));
 const frames=['a02-default','directory-open','a03-poster','a04-summary','a05-scan','a08-final'];
 const tiles=[];
 for(let i=0;i<frames.length;i++)tiles.push({input:await sharp(path.join(dir,frames[i]+'.png')).resize(720,450).png().toBuffer(),left:(i%2)*720,top:Math.floor(i/2)*450});
 await sharp({create:{width:1440,height:1350,channels:3,background:'#10191f'}}).composite(tiles).webp({quality:90}).toFile(path.join(out,'review-sheet.webp'));
 const files=fs.readdirSync(dir).filter(f=>f.endsWith('.webp'));
 const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>模块 A 导航候选审图</title><style>body{background:#10191f;color:#d8d2c5;font:16px/1.7 system-ui;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:24px}figure{margin:0}img{display:block;width:100%;height:auto}a{color:inherit}figcaption{margin-top:8px;font-size:13px}p{max-width:900px}</style><h1>模块 A 沉浸式导航 · 候选审图</h1><p>技术验收通过；待用户最终视觉确认。图片为真实浏览器画面，尺寸/颜色/字体仍为候选。A01导航隐藏，A04只调整导航自身避让，三幅巡视与最终墙面保持。下列图片可点击查看原尺寸。</p><main>'+files.map(f=>'<figure><a href="screenshots/'+f+'"><img src="screenshots/'+f+'" loading="lazy" alt="'+f.replace('.webp','')+'"></a><figcaption>'+f.replace('.webp','')+'</figcaption></figure>').join('')+'</main></html>';
 fs.writeFileSync(path.join(out,'review.html'),html);
 console.log('PASS compact screenshots, six-frame review sheet and local gallery');
})().catch(e=>{console.error(e);process.exitCode=1;});
