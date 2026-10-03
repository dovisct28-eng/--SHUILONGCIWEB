const fs=require('fs'),path=require('path'),sharp=require('sharp');
const out=path.resolve(process.env.A01_VALIDATION_DIR||'docs/validation/a01-cinematic-v2');
async function board(name,items,cols=3,width=600,height=375){const rows=Math.ceil(items.length/cols),inputs=[];for(let i=0;i<items.length;i++){const [label,file,extract]=items[i];let source=sharp(file);if(extract)source=source.extract(extract);inputs.push({input:await source.resize(width,height,{fit:'contain',background:'#101920'}).png().toBuffer(),left:i%cols*width,top:Math.floor(i/cols)*(height+32)});inputs.push({input:Buffer.from(`<svg width="${width}" height="32"><rect width="100%" height="100%" fill="#101920"/><text x="14" y="23" fill="#e5d9c8" font-family="Arial" font-size="17">${label}</text></svg>`),left:i%cols*width,top:Math.floor(i/cols)*(height+32)+height});}await sharp({create:{width:cols*width,height:rows*(height+32),channels:3,background:'#101920'}}).composite(inputs).jpeg({quality:90}).toFile(path.join(out,name));}
(async()=>{
 await board('reference-baseline-final.jpg',[
 ['Reference / art direction only','C:/Users/dovis/Desktop/新建文件夹/水龙祠：墨境入景分镜展板.png',{left:0,top:0,width:1586,height:464}],
 ['fab296b3 / actual page',path.join(out,'baseline/hero.png')],
 ['A01 v2 / review candidate',path.join(out,'final/after/final-hero-1440x900.png')]],3,960,600);
 await board('visual-evolution.jpg',[['Baseline','baseline/hero.png'],['Camera C','camera/camera-C.png'],['Environment','environment/hero.png'],['Lighting','lighting/hero.png'],['Material','material/hero.png'],['Post','post/hero.png'],['Composite','final/after/final-hero-1440x900.png']].map(([l,p])=>[l,path.join(out,p)]));
 await board('07-line-animation.jpg',[0,5,12,20,30,40,50,60,75,100].map(p=>[`${p}% / actual page`,path.join(out,`animation/${p}-1440x900.png`)]),5,480,300);
 await board('four-size-heroes.jpg',[[1440,900],[1920,1080],[1366,768],[1024,768]].map(([w,h])=>[`${w} x ${h}`,path.join(out,`final/after/final-hero-${w}x${h}.png`)]),2,720,450);
 const shots=[['01-baseline.png','baseline/hero.png'],['02-camera.png','camera/camera-C.png'],['03-environment.png','environment/hero.png'],['04-lighting.png','lighting/hero.png'],['05-material.png','material/hero.png'],['06-post.png','post/hero.png'],['08-final-hero.png','final/after/final-hero-1440x900.png']];for(const [name,file]of shots)fs.copyFileSync(path.join(out,file),path.join(out,name));
 console.log('PASS: comparison / evolution / ten-frame contact / four-size heroes');
})().catch(e=>{console.error(e);process.exitCode=1;});
