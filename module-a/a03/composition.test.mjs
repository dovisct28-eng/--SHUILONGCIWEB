import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {a03Visual,a03Frame,a03Labels} from './composition.mjs';
import {deriveA03State} from './progress.mjs';
import {createA03Light} from './lighting.mjs';
import {contrastRatio} from '../a01/ink-scene.mjs';

test('A03 influences leave both protected chapter endpoints unchanged',()=>{
  const frame={width:830,height:680};for(const n of [0,2,5.7,6.7,9.65,10.2,13.21,15,42]){
    const v=a03Visual(n);assert.equal(v.weight,0);assert.equal(v.field,0);assert.equal(v.fifth,0);
    assert.deepEqual(a03Frame(frame,1920,1080,n),frame);
  }
  assert.deepEqual(a03Frame(frame,1920,1080,13.2),{width:830,height:680.6});
});
test('all reading information establishes in order and stays static through the reading interval',()=>{
  const state=n=>deriveA03State(n*1000,1000);
  for(const n of [10.5,10.8,11]){const s=state(n),values=['kicker','title','return','introduction','purpose','hint'].map(k=>s[k]);for(let i=1;i<values.length;i++)assert.ok(values[i]<=values[i-1]);}
  for(const n of [11.2,11.6,12.1]){const s=state(n);assert.ok(['kicker','title','return','introduction','purpose','hint'].every(k=>s[k]===1));assert.deepEqual(a03Visual(n),a03Visual(11.7));assert.equal(a03Visual(n).environment,.38);}
  assert.equal(state(13.2).text,0);assert.equal(state(13.2).handoff,1);
});
test('framing and field are continuous, reversible and deterministic on arbitrary seeks',()=>{
  const frame={width:1804,height:907};let before=a03Frame(frame,1920,1080,10.2),v=a03Visual(10.2);
  for(let n=10.201;n<13.2;n+=.001){const next=a03Frame(frame,1920,1080,n),w=a03Visual(n);assert.ok(Math.abs(next.width-before.width)<5);assert.ok(Math.abs(next.height-before.height)<5);for(const key of ['field','fifth','weight'])assert.ok(Math.abs(w[key]-v[key])<.02);assert.deepEqual(a03Frame(frame,1920,1080,n),next);before=next;v=w;}
  const stops=[10.2,10.4,11,11.7,12.6,12.92,13.2];assert.deepEqual(stops.map(a03Visual),stops.toReversed().map(a03Visual).reverse());
});
test('A03 annotations keep each real projected anchor and separate crowded labels',()=>{
  for(const[w,h]of [[1920,1015],[1440,846],[1024,722]]){
    const points=['01','02','05'].map(id=>({id:`mural-${id}`,x:w*.55,y:h*.55,z:.4}));
    const result=a03Labels(points,w,h);for(const p of result){const original=points.find(q=>q.id===p.id);for(const k of ['x','y','z'])assert.equal(p[k],original[k]);assert.ok(p.lx>=66&&p.lx<=w-66);assert.ok(p.ly>=70&&p.ly<=h-65);}
    for(let i=1;i<result.length;i++)assert.ok(result[i].ly-result[i-1].ly>=46);
  }
});
test('reading colors retain contrast and add no autonomous clock or render resources',()=>{
  for(const bg of ['#10191e','#182329','#20292c'])for(const color of ['#d8d2c5','#b5b6ad','#a6aaa4'])assert.ok(contrastRatio(color,bg)>=4.5);
  for(const name of ['composition.mjs','lighting.mjs'])assert.doesNotMatch(fs.readFileSync(new URL(name,import.meta.url),'utf8'),/requestAnimationFrame|setInterval|setTimeout|TextureLoader|RenderTarget|WebGLRenderer|new T\..*Light/);
});
test('poster retains one accessible heading, approved copy and real WebGL layering',()=>{
 const view=fs.readFileSync(new URL('./view.mjs',import.meta.url),'utf8'),css=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');
 assert.equal((view.match(/<h2 /g)||[]).length,1);assert.match(view,/aria-label="出庙 · 入庙"/);assert.match(view,/data-a03-kicker>出兵入将/);
 for(const copy of ['一出一入，三铺壁画分列两侧，留下了一场迎神赛会的始与终。','队伍从庙中出发，又重新归来；出行、仪仗与祭祀，被共同留在水龙祠的墙上。'])assert.ok(view.includes(copy));
 assert.doesNotMatch(view,/研究视角|李济民|第122页|从出行与归来|03 \//);
 assert.match(css,/\.a03-poster[^}]+z-index:2/);assert.match(css,/\.a03 \{[^}]+z-index:5/);assert.doesNotMatch(css,/linear-gradient\(90deg|mask-image|animation:|backdrop-filter/);
});

const html=fs.readFileSync(new URL('../../shuilong-temple/水龙祠-交互预览.html',import.meta.url),'utf8');
const core=JSON.parse(html.match(/const coreURL=URL\.createObjectURL\(new Blob\(\[("(?:\\.|[^"\\])*")\]/s)[1]);
const line=html.split('\n').find(s=>s.startsWith('const moduleText='));
const source=JSON.parse(line.slice(17,line.lastIndexOf('".replaceAll(')+1));
const uri=s=>`data:text/javascript;base64,${Buffer.from(s).toString('base64')}`;
const T=await import(uri(source.replaceAll('./three.core.js',uri(core))));
test('A03 modifies only architectural rendering and preserves real mural materials',()=>{
  const root=new T.Group(),group=new T.Group();root.add(group);
  const material=new T.MeshStandardMaterial({color:0x998877});material.userData.textureKey='roof';group.add(new T.Mesh(new T.BoxGeometry(),material));
  const mural=new T.Group();mural.name='mural-05';const original=new T.MeshBasicMaterial({color:0x987654});mural.add(new T.Mesh(new T.PlaneGeometry(),original));root.add(mural);
  const scene=new T.Scene();scene.fog=new T.FogExp2(0xe7e5df,.007);const renderer={toneMappingExposure:1};
  const camera=new T.PerspectiveCamera(34,1.9),sun=new T.DirectionalLight(),fill=new T.HemisphereLight(),floor={material:{opacity:.15}};
  const rig=createA03Light(T,{root,scene,renderer,camera,sun,fill,floor});const base=material.color.clone();
  rig.apply(10.2);assert.deepEqual(material.color,base);assert.equal(renderer.toneMappingExposure,1);
  rig.apply(11.7);const reading=material.color.clone();assert.equal(renderer.toneMappingExposure,1);assert.equal(camera.fov,31.5);assert.deepEqual(material.color,base);assert.equal(original.color.getHex(),0x987654);assert.equal(scene.children.length,0);
  material.color.copy(base);renderer.toneMappingExposure=1;rig.apply(11.7);assert.deepEqual(material.color,reading,'restored base does not accumulate tint');
  rig.apply(13.2);assert.deepEqual(material.color,reading,'endpoint has zero influence');
});
