// Preserve generated originals in CODEX_HOME; normalize only derived web assets.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=__dirname,manifest=require('./generation-manifest.json');
async function main(){
 const references=path.resolve(root,manifest.referenceRoot),candidates=path.join(root,'assets/candidates');fs.mkdirSync(candidates,{recursive:true});
 for(const j of manifest.records){
  const out=path.join(root,'assets/prepared',j.direction);fs.mkdirSync(out,{recursive:true});
  // Only generated derivatives are resized. No real mural is processed here.
  await sharp(j.source).resize(1672,941,{fit:'fill'}).webp({quality:94}).toFile(path.join(candidates,`${j.name}-${j.direction}.webp`));
  await sharp(j.source).resize(1280,720,{fit:'fill'}).webp({quality:92}).toFile(path.join(out,`${j.name}.webp`));
  // Reuse the calibrated model-derived safety masks, never the generated edges.
  const maskPath=path.resolve(root,'../../assets/combined-b-transition/prepared',`${j.name}-valid-rg.png`);
  const {data:old}=await sharp(maskPath).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const {data:regions}=await sharp(path.join(references,`${j.name}-regions.png`)).resize(1280,720,{kernel:'nearest'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const wood=Buffer.alloc(1280*720);for(let y=260;y<670;y++)for(let x=75;x<735;x++){const i=(y*1280+x)*3;if(regions[i+2]>240&&regions[i]<10&&regions[i+1]<10)wood[y*1280+x]=255;}
  const soft=await sharp(wood,{raw:{width:1280,height:720,channels:1}}).erode(9).blur(5).raw().toBuffer();
  // B is a conservative wood interior mask; roof silhouettes stay excluded.
  for(let i=0;i<wood.length;i++)old[i*3+2]=soft[i];
  await sharp(old,{raw:{width:1280,height:720,channels:3}}).png().toFile(path.join(out,`${j.name}-valid-rg.png`));
 }
 const local=path.resolve(root,'../../../../docs/validation/interior-visual-v2/local');fs.mkdirSync(local,{recursive:true});
 const cols=['model','A','B'],names=['gate-interior','stage-turn','corridor-advance','mural-approach'],tiles=[];
 for(let row=0;row<names.length;row++)for(let col=0;col<3;col++){const src=col===0?path.join(references,`${names[row]}.png`):path.join(candidates,`${names[row]}-${cols[col]}.webp`);tiles.push({input:await sharp(src).resize(640,360).toBuffer(),left:col*640,top:row*390+30});}
 const labels=Buffer.from(`<svg width="1920" height="1560">${names.map((n,i)=>cols.map((c,j)=>`<text x="${j*640+12}" y="${i*390+21}" fill="#ded8cb" font-size="17" font-family="sans-serif">${n} / ${c}</text>`).join('')).join('')}</svg>`);
 await sharp({create:{width:1920,height:1560,channels:3,background:'#141b1e'}}).composite([...tiles,{input:labels,left:0,top:0}]).png().toFile(path.join(local,'ai-contact.png'));
 console.log('8 candidates and calibrated safety masks prepared');
}
main().catch(e=>{console.error(e);process.exitCode=1});
