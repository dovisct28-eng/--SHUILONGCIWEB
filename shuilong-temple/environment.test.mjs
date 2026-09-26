import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEnvironment,createArchitectureFocus,visualState} from './environment.mjs';
const preview=fs.readFileSync(new URL('./水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(preview.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const line=preview.split('\n').find(l=>l.startsWith('const moduleText='));
const moduleText=JSON.parse(line.slice('const moduleText='.length,line.lastIndexOf('".replaceAll(')+1));
const url=text=>`data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
const T=await import(url(moduleText.replaceAll('./three.core.js',url(core))));

test('chapter states withdraw environment continuously and reverse exactly',()=>{
  const points=[5.7,9.8,12.9,14.5,18,37];const forward=points.map(n=>visualState(n));
  assert.deepEqual(points.toReversed().map(n=>visualState(n)).toReversed(),forward);
  for(let i=1;i<forward.length;i++)assert.ok(forward[i].environmentOpacity<=forward[i-1].environmentOpacity);
  assert.equal(forward[0].foregroundOpacity,1);assert.ok(forward[1].foregroundOpacity<.02);
  assert.equal(visualState(14.5,{entryProgress:1,target:'mural-01'}).environmentOpacity,0);
  for(let n=13.2;n<14;n+=.001)assert.ok(Math.abs(visualState(n).environmentOpacity-visualState(n+.001).environmentOpacity)<.002);
});
test('environment is separate, bounded, resource-free, disposable and resizable',()=>{
  const scene=new T.Scene(),building=new T.Group();scene.add(building);
  const env=createEnvironment(T,scene);assert.equal(scene.children.length,2);
  assert.deepEqual(env.getState().groups,['Terrain','Field','Vegetation','Foreground','DistantMountains','Atmosphere']);
  assert.ok(env.getState().triangles<7000);assert.equal(env.getState().resourceRequests,0);
  env.resize(1440,900,2);env.apply(visualState(14.5));assert.equal(env.group.visible,false);
  env.apply(visualState(0));assert.equal(env.group.visible,true);
  let disposed=0;env.group.traverse(m=>{if(m.isMesh)m.geometry.addEventListener('dispose',()=>disposed++);});
  env.dispose();assert.equal(scene.children.length,1);assert.ok(disposed>0);
});
test('visual hierarchy never changes mural colors or geometry, and restores on reverse',()=>{
  const root=new T.Group();
  for(const name of ['03_MainHall','07_Entrance','mural-05']){const g=new T.Group();g.name=name;g.add(new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({color:0xcccccc})));root.add(g);}
  const mural=root.children[2].children[0],original=mural.material.color.clone(),focus=createArchitectureFocus(T,root);
  focus(visualState(0));const entry=root.children[1].children[0].material.color.clone();
  focus(visualState(14.5,{entryProgress:1,target:'mural-05'}));assert.ok(mural.material.color.equals(original));
  assert.ok(root.children[1].children[0].material.color.r<root.children[0].children[0].material.color.r);
  focus(visualState(0));assert.ok(root.children[1].children[0].material.color.equals(entry));
});
test('offline environment module matches source',()=>{
  const literal=preview.match(/const inlineEnvironment=("(?:\\.|[^"\\])*");/)[1];
  assert.equal(JSON.parse(literal),fs.readFileSync(new URL('./environment.mjs',import.meta.url),'utf8'));
  assert.match(preview,/map:texture,toneMapped:false,fog:false,alphaMap:muralMask/);
});
