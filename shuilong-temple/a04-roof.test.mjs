import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createA03Cutaway} from '../module-a/a03/cutaway.mjs';
const html=fs.readFileSync(new URL('./水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(html.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const line=html.split('\n').find(s=>s.startsWith('const moduleText='));
const source=JSON.parse(line.slice(17,line.lastIndexOf('".replaceAll(')+1));
const uri=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const T=await import(uri(source.replaceAll('./three.core.js',uri(core))));

test('A04 shared windows keep every roof opaque and restore depths after arbitrary seeks',()=>{
 const root=new T.Group(),meshes=[];
 for(const name of ['03_MainHall','04_WestGallery','05_EastGallery','06_Stage','07_Entrance']){const g=new T.Group();g.name=name;const m=new T.MeshStandardMaterial();m.userData.textureKey='roof';const mesh=new T.Mesh(new T.BoxGeometry(),m);mesh.castShadow=true;g.add(mesh);root.add(g);meshes.push(mesh);}
 const rig=createA03Cutaway(root);
 for(const storyTime of [6,20,34,45,6,45]){rig.apply(14.5,false,{storyTime,entryProgress:1,routeComplete:storyTime===45});for(const m of meshes){assert.equal(m.visible,true);assert.equal(m.material.opacity,1);assert.equal(m.material.transparent,false);assert.equal(m.material.depthWrite,true);}assert.ok(meshes.slice(3).every(m=>m.castShadow));}
 rig.apply(12.15);assert.equal(meshes[0].visible,false);rig.apply(9.65);assert.ok(meshes.every(m=>m.visible&&m.castShadow));
});
