// Compare recorded renderer states; these counters are not a frame-rate benchmark.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const base=path.resolve('docs/validation/module-a-visual-director-v2');
const read=name=>JSON.parse(fs.readFileSync(path.join(base,name),'utf8'));
const before=read('before/states.json'),after=read('after/states.json'),review=read('review/results.json');
const pick=(data,name)=>data.find(s=>s.name===name&&s.width===1440);
const counters=s=>({calls:s.stats.calls,triangles:s.stats.triangles,geometries:s.stats.geometries,textures:s.stats.textures,post:s.stats.post});
const html='shuilong-temple/水龙祠-交互预览.html';
const old=spawnSync('git',['show',`0ea01b6c8e759f851e20751d3883431037a87096:${html}`],{maxBuffer:12*1024*1024});if(old.status)throw Error(old.stderr.toString());
const report={baseline:'0ea01b6c8e759f851e20751d3883431037a87096',scenes:['a01','a02-core','a03','a04-overview','a08'].map(name=>({name,before:counters(pick(before,name)),after:counters(pick(after,name))})),htmlBytes:{before:old.stdout.length,after:fs.statSync(html).size},sizes:review.sizes.map(s=>{const chapterFonts=s.fontResources.filter(r=>r.name.includes('/visual-director/'));const model=s.layouts.find(x=>Math.abs(x.screen-9.7)<.01);return{width:s.width,height:s.height,firstAddedFontBytes:s.firstFontBytes,chapterFontRequests:chapterFonts.length,chapterFontEncodedBytes:chapterFonts.reduce((n,r)=>n+r.encoded,0),uniqueChapterFontFiles:new Set(chapterFonts.map(r=>r.name)).size,modelViewportWidthRatio:(model.art.bounds.right-model.art.bounds.left)*model.frame.w/s.width,ctaContrast:s.ctaContrast,bodyContrast:s.bodyContrast};}),scope:'Same localhost machine and recorded state; no frame-rate, memory or GPU-time claim.'};
fs.writeFileSync(path.join(base,'performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
