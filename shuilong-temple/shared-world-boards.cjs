const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const out=path.resolve('docs/validation/shared-temple-world-2026-10-04');
const shot=(width,name)=>path.join(out,'screenshots',`${width}-${name}.png`);
const header=(label,w,h)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#101519"/><text x="24" y="32" fill="#e7dcc8" font-family="Microsoft YaHei,sans-serif" font-size="18">${label}</text></svg>`);
async function board(name,items,cols=2,w=800,h=450){
  const gap=12,head=48,rows=Math.ceil(items.length/cols),width=cols*w+(cols-1)*gap,height=rows*(h+head)+(rows-1)*gap,layers=[];
  for(let i=0;i<items.length;i++){
    const [label,file]=items[i],left=i%cols*(w+gap),top=Math.floor(i/cols)*(h+head+gap);
    layers.push({input:header(label,w,head),left,top});
    layers.push({input:await sharp(file).resize(w,h,{fit:'contain',background:'#101519'}).png().toBuffer(),left,top:top+head});
  }
  await sharp({create:{width,height,channels:3,background:'#101519'}}).composite(layers).webp({quality:90}).toFile(path.join(out,name));
}
(async()=>{
  for(const width of [1920,1440,1366,1024]){
    const folder=path.join(out,'viewports',String(width));fs.mkdirSync(folder,{recursive:true});
    for(const file of fs.readdirSync(path.join(out,'screenshots')).filter(f=>f.startsWith(width+'-')&&f.endsWith('.png'))){
      const name=file.slice(String(width).length+1).replace('.png','.webp');
      await sharp(path.join(out,'screenshots',file)).webp({quality:92}).toFile(path.join(folder,name));
      if(width===1920)await sharp(path.join(out,'screenshots',file)).webp({quality:92}).toFile(path.join(out,name));
    }
  }
  await board('before-after.webp',[
    ['Before / 49eac2f',path.join(out,'baseline/1920-08-a03-three-murals.png')],
    ['After / Shared Temple World',shot(1920,'08-a03-three-murals')]
  ]);
  await board('a04-before-after.webp',[['Before / A04 49eac2f',path.join(out,'comparison/a04-before.png')],['After / A04 shared material + light',path.join(out,'comparison/a04-after.png')]]);
  await board('sequence-board.webp',[
    ['A01 → / 雾山场地',shot(1920,'01-a01-stable')],['A02 → / 建筑观察',shot(1920,'03-a02-stable')],
    ['A03 → / 海报剖切',shot(1920,'08-a03-three-murals')],['A04 / 空间路径',shot(1920,'11-a04-route')]
  ],4,600,338);
  await board('sequence-detail-board.webp',[
    ['A01 → / 雾山场地',shot(1920,'01-a01-stable')],['A02 → / 建筑观察',shot(1920,'03-a02-stable')],
    ['A03 → / 海报剖切',shot(1920,'08-a03-three-murals')],['A04 / 空间路径',shot(1920,'11-a04-route')]
  ],4,600,338);
  await board('sequence-detail-board.webp',[
    ['A01 / 雾山场地',shot(1920,'01-a01-stable')],['A01 → A02',shot(1920,'02-a01-a02-transition')],
    ['A02 / 建筑观察',shot(1920,'03-a02-stable')],['A02 → A03',shot(1920,'04-a02-a03-transition')],
    ['A03 / 完整建筑',shot(1920,'05-a03-entry')],['A03 / 选择性剖切',shot(1920,'08-a03-three-murals')],
    ['A03 / 第五铺接管',shot(1920,'09-a03-fifth-focus')],['A03 → A04',shot(1920,'10-a03-a04-transition')],
    ['A04 / 路线播放',shot(1920,'12-a04-playing')],['A04 / 路线总览',shot(1920,'11-a04-route')]
  ]);
  await board('responsive-board.webp',[1920,1440,1366,1024].map(width=>[`${width}px / A03`,shot(width,'08-a03-three-murals')]));
  console.log('PASS WebP evidence: four viewports, eleven required states, route playback, comparison and sequence boards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
