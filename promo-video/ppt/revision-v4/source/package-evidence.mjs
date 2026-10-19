import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve('promo-video/ppt/revision-v4/local/runtime.cjs'));
const sharp=require('sharp');
const root=path.resolve('promo-video/ppt/revision-v4');
const selected=path.resolve('docs/validation/ppt-design-evolution-v4/selected');
await fs.mkdir(selected,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const i of [5,6,7]){
 const name=`slide-${String(i).padStart(2,'0')}.png`;
 const old=await fs.readFile(path.join(root,'local/final-render',name));
 const corrected=await fs.readFile(path.join(root,'local/repaired-render',name));
 if(sha(old)!==sha(corrected))throw new Error(`Repaired package changed slide rendering: ${name}`);
 await sharp(corrected).webp({lossless:true}).toFile(path.join(selected,name.replace('.png','.webp')));
}
const sources=[
 ['figma-early-hero.png','Figma original frame','https://www.figma.com/design/1oSGGtdcJY92KlzOdhLEpJ/Untitled?node-id=14-7'],
 ['figma-early-space.png','Figma original frame','https://www.figma.com/design/1oSGGtdcJY92KlzOdhLEpJ/Untitled?node-id=25-7'],
 ['figma-early-explore.png','Figma original frame','https://www.figma.com/design/1oSGGtdcJY92KlzOdhLEpJ/Untitled?node-id=14-38'],
 ['lofi-hero.png','Historical low-fidelity browser QA','docs/validation/a01/a01-reading-1440x900.png'],
 ['lofi-space.png','Historical low-fidelity browser QA','docs/validation/a02/core-1440x900.png'],
 ['current-hero.png','Implemented interface stage QA','docs/validation/copy-update-2026-10-05/a01-1440x900.png'],
 ['current-mural.png','Implemented interface stage QA; lossless PNG conversion','docs/validation/a05-a08-editorial-2026-10-06/after/a05-opening-1440x900.webp']
];
const assets=[];
for(const [file,kind,source] of sources){let b=await fs.readFile(path.join(root,'assets',file));let m=await sharp(b).metadata();assets.push({file,kind,source,sha256:sha(b),bytes:b.length,width:m.width,height:m.height});}
await fs.writeFile(path.join(root,'qa/asset-provenance.json'),JSON.stringify({date:'2026-10-19',figmaExportDate:'2026-10-19',assets},null,2)+'\n');
const outputs=[];
for(const file of (await fs.readdir(path.join(root,'output'))).filter(x=>/\.(pptx|pdf)$/.test(x))){const b=await fs.readFile(path.join(root,'output',file));outputs.push({file,bytes:b.length,sha256:sha(b)});}
const screenshots=[];
for(const file of await fs.readdir(selected)){const b=await fs.readFile(path.join(selected,file));screenshots.push({file,bytes:b.length,sha256:sha(b)});}
await fs.writeFile(path.join(root,'qa/delivery-manifest.json'),JSON.stringify({date:'2026-10-19',slideCount:15,addedSlides:[5,6,7],outputs,screenshots,selectedTotalBytes:screenshots.reduce((s,x)=>s+x.bytes,0),repairedSlidesRenderIdentical:true},null,2)+'\n');
console.log(JSON.stringify({outputs,selectedTotalBytes:screenshots.reduce((s,x)=>s+x.bytes,0)}));
