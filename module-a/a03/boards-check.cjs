const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const out=path.resolve('docs/validation/a03-poster-remaster-2026-10-04');
const svg=(label,w,h)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#101519"/><text x="24" y="32" fill="#d8d2c5" font-family="Microsoft YaHei, sans-serif" font-size="18">${label}</text></svg>`);
async function board(name,items,cols=2,w=800,h=500){const gap=12,header=48,rows=Math.ceil(items.length/cols),width=cols*w+(cols-1)*gap,height=rows*(h+header)+(rows-1)*gap,layers=[];for(let i=0;i<items.length;i++){const[label,file]=items[i],left=(i%cols)*(w+gap),top=Math.floor(i/cols)*(h+header+gap);layers.push({input:svg(label,w,header),left,top});layers.push({input:await sharp(file).resize(w,h,{fit:'contain',background:'#101519'}).png().toBuffer(),left,top:top+header});}await sharp({create:{width,height,channels:3,background:'#101519'}}).composite(layers).webp({quality:88}).toFile(path.join(out,'boards',name+'.webp'));}
(async()=>{fs.mkdirSync(path.join(out,'boards'),{recursive:true});const s=n=>path.join(out,'screenshots',n+'.png');
 await board('01-responsive',[[1920,1080],[1440,900],[1366,768],[1024,768]].map(([w,h])=>[`${w}×${h} / A03`,s(`${w}-04-poster-stable`)]));
 await board('02-before-after',[['Before / 8686c4d',s('before-1920')],['After / 出庙 · 入庙',s('1920-04-poster-stable')]]);
 await board('03-reference-implementation',[['参考 / 构图与光影，非建筑依据','C:/Users/dovis/Desktop/新建文件夹/水龙祠：雾山出入之间.png'],['实际 / 项目既有设计模型',s('1920-04-poster-stable')]]);
 await board('04-continuity',[['A02 核心三铺',s('1920-01-a02-core')],['A02→A03 25%',s('1920-02-transition-25')],['A02→A03 60%',s('1920-03-transition-60')],['A03 稳定海报',s('1920-04-poster-stable')],['A03→A04',s('1920-06-handoff')],['A04 原入口',s('1920-07-a04-entry')]]);
 for(const file of fs.readdirSync(path.join(out,'screenshots')).filter(f=>/^\d{4}-|^before-/.test(f)&&f.endsWith('.png')))await sharp(path.join(out,'screenshots',file)).webp({quality:88}).toFile(path.join(out,'screenshots',file.replace('.png','.webp')));
 console.log('PASS: four review boards and WebP screenshots generated');
})().catch(e=>{console.error(e);process.exitCode=1;});
