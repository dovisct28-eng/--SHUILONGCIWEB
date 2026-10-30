// Generated derivatives only. Original mural resources are never read or altered.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.join(__dirname,'assets/route-v3.2'),out=path.join(root,'prepared');fs.mkdirSync(out,{recursive:true});
(async()=>{const manifest=JSON.parse(fs.readFileSync(path.join(root,'references/camera-manifest.json'))),stats=[];
 for(const item of manifest.items){
  const name=item.name,png=path.join(root,`candidates/${name}.png`),source=fs.existsSync(png)?png:path.join(root,`candidates/${name}.webp`);if(!fs.existsSync(source)){console.log('pending',name);continue;}
  const width=1280,height=720,count=width*height;
  const model=await sharp(path.join(root,`references/${name}-model.png`)).resize(width,height).removeAlpha().blur(32).raw().toBuffer();
  const ai=await sharp(source).resize(width,height).removeAlpha().raw().toBuffer(),low=await sharp(ai,{raw:{width,height,channels:3}}).blur(32).raw().toBuffer();
  // Preserve model low-frequency illumination; only AI microtexture is retained.
  for(let i=0;i<ai.length;i++){const gain=Math.max(.23,Math.min(1.2,(model[i]+8)/(low[i]+8)));ai[i]=Math.round(Math.min(255,ai[i]*gain));}
  await sharp(ai,{raw:{width,height,channels:3}}).webp({quality:92}).toFile(path.join(out,`${name}.webp`));
  const regions=await sharp(path.join(root,`references/${name}-regions.png`)).removeAlpha().raw().toBuffer(),channels=[Buffer.alloc(count),Buffer.alloc(count),Buffer.alloc(count)];
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;
   // Conservative surface interiors; exclude steps, generated ceiling and wood.
   if(regions[i*3]>245&&regions[i*3+1]<10&&x>width*.58&&y>height*.16&&y<height*.87)channels[0][i]=255;
   if(regions[i*3+1]>245&&regions[i*3]<10&&y>height*.77&&x>width*.38&&x<width*.78)channels[1][i]=255;
  }
  if(name==='second-dock')channels.forEach(c=>c.fill(0));
  const soft=await Promise.all(channels.map(c=>sharp(c,{raw:{width,height,channels:1}}).erode(12).blur(3).greyscale().raw().toBuffer()));
  const safe=Buffer.alloc(count*3);for(let i=0;i<count;i++)for(let c=0;c<3;c++)safe[i*3+c]=Math.min(channels[c][i],soft[c][i]);
  await sharp(safe,{raw:{width,height,channels:3}}).png().toFile(path.join(out,`${name}-safe.png`));
  const rawPath=path.join(root,`references/${name}-depth.f32`);let depth;if(fs.existsSync(rawPath)){const raw=fs.readFileSync(rawPath);depth=new Float32Array(raw.buffer,raw.byteOffset,count);}else{const existing=await sharp(path.join(out,`${name}-depth.png`)).removeAlpha().raw().toBuffer();depth=Float32Array.from({length:count},(_,i)=>(existing[i*3]*65536+existing[i*3+1]*256+existing[i*3+2])/16777215*40);}const packed=Buffer.alloc(count*3);
  for(let i=0;i<count;i++){const value=Math.round(Math.max(0,Math.min(1,depth[i]/40))*16777215);packed[i*3]=value>>>16;packed[i*3+1]=(value>>>8)&255;packed[i*3+2]=value&255;}
  await sharp(packed,{raw:{width,height,channels:3}}).png().toFile(path.join(out,`${name}-depth.png`));
  // Model semantic boundaries are separate from generated image contours.
  const edges=Buffer.alloc(count);for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){const i=y*width+x;for(const j of[i-1,i+1,i-width,i+width])if([0,1,2].some(c=>Math.abs(regions[i*3+c]-regions[j*3+c])>40))edges[i]=255;}
  await sharp(edges,{raw:{width,height,channels:1}}).png().toFile(path.join(root,`references/${name}-boundaries.png`));
  stats.push({name,maskCoverage:channels.map(c=>c.reduce((a,b)=>a+(b>0),0)/count),depth:'RGB24 / 16777215 * 40; positive reference eye-space distance',excluded:['wood and roof','steps and left courtyard','first-mural wall','entire second-mural wall'],illumination:'model/AI blurred RGB ratio; no geometric image warp'});
 }
 fs.writeFileSync(path.join(root,'preparation-report.json'),JSON.stringify(stats,null,2));console.log(stats);
})().catch(e=>{console.error(e);process.exitCode=1;});
