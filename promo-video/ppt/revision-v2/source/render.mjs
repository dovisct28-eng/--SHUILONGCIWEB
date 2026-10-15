import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import rt from '../../source/runtime.cjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {PresentationFile,FileBlob}=await import(pathToFileURL(path.join(rt.modules,'@oai/artifact-tool/dist/artifact_tool.mjs')).href);
const input=process.argv[2]||path.join(base,'local/candidate.pptx'),out=process.argv[3]||path.join(base,'preview/slides');await fs.mkdir(out,{recursive:true});
const p=await PresentationFile.importPptx(await FileBlob.load(input));
for(const[i,s]of p.slides.items.entries()){if(process.argv[4]&&!process.argv[4].split(',').map(Number).includes(i+1))continue;await fs.writeFile(path.join(out,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await(await p.export({slide:s,format:'png',scale:1.5})).arrayBuffer()));console.log(`Rendered ${i+1}/${p.slides.items.length}`);}
