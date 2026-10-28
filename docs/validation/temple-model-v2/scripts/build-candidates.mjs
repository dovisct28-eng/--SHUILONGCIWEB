import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as T from '../../../../module-a/immersive-hybrid-v1/vendor/three.module.js';
import {createCandidate,corridorMetrics} from '../src/candidate-model.mjs';
import {serializeGLB} from '../src/glb-writer.mjs';
const out=fileURLToPath(new URL('../',import.meta.url)),project=path.resolve(out,'../../..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const sourceBytes=fs.readFileSync(path.join(out,'src/baseline-model.js')),source=sourceBytes.toString('utf8');
assert.ok(sourceBytes.equals(fs.readFileSync(path.join(project,'shuilong-temple/model-source.js'))),'Frozen baseline must match production exactly');
const config=JSON.parse(fs.readFileSync(path.join(out,'candidate-config.json'))),phase=process.argv[2]??'all';
const manifestPath=path.join(out,'model-manifest.json');
const prior=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath)):{};
const models=prior.models??{};
models.baseline={id:'baseline',label:config.variants[0].label,url:'../../../shuilong-temple/shuilong-temple.glb',bytes:fs.statSync(path.join(project,'shuilong-temple/shuilong-temple.glb')).size,triangles:83360,structure:{corridor:corridorMetrics(config,config.variants[0]),stage:null,roof:null},sha256:sha(fs.readFileSync(path.join(project,'shuilong-temple/shuilong-temple.glb')))};
for(const variant of config.variants.filter(v=>v.id!=='baseline'&&(phase==='all'||v.id.startsWith(phase+'-')))){
 const start=performance.now(),{root,structure}=createCandidate(T,source,config,variant);
 const {output,triangles,gltf}=serializeGLB(T,root,path.join(project,'shuilong-temple'));
 const murals=gltf.nodes.filter(n=>n.extras.mural).map(n=>n.extras.mural);
 assert.deepEqual(murals,JSON.parse(fs.readFileSync(path.join(project,'shuilong-temple/mural-locations.json'))));
 const bounds=Object.fromEntries(root.children.map(g=>{const b=new T.Box3().setFromObject(g);return [g.name,{min:b.min.toArray(),max:b.max.toArray()}];}));
 const glbPath=path.join(out,'models',variant.id+'.glb');fs.writeFileSync(glbPath,output);
 models[variant.id]={...variant,url:'./models/'+variant.id+'.glb',bytes:output.length,triangles,buildMs:performance.now()-start,structure,bounds,murals,sha256:sha(output)};
 root.traverse(o=>o.geometry?.dispose());new Set([...root.children.flatMap(g=>g.children.map(m=>m.material))]).forEach(m=>m?.dispose());
 console.log(variant.id+': '+triangles+' triangles, '+output.length+' bytes');
}
fs.writeFileSync(manifestPath,JSON.stringify({version:config.version,status:config.status,baselineSourceSha256:sha(sourceBytes),oldAIProjection:false,models},null,2)+'\n');
