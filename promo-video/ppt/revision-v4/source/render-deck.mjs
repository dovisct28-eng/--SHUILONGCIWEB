import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve('promo-video/ppt/revision-v4/local/runtime.cjs'));
const {FileBlob,PresentationFile}=require('@oai/artifact-tool');
const src=process.argv[2],dest=process.argv[3];
await fs.mkdir(dest,{recursive:true});
const p=await PresentationFile.importPptx(await FileBlob.load(src));
console.log(`Imported ${p.slides.items.length} slides`);
const indexes=process.argv[4]?process.argv[4].split(',').map(Number):p.slides.items.map((_,i)=>i);
for(const i of indexes){
 const s=p.slides.items[i],stem=`slide-${String(i+1).padStart(2,'0')}`;
 await fs.writeFile(path.join(dest,stem+'.png'),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1.5})).arrayBuffer()));
 console.log(stem);
}
// The bundled PDF exporter lacks a standard-font module on this Windows runtime.
// Use make-preview.py after rendering every slide.
