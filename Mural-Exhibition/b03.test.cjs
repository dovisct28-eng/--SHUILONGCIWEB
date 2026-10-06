const {test}=require('node:test'),assert=require('node:assert/strict');
test('archive keeps original content and explicit headings, without inventing identity',async()=>{
 const {archiveBlocks}=await import('./public/character-study.mjs');
 const a=archiveBlocks('测试名\nProvided English Name\n一、 原标题\n完整自然段\n续行\n\n下一段\n二、 另一标题\n原文',{name:'测试名'});
 assert.equal(a.englishName,'Provided English Name');assert.deepEqual(a.blocks.map(b=>b.type),['h2','p','p','p','h2','p']);assert.equal(a.blocks[1].text,'完整自然段');assert.equal(a.blocks[2].text,'续行');
 const wrong=archiveBlocks('另一人物标题\nEnglish Name\n原文',{name:'当前人物'});assert.equal(wrong.englishName,'');assert.match(wrong.blocks[0].text,/另一人物标题/);
 const md=archiveBlocks('# 图像观察\n原文 <script>alert(1)</script>\n\n- 附加资料\n> 引用',{markdown:true});assert.deepEqual(md.blocks.map(b=>b.type),['h2','p','li','blockquote']);assert.match(md.blocks[1].text,/<script>/);
 assert.equal(archiveBlocks('',{}).blocks.length,0);
});
test('sources reject executable links',async()=>{
 const {safeSourceURL}=await import('./public/character-study.mjs');
 for(const s of ['javascript:alert(1)','data:text/html,test','file:///secret','/relative',undefined])assert.equal(safeSourceURL(s),null);
 assert.equal(safeSourceURL('https://example.com/book'),'https://example.com/book');
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
