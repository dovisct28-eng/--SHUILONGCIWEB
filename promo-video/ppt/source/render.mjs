import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import rt from './runtime.cjs';
const {PresentationFile,FileBlob}=await import(pathToFileURL(path.join(rt.modules,'@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const input=process.argv[2]||path.join(rt.base,'local/candidate.pptx');
const out=process.argv[3]||path.join(rt.base,'preview/slides');await fs.mkdir(out,{recursive:true});
const p=await PresentationFile.importPptx(await FileBlob.load(input));
for(const [i,s]of p.slides.items.entries()){const blob=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));console.log(`Rendered ${i+1}/${p.slides.items.length}`);}
await fs.writeFile(path.join(rt.base,'local/render-info.json'),JSON.stringify({renderer:'@oai/artifact-tool 2.8.94 PPTX import renderer',input,path:out,slides:p.slides.items.length,scale:1.5,expectedPixelSize:[1920,1080],powerPointTested:false},null,2));
