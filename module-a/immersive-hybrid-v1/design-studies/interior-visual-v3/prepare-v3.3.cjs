// Derive AI surface textures/masks only; never processes actual murals.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.join(__dirname,'assets/route-v3.3'),out=path.join(root,'prepared'),local=path.resolve('docs/validation/interior-visual-v3-3/local');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{fs.mkdirSync(out,{recursive:true});const records=JSON.parse(fs.readFileSync(path.join(root,'generation-records.json'),'utf8').replace(/^\uFEFF/,'')),manifest=JSON.parse(fs.readFileSync(path.join(root,'references/camera-manifest.json'))),stats=[];
 for(const item of manifest.items){const name=item.name,record=records.items.find(x=>x.name===name),original=record.originalGenerated;
  fs.copyFileSync(original,path.join(local,`${name}-ai-source.png`));const metadata=await sharp(original).metadata(),width=1280,height=720,count=width*height;
  await sharp(original).resize(width,height,{fit:'fill'}).webp({quality:92}).toFile(path.join(root,record.candidate));
  const source=path.join(root,record.candidate),model=await sharp(path.join(root,`references/${name}-model.png`)).resize(width,height).removeAlpha().blur(32).raw().toBuffer(),ai=await sharp(source).removeAlpha().raw().toBuffer(),low=await sharp(ai,{raw:{width,height,channels:3}}).blur(32).raw().toBuffer();
  for(let i=0;i<ai.length;i++){const gain=Math.max(.2,Math.min(1.2,(model[i]+8)/(low[i]+8)));ai[i]=Math.round(Math.min(255,ai[i]*gain));}
  await sharp(ai,{raw:{width,height,channels:3}}).webp({quality:93}).toFile(path.join(out,`${name}.webp`));
  const regions=await sharp(path.join(root,`references/${name}-regions.png`)).removeAlpha().raw().toBuffer(),channels=[Buffer.alloc(count),Buffer.alloc(count),Buffer.alloc(count)];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(regions[i*3]>245&&regions[i*3+1]<10&&y>height*.18&&y<height*.82)channels[0][i]=255;if(regions[i*3+1]>245&&regions[i*3]<10&&y>height*.76&&x>width*.035&&x<width*.965)channels[1][i]=255;}
  const soft=await Promise.all(channels.map(c=>sharp(c,{raw:{width,height,channels:1}}).erode(20).blur(2).greyscale().raw().toBuffer())),safe=Buffer.alloc(count*3);
  for(let i=0;i<count;i++)for(let c=0;c<3;c++)safe[i*3+c]=Math.min(channels[c][i],soft[c][i]);
  await sharp(safe,{raw:{width,height,channels:3}}).png().toFile(path.join(out,`${name}-safe.png`));
  const raw=fs.readFileSync(path.join(local,`${name}-depth.f32`)),depth=new Float32Array(raw.buffer,raw.byteOffset,count),packed=Buffer.alloc(count*3);
  for(let i=0;i<count;i++){const value=Math.round(Math.max(0,Math.min(1,depth[i]/40))*16777215);packed[i*3]=value>>>16;packed[i*3+1]=(value>>>8)&255;packed[i*3+2]=value&255;}
  await sharp(packed,{raw:{width,height,channels:3}}).png().toFile(path.join(out,`${name}-depth.png`));
  const edges=Buffer.alloc(count);for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x;for(const j of[i-1,i+1,i-width,i+width])if([0,1,2].some(c=>Math.abs(regions[i*3+c]-regions[j*3+c])>40))edges[i]=255;}
  await sharp(edges,{raw:{width,height,channels:1}}).png().toFile(path.join(root,`references/${name}-boundaries.png`));
  stats.push({name,generatedSize:[metadata.width,metadata.height],referenceSize:[width,height],candidateSha256:hash(source),referenceSha256:hash(path.join(root,record.reference)),candidateMaskCoverage:channels.map(c=>c.reduce((sum,b)=>sum+(b>0),0)/count),depth:'RGB24 / 16777215 * 40; positive eye-space distance',excluded:['all generated wood, roof and brick','structural boundaries (20px erosion)','all first/second/fifth mural areas','rear mural bands except non-mural central gap and upper wall'],runtimeGuard:'world-space exclusion in route-surface-v3.3.mjs; reference depth rejection; real-time model depth',illumination:'match blurred model/AI RGB ratio; no image warp'});
 }
 fs.writeFileSync(path.join(root,'preparation-report.json'),JSON.stringify(stats,null,2));console.log(JSON.stringify(stats.map(s=>({name:s.name,coverage:s.candidateMaskCoverage}))));
})().catch(e=>{console.error(e);process.exitCode=1;});
