import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createEnvironment,createArchitectureFocus,visualState,ENVIRONMENT_ASSETS} from './environment.mjs';
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
test('headless fallback environment is separate, bounded, disposable and resizable',()=>{
  const scene=new T.Scene(),building=new T.Group();scene.add(building);
  const env=createEnvironment(T,scene);assert.equal(scene.children.length,2);
  assert.deepEqual(env.getState().groups,['Terrain','Field','Vegetation','Foreground','DistantMountains','Atmosphere']);
  assert.ok(env.getState().triangles<7000);assert.equal(env.getState().resourceRequests,0);
  const terrain=env.group.getObjectByName('Terrain').children[0];
  const alpha=terrain.geometry.getAttribute('color');
  assert.equal(alpha.getW(0),1);
  assert.ok(alpha.getW(65)<1 && alpha.getW(65)>0, 'soil must fade before its outer ring');
  assert.equal(alpha.getW(alpha.count-1),0);
  assert.equal(env.group.getObjectByName('Field').children.length,0, 'no hard-edged field strips or road');
  env.resize(1440,900,2);env.apply(visualState(14.5));assert.equal(env.group.visible,false);
  env.apply(visualState(0));assert.equal(env.group.visible,true);
  let disposed=0;env.group.traverse(m=>{if(m.isMesh)m.geometry.addEventListener('dispose',()=>disposed++);});
  env.dispose();assert.equal(scene.children.length,1);assert.ok(disposed>0);
});
test('watercolor assets load once, stay grounded, withdraw and recover with chapters',()=>{
  const pending=new Map(),textureLoader={load:(url,success,_progress,failure)=>pending.set(url,{success,failure})};
  const env=createEnvironment(T,new T.Scene(),{textureLoader});
  assert.equal(pending.size,2);assert.equal(env.getState().resourceRequests,2);
  const tree=new T.Texture(),mist=new T.Texture();
  pending.get(ENVIRONMENT_ASSETS.tree).success(tree);pending.get(ENVIRONMENT_ASSETS.mist).success(mist);
  const cards=[];env.group.traverse(m=>{if(m.name==='WatercolorTree')cards.push(m);});
  assert.equal(cards.length,6);assert.equal(new Set(cards.map(m=>m.material.map)).size,1);
  assert.ok(cards.every(m=>m.position.y===-.1 && m.geometry.attributes.position.getY(2)===0));
  assert.ok(cards.every(m=>m.material.toneMapped===false && !m.material.depthWrite));
  env.apply(visualState(14.5));assert.equal(env.group.visible,false);
  env.apply(visualState(0));assert.equal(env.group.visible,true);assert.equal(pending.size,2);
  assert.ok(env.getState().triangles<1000,'loaded billboards replace the polygon crowns');
  let freed=0;tree.addEventListener('dispose',()=>freed++);mist.addEventListener('dispose',()=>freed++);
  env.dispose();assert.equal(freed,2);
});
test('failed or late assets cannot remove fallback trees or revive disposed scene',()=>{
  const pending=new Map(),scene=new T.Scene();
  const env=createEnvironment(T,scene,{textureLoader:{load:(url,success,_p,failure)=>pending.set(url,{success,failure})}});
  pending.get(ENVIRONMENT_ASSETS.tree).failure();assert.equal(env.getState().assets.tree,'failed');
  assert.ok(env.group.getObjectByName('Vegetation').children.some(m=>m.isInstancedMesh&&m.visible));
  env.dispose();const late=new T.Texture();let freed=false;late.addEventListener('dispose',()=>freed=true);
  pending.get(ENVIRONMENT_ASSETS.mist).success(late);assert.equal(freed,true);assert.equal(scene.children.length,0);
});
test('offline watercolor assets match local web assets within the resource budget',()=>{
  const assets=JSON.parse(preview.match(/^const inlineEnvironmentAssets=(.*);$/m)[1]);let bytes=0;
  for(const [key,file] of Object.entries(ENVIRONMENT_ASSETS)){
    const local=fs.readFileSync(new URL(file,import.meta.url));bytes+=local.length;
    assert.equal(local.subarray(0,4).toString(),'RIFF');
    assert.deepEqual(Buffer.from(assets[key].split(',')[1],'base64'),local);
  }
  assert.ok(bytes<650000);
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
