import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('../',import.meta.url));
const project=path.resolve(base,'../..');
for(const name of ['src','vendor','assets/references','assets/generated/originals','assets/layers','assets/murals','prompts'])fs.mkdirSync(path.join(base,name),{recursive:true});
// Reuse the exact licensed Three.js 0.180.0 already bundled by this project.
const html=fs.readFileSync(path.join(project,'shuilong-temple/水龙祠-交互预览.html'),'utf8');
const core=JSON.parse(html.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const line=html.split('\n').find(l=>l.startsWith('const moduleText='));
const module=JSON.parse(line.slice('const moduleText='.length,line.lastIndexOf('".replaceAll(')+1));
fs.writeFileSync(path.join(base,'vendor/three.core.js'),core.replaceAll('\t\t\t \tmaterial =','\t\t\t\tmaterial ='));
fs.writeFileSync(path.join(base,'vendor/three.module.js'),module);
fs.copyFileSync(path.join(project,'shuilong-temple/Three-LICENSE.txt'),path.join(base,'vendor/LICENSE.txt'));
fs.copyFileSync(path.join(project,'水龙祠壁画素材/网页展示图/mural-01-display.webp'),path.join(base,'assets/murals/mural-01-display.webp'));
console.log('Prepared local Three.js and byte-identical real mural; original files unchanged.');
