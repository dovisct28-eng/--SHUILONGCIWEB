const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {scanAssets,savePosition}=require('./gallery-store.cjs'),{createApp}=require('./server.js');
test('gallery commits hide old media first and keep pressed buttons truthful, including video/none',()=>{
 const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
 const source=html.slice(html.indexOf("        let galleryMedia = 'none';"),html.indexOf('        const reducedMotion'));
 const media={},buttons=Array.from({length:3},()=>({active:false,pressed:'false',classList:{toggle(key,value){this.owner.active=value;}},setAttribute(key,value){if(key==='aria-pressed')this.pressed=value;}}));
 buttons.forEach(b=>b.classList.owner=b);
 const counts=[];
 for(const id of ['img-org','img-line','img-color','video-color']){
  let hidden=true;media[id]={};Object.defineProperty(media[id],'hidden',{get:()=>hidden,set:value=>{hidden=value;counts.push(Object.values(media).filter(i=>Object.hasOwn(i,'hidden')&&!i.hidden).length);}});
 }
 media['image-wrapper']={dataset:{}};
 const context=require('node:vm').createContext({document:{getElementById:id=>media[id],querySelectorAll:()=>buttons}});
 require('node:vm').runInContext(source,context);
 for(const type of ['org','line','color','video','org','none']){
  context.commitGalleryMedia(type);
  assert.equal(Object.values(media).filter(i=>Object.hasOwn(i,'hidden')&&!i.hidden).length,type==='none'?0:1);
  assert.deepEqual(buttons.map(b=>b.pressed),['org','line','color'].map(k=>String(k===(type==='video'?'color':type))));
 }
 assert.ok(counts.every(n=>n<=1));assert.throws(()=>context.commitGalleryMedia('invalid'));
});
function fixture(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'b02-test-'));return {root,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};}
function character(root,folder='11_测试'){const dir=path.join(root,folder);fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'org.png'),'test');return dir;}
test('scan grows progressively; absent resources, sorting, invalid metadata, duplicates and stable names',()=>{
 const f=fixture();try{
  const dir=character(f.root);let item=scanAssets(f.root).data[0];assert.equal(item.annotated,false);assert.equal(item.linePath,null);assert.equal(item.videoPath,null);
  for(const file of ['line.png','color.png','video.mp4','info.txt','info.md','org.webp'])fs.writeFileSync(path.join(dir,file),'test');
  item=scanAssets(f.root).data[0];assert.ok(item.orgPath.endsWith('org.webp'));assert.ok(item.infoPath.endsWith('info.md'));assert.ok(item.linePath&&item.colorPath&&item.videoPath);
  fs.unlinkSync(path.join(dir,'org.webp'));fs.unlinkSync(path.join(dir,'org.png'));assert.equal(scanAssets(f.root).data[0].ready,false);fs.writeFileSync(path.join(dir,'org.png'),'test');
  savePosition(f.root,'11',{x:3,y:4},item.revision);item=scanAssets(f.root).data[0];assert.equal(item.annotated,true);
  const metaPath=path.join(dir,'meta.json'),meta=JSON.parse(fs.readFileSync(metaPath));meta.name='正式名称';meta.order=2;fs.writeFileSync(metaPath,JSON.stringify(meta));
  fs.renameSync(dir,path.join(f.root,'99_重命名'));assert.equal(scanAssets(f.root).data[0].name,'正式名称');assert.equal(scanAssets(f.root).data[0].id,'11');
  const broken=character(f.root,'12_损坏');fs.writeFileSync(path.join(broken,'meta.json'),'{');assert.equal(scanAssets(f.root).diagnostics.length,1);
  const duplicate=character(f.root,'13_重复');fs.writeFileSync(path.join(duplicate,'meta.json'),JSON.stringify(meta));assert.equal(scanAssets(f.root).data.length,0);
 }finally{f.cleanup();}
});
test('atomic persistence, invalid inputs, optimistic conflicts, failure preserves bytes, unbind preserves assets',()=>{
 const f=fixture();try{
  const dir=character(f.root);let item=scanAssets(f.root).data[0];savePosition(f.root,'11',{x:10,y:20},item.revision);
  const target=path.join(dir,'meta.json'),before=fs.readFileSync(target,'utf8');item=scanAssets(f.root).data[0];
  for(const id of ['../11','../../../AGENTS.md','missing',''])assert.throws(()=>savePosition(f.root,id,{x:1,y:2},item.revision));
  for(const position of [{x:-1,y:1},{x:101,y:2},{x:null,y:2},{x:'5',y:3},{x:NaN,y:0}])assert.throws(()=>savePosition(f.root,'11',position,item.revision));
  assert.throws(()=>savePosition(f.root,'11',{x:4,y:5},'stale'));
  assert.throws(()=>savePosition(f.root,'11',{x:4,y:5},item.revision,{writeFileSync:fs.writeFileSync,renameSync(){throw Error('simulated disk failure');}}));
  assert.equal(fs.readFileSync(target,'utf8'),before);assert.ok(!fs.readdirSync(dir).some(n=>n.endsWith('.tmp')));
  savePosition(f.root,'11',{x:null,y:null},item.revision);assert.equal(scanAssets(f.root).data[0].annotated,false);assert.ok(fs.existsSync(path.join(dir,'org.png')));
 }finally{f.cleanup();}
});
test('coordinates roundtrip at all desktop sizes, zoom/pan and boundaries; dense 30/50 groups retain every ID',async()=>{
 const {initialView,clampView,imageToScreen,screenToImage,groupHotspots}=await import('./public/gallery-panorama.mjs');
 for(const [vw,vh] of [[1920,1080],[1440,900],[1366,768],[1280,800]]){
  const initial=initialView(8192,1853,vw,vh-148);assert.equal(initial.x,0);assert.ok(Math.abs(initial.scale*1853-(vh-148))<1e-9);
  for(const scale of [initial.scale,initial.scale*2,initial.scale*4])for(const x of [0,-500,-3000]){
   const view=clampView({scale,x,y:-50},8192,1853,vw,vh-148);
   for(const p of [{x:0,y:0},{x:100,y:100},{x:5.82,y:31.13},{x:50,y:50}]){
    const screen=imageToScreen(p,view,8192,1853),result=screenToImage(screen,view,8192,1853);assert.ok(result);assert.ok(Math.abs(result.x-p.x)<.00011&&Math.abs(result.y-p.y)<.00011);
   }
  }
  assert.equal(screenToImage({x:-1,y:20},initial,8192,1853),null);
  for(const count of [30,50]){const items=Array.from({length:count},(_,i)=>({id:String(i),position:{x:5+(i%10)*.1,y:20+Math.floor(i/10)*.1}}));const groups=groupHotspots(items,initial,8192,1853);assert.equal(groups.flat().length,count);assert.equal(new Set(groups.flat().map(p=>p.item.id)).size,count);}
 }
});
test('HTTP writes disabled by default; local origin/Host/token/JSON; invalid ID/position/traversal; persistence',async()=>{
 const f=fixture();character(f.root);const servers=[];
 try{
  for(const admin of [false,true]){
   const server=createApp({admin,assetsDirectory:f.root}).listen(0,'127.0.0.1');servers.push(server);await new Promise(r=>server.once('listening',r));
   const url=`http://127.0.0.1:${server.address().port}`;
   const scan=await(await fetch(url+'/api/scan-assets')).json();assert.equal(scan.adminEnabled,admin);
   const get=await fetch(url+'/api/gallery-admin/characters');if(!admin){assert.equal(get.status,403);assert.equal((await fetch(url+'/api/gallery-admin/position',{method:'POST'})).status,403);continue;}
   const result=await get.json(),headers={'Content-Type':'application/json','Origin':url,'X-Gallery-Token':result.token};
   const post=(body,extra={})=>fetch(url+'/api/gallery-admin/position',{method:'POST',headers:{...headers,...extra},body:JSON.stringify(body)});
   const body={id:'11',position:{x:5,y:6},revision:result.data[0].revision};
   for(const bad of [{Origin:'https://evil.test'},{Origin:'null'},{'X-Gallery-Token':'bad'},{'Content-Type':'text/plain'},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await post(body,bad)).status,403,JSON.stringify(bad));
   // Node fetch normalizes Host; raw HTTP is needed to exercise DNS-rebinding protection.
   const hostileHost=await new Promise((resolve,reject)=>require('node:http').get(url+'/api/gallery-admin/characters',{headers:{Host:'evil.test'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject));
   assert.equal(hostileHost,403);
   for(const id of ['../../index.html','unknown'])assert.ok((await post({...body,id})).status>=400);
   assert.equal((await post({...body,position:{x:200,y:1}})).status,400);
   assert.equal((await post(body)).status,200);assert.deepEqual(scanAssets(f.root).data[0].position,{x:5,y:6});assert.equal((await post(body)).status,409);
  }
 }finally{await Promise.all(servers.map(s=>new Promise(r=>s.close(r))));f.cleanup();}
});
