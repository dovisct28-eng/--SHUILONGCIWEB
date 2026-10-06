const {test}=require('node:test'),assert=require('node:assert/strict');
test('archive keeps original content and explicit headings, without inventing identity',async()=>{
 const {archiveBlocks}=await import('./public/character-study.mjs');
 const a=archiveBlocks('测试名\nProvided English Name\n一、 原标题\n完整自然段\n续行\n\n下一段\n二、 另一标题\n原文',{name:'测试名'});
 assert.equal(a.englishName,'Provided English Name');assert.deepEqual(a.blocks.map(b=>b.type),['h2','p','p','p','h2','p']);assert.equal(a.blocks[1].text,'完整自然段');assert.equal(a.blocks[2].text,'续行');
 const wrong=archiveBlocks('另一人物标题\nEnglish Name\n原文',{name:'当前人物'});assert.equal(wrong.englishName,'');assert.match(wrong.blocks[0].text,/另一人物标题/);
 const md=archiveBlocks('# 图像观察\n原文 <script>alert(1)</script>\n\n- 附加资料\n> 引用',{markdown:true});assert.deepEqual(md.blocks.map(b=>b.type),['h2','p','li','blockquote']);assert.match(md.blocks[1].text,/<script>/);
 assert.equal(archiveBlocks('',{}).blocks.length,0);
});
test('Alpha boundaries include faint edges and margin; opaque/empty/malformed rejected',async()=>{
 const {alphaBounds}=await import('./public/figure-stage.mjs');
 const pixels=new Uint8ClampedArray(100*80*4);for(let y=20;y<60;y++)for(let x=30;x<70;x++)pixels[(y*100+x)*4+3]=255;pixels[(4*100+8)*4+3]=1;
 const b=alphaBounds(pixels,100,80);assert.ok(b.x<=.06&&b.y<=.025&&b.x+b.width>=.72&&b.y+b.height>=.775);
 assert.throws(()=>alphaBounds(new Uint8ClampedArray(16),2,2),/为空/);assert.throws(()=>alphaBounds(new Uint8ClampedArray(16).fill(255),2,2),/不透明/);assert.throws(()=>alphaBounds(pixels,1,2),/异常/);
});
test('Figure stage fits extreme ratios/transparent margins, reversals, normalized calibration and resize',async()=>{
 const {figureLayout,stageSafeArea,cyberConfig,particleGrid}=await import('./public/figure-stage.mjs');
 for(const [w,h] of [[1920,1080],[1440,900],[1366,768],[1280,800]])for(const ratio of [.01,.1,.4,1,3,12,100])for(const revealed of [false,true]){
  const safe=stageSafeArea(w,h,w*.64,revealed),bounds={x:.2,y:.1,width:.7,height:.8};
  for(const layout of [{},{scale:2,anchorX:0,anchorY:0,offsetX:-.5,offsetY:.5},{scale:.8,anchorX:.7,anchorY:1,offsetX:.08,offsetY:-.1}]){
   const args={width:1000*ratio,height:1000,bounds,safe,layout},a=figureLayout(args),e=a.effective;
   assert.ok(e.x>=safe.x-1e-6&&e.x+e.width<=safe.x+safe.width+1e-6&&e.y>=safe.y-1e-6&&e.y+e.height<=safe.y+safe.height+1e-6);
   assert.deepEqual(a,figureLayout(args));assert.ok(particleGrid(ratio).vertices<=80000);
  }
 }
 const c=cyberConfig({summary:'作者原文',layout:{scale:NaN,anchorY:9,offsetX:Infinity},bounds:{x:.8,y:0,width:.5,height:1}});assert.equal(c.summary,'作者原文');assert.equal(c.layout.scale,1);assert.equal(c.layout.anchorY,1);assert.equal(c.bounds,undefined);
});
test('Optional figure scan preserves old fields and metadata through position save',()=>{
 const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{scanAssets,savePosition}=require('./gallery-store.cjs');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'b03-figure-'));try{
  const dir=path.join(root,'01_测试');fs.mkdirSync(dir);const meta={id:'01',name:'作者名',order:1,category:'',sources:[],position:{x:null,y:null},cyber:{summary:'审核原文',layout:{scale:.9}},custom:{keep:true}};fs.writeFileSync(path.join(dir,'meta.json'),JSON.stringify(meta));fs.writeFileSync(path.join(dir,'org.png'),'test');
  assert.equal(scanAssets(root).data[0].figurePath,null);for(const file of ['figure.png','figure.webp'])fs.writeFileSync(path.join(dir,file),'test');let item=scanAssets(root).data[0];assert.match(item.resources.figure,/figure.webp$/);assert.equal(item.resources.figure,item.figurePath);assert.equal(item.linePath,null);
  savePosition(root,'01',{x:1,y:2},item.revision);item=scanAssets(root).data[0];assert.deepEqual(item.cyber,meta.cyber);assert.deepEqual(item.custom,meta.custom);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('sources reject executable links',async()=>{
 const {safeSourceURL}=await import('./public/character-study.mjs');
 for(const s of ['javascript:alert(1)','data:text/html,test','file:///secret','/relative',undefined])assert.equal(safeSourceURL(s),null);
 assert.equal(safeSourceURL('https://example.com/book'),'https://example.com/book');
});
test('B03 title subset has recorded bytes/hash and covers current formal names',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const base=path.join(__dirname,'public/b03'),manifest=JSON.parse(fs.readFileSync(path.join(base,'font-manifest.json'))),font=fs.readFileSync(path.join(base,manifest.file));
 assert.equal(font.subarray(0,4).toString(),'wOF2');assert.equal(font.length,manifest.bytes);assert.equal(crypto.createHash('sha256').update(font).digest('hex'),manifest.sha256);
 for(const item of require('./gallery-store.cjs').scanAssets(path.join(__dirname,'public/assets')).data)for(const c of item.name.match(/[\u3000-\u9fff]/g)||[])assert.ok(manifest.text.includes(c),c);
});
test('camera projection fits tall, wide and irregular ratios into actual layout',async()=>{
 const {cameraFit}=await import('./public/character-study.mjs');
 for(const [w,h] of [[1920,1080],[1440,900],[1366,768],[1280,800]])for(const ratio of [.3,1,3,7]){
  const right=(w<=1400?w*.32:w*.29)+(w<=1400?30:w*.04)+32;
  const {z,x}=cameraFit({width:w,height:h,planeHeight:2,planeWidth:2*ratio,right});
  const worldW=2*Math.tan(Math.PI/8)*z*w/h,worldH=worldW*h/w;
  const leftPx=w/2+(-ratio-x)/worldW*w,rightPx=w/2+(ratio-x)/worldW*w;
  assert.ok(leftPx>=30-1e-6);assert.ok(rightPx<=w-right+1e-6);assert.ok(h/2-h/worldH>=120-1e-6);
 }
});
