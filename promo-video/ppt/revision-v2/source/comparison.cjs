const fs=require('node:fs'),path=require('node:path');
const rt=require('../../source/runtime.cjs'),sharp=rt.requireBundle('sharp'),base=path.resolve(__dirname,'..');
(async()=>{
 const comp=[],label=Buffer.from('<svg width="1560" height="48"><rect width="1560" height="48" fill="#101519"/><g fill="#C9B69A" font-family="Arial" font-size="23"><text x="20" y="33">V1</text><text x="800" y="33">V2</text></g></svg>');
 comp.push({input:label,left:0,top:0});
 for(const [row,n] of [1,5,9].entries())for(const [col,dir]of [rt.base,base].entries()){
  const input=await sharp(path.join(dir,'preview/slides',`slide-${String(n).padStart(2,'0')}.png`)).resize(760,428).png().toBuffer();comp.push({input,left:10+col*780,top:54+row*440});
 }
 await sharp({create:{width:1560,height:1374,channels:3,background:'#101519'}}).composite(comp).png().toFile(path.join(base,'preview/comparison.png'));
 console.log('V1 / V2 comparison written, pages 01, 05, 09');
})();
