const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const out=path.resolve('docs/validation/a03-refinement-2026-10-04');
const svg=(label,w,h)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#101519"/><text x="24" y="32" fill="#d8d2c5" font-family="Microsoft YaHei, sans-serif" font-size="18">${label}</text></svg>`);
async function board(name,items,cols=2,w=800,h=500){const gap=12,header=48,rows=Math.ceil(items.length/cols),width=cols*w+(cols-1)*gap,height=rows*(h+header)+(rows-1)*gap,layers=[];for(let i=0;i<items.length;i++){const[label,file]=items[i],left=(i%cols)*(w+gap),top=Math.floor(i/cols)*(h+header+gap);layers.push({input:svg(label,w,header),left,top});layers.push({input:await sharp(file).resize(w,h,{fit:'contain',background:'#101519'}).png().toBuffer(),left,top:top+header});}await sharp({create:{width,height,channels:3,background:'#101519'}}).composite(layers).webp({quality:88}).toFile(path.join(out,'boards',name+'.webp'));}

(async()=>{fs.mkdirSync(path.join(out,'boards'),{recursive:true});const s=n=>path.join(out,'screenshots',n+'.png');
await board('01-before-after',[['Before / c23615a',path.join(out,'before-1920.png')],['After / 入庙 · 出庙 + cutaway',s('1920-05-markers')]]);
await board('02-a03-sequence',[['完整建筑',s('1920-01-entry')],['海报建立',s('1920-02-poster')],['屋顶退隐',s('1920-03-roof-transition')],['透空建筑',s('1920-04-cutaway-stable')],['三铺位置',s('1920-05-markers')],['第五铺接管',s('1920-06-fifth-focus')],['从第五铺出发',s('1920-07-handoff')],['A04接管',s('1920-08-a04-entry')]]);
await board('03-a03-a04-continuity',[['A03透空稳定',s('1920-04-cutaway-stable')],['第五铺聚焦',s('1920-06-fifth-focus')],['A03最终handoff',s('1920-07-handoff')],['A04第一帧',s('1920-08-a04-entry')],['A04路线启动',s('1920-09-a04-route-start')]]);
await board('04-responsive',[[1920,1080],[1440,900],[1366,768],[1024,768]].map(([w,h])=>[w+'×'+h,s(w+'-05-markers')]));
for(const file of fs.readdirSync(path.join(out,'screenshots')).filter(f=>f.endsWith('.png')))await sharp(path.join(out,'screenshots',file)).webp({quality:90}).toFile(path.join(out,'screenshots',file.replace('.png','.webp')));
await sharp(path.join(out,'before-1920.png')).webp({quality:90}).toFile(path.join(out,'before-1920.webp'));console.log('PASS before/after, sequence, continuity and responsive boards');
})().catch(e=>{console.error(e);process.exitCode=1});
