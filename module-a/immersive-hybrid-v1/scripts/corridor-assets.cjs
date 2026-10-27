// Deterministic design textures, no generated architecture or mural content.
const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const out=path.resolve(__dirname,'../assets/hybrid-v2-2');fs.mkdirSync(path.join(out,'originals'),{recursive:true});
(async()=>{const rows=[];
// A small blank plaster swatch only: no column, edge, opening or mural. Its
// illumination is removed; it supplies fine material relief, never perspective.
const swatch=await sharp(path.join(out,'../generated/S04-mural01-background.webp')).extract({left:550,top:400,width:550,height:220}).greyscale().resize(1024,1024).raw().toBuffer();
const swatchMean=swatch.reduce((a,b)=>a+b,0)/swatch.length;
for(const [name,seed]of [['plaster',17],['paving',31]]){
 const size=1024,buf=Buffer.alloc(size*size*3);let rand=seed;
 const random=()=>{rand=(Math.imul(rand,1664525)+1013904223)>>>0;return rand/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/size,v=y/size;
  const coarse=Math.sin(u*23+Math.sin(v*14))*Math.cos(v*17+Math.sin(u*11));
  const fine=(random()-.5)*.055;
  let value=1+coarse*.075+Math.sin(u*91+v*61)*.018+fine;
  if(name==='plaster')value+=(swatch[y*size+x]-swatchMean)/255*1.5-.10*Math.exp(-v*8);
  else value-=((x%256<3)||(y%128<3))?.11:0;
  const tint=name==='plaster'?[1.025,1.005,.975]:[1.015,1,.98];
  for(let c=0;c<3;c++)buf[(y*size+x)*3+c]=Math.max(0,Math.min(255,Math.round(value*.5*tint[c]*255)));
 }
 const original=path.join(out,'originals',`${name}-modulation-v1.png`),web=path.join(out,`${name}-modulation-v1.webp`);
 await sharp(buf,{raw:{width:size,height:size,channels:3}}).png().toFile(original);
 await sharp(original).webp({quality:92}).toFile(web);
  rows.push({id:name,url:`${name}-modulation-v1.webp`,width:size,height:size,bytes:fs.statSync(web).size,source:name==='plaster'?'V1 S04 blank plaster swatch [550,400,550,220], mean-neutralized and combined with procedural modulation; design expression only':'Deterministic procedural material modulation; neutral 0.5; not a site sample',seed});
}
fs.writeFileSync(path.join(out,'layers.json'),JSON.stringify({version:'2.2-procedural-candidate-1',method:'original-surface planar texture projection; original light and depth',textures:rows,mural:{independent:true,id:'mural-01',position:[4.865,1.55,4.8],width:3.65,height:1.2547,rotationY:-Math.PI/2},limits:{railOnly:true,forwardRange:[7.65,9.7],eyeHeight:1.38},historicalClaim:false},null,2));
console.log(rows);
})().catch(e=>{console.error(e);process.exitCode=1;});
