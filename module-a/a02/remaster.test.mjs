import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createA02Light} from '../../shuilong-temple/a02-light.mjs';
const preview=fs.readFileSync(new URL('../../shuilong-temple/水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const line=preview.split('\n').find(s=>s.startsWith('const moduleText='));
const source=JSON.parse(line.slice(17,line.lastIndexOf('".replaceAll(')+1));
const uri=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const T=await import(uri(source.replaceAll('./three.core.js',uri(core))));
test('A02 local lights reset outside their chapter, preserve murals and do not accumulate tint',()=>{
 const previous=globalThis.window;globalThis.window={parent:{location:{search:''}}};
 try {
  const scene=new T.Scene();scene.fog=new T.FogExp2();
  const root=new T.Group(),group=new T.Group();root.add(group);
  const m=new T.MeshStandardMaterial();m.userData.textureKey='roof';group.add(new T.Mesh(new T.BoxGeometry(),m));
  const mural=new T.Group();mural.name='mural-02';const muralMaterial=new T.MeshBasicMaterial({color:0x987654});mural.add(new T.Mesh(new T.PlaneGeometry(),muralMaterial));root.add(mural);
  const camera=new T.PerspectiveCamera(32,2),sun=new T.DirectionalLight(),fill=new T.HemisphereLight(),renderer={toneMappingExposure:1};
  const rig=createA02Light(T,{renderer,camera,sun,fill,root,scene});
  assert.equal(scene.children.length,2);assert.ok(scene.children.every(l=>l.isPointLight&&!l.castShadow&&l.intensity===0));
  assert.equal(rig.apply(6.2),false);assert.equal(rig.apply(9.65),true);
  assert.ok(scene.children.every(l=>l.intensity>0));const color=m.color.toArray(),state=rig.getState();
  rig.reset();assert.ok(scene.children.every(l=>l.intensity===0));assert.equal(rig.apply(11.5),false);
  m.color.set(0xffffff);rig.apply(9.65);assert.deepEqual(m.color.toArray(),color);assert.deepEqual(rig.getState(),state);
  assert.equal(muralMaterial.color.getHex(),0x987654);assert.equal(rig.getState().newPostTargets,0);
 } finally {globalThis.window=previous;}
});
