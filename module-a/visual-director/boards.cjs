// Arrange raw browser screenshots without retouching their pixels or altering any heritage asset.
const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve('docs/validation/module-a-visual-director-v2'),tag='1440x900';
const shot=(name,phase='after',size=tag)=>({file:path.join(base,phase,`${name}-${size}.png`),label:`${name} · ${size} · ${phase}`});
const boards=[
 ['01-a02-before-after',[shot('a02-space','before'),shot('a02-space'),shot('a02-core','before'),shot('a02-core')]],
 ['02-a02-marker-stages',['a02-space','a02-five','a02-core'].map(n=>shot(n))],
 ['03-a03-theme',['a02-core','a03-enter','a03'].map(n=>shot(n))],
 ['04-a04-route',['fifth','first','second','route-current','a04-overview'].map(n=>shot(n))],
 ['05-space-to-image',['a04-overview','approach','transfer','a05-enter'].map(n=>shot(n))],
 ['06-three-murals',['a05-intro','a05-scan','a06-scan','a07-scan'].map(n=>shot(n))],
 ['07-exploration-entry',['a08','a08-hover','a08-focus'].map(n=>shot(n))],
 ['08-overall',['a02-core','a03','a04-overview','a05-scan','a06-scan','a07-scan','a08'].map(n=>shot(n))],
 ['09-responsive',['1920x1080','1440x900','1366x768','1024x768'].flatMap(size=>['a02-core','a03','a08'].map(n=>shot(n,'after',size)))],
 ['10-visual-rhythm',['a01','a02-core','a03','a04-overview','a05-scan','a06-scan','a07-scan','a08'].map(n=>shot(n))],
 ['11-accent-comparison',['warm','gray-green','gray-brown'].flatMap(p=>['markers','route','cta'].map(n=>({file:path.join(base,'review',`${p}-${n}-1440x900.png`),label:`${p} · ${n}`})))],
];
const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
(async()=>{const target=path.join(base,'boards');fs.mkdirSync(target,{recursive:true});for(const [name,items]of boards){const cols=items.length<4?items.length:Math.min(4,items.length),cellW=420,cellH=290,pad=18,head=58,w=cols*cellW+pad*2,h=Math.ceil(items.length/cols)*cellH+head+pad;const layers=[];for(let i=0;i<items.length;i++){const x=pad+(i%cols)*cellW,y=head+Math.floor(i/cols)*cellH;layers.push({input:await sharp(items[i].file).resize(cellW-12,245,{fit:'contain',background:'#101519'}).png().toBuffer(),left:x,top:y});layers.push({input:Buffer.from(`<svg width="${cellW}" height="32"><text x="0" y="22" fill="#c9c8c0" font-family="Arial" font-size="14">${escape(items[i].label)}</text></svg>`),left:x,top:y+247});}layers.push({input:Buffer.from(`<svg width="${w}" height="50"><text x="18" y="34" fill="#d8d2c5" font-family="Arial" font-size="24">${name} / localhost visual review</text></svg>`),left:0,top:0});await sharp({create:{width:w,height:h,channels:3,background:'#101519'}}).composite(layers).png().toFile(path.join(target,name+'.png'));}console.log(`${boards.length} boards created from raw screenshots`);})().catch(e=>{console.error(e);process.exitCode=1;});
