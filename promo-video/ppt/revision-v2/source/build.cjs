const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const rt=require('../../source/runtime.cjs');
const pptxgen=rt.loadPptxGenJS(),sharp=rt.requireBundle('sharp');
const base=path.resolve(__dirname,'..'),oldAssets=path.join(rt.base,'assets/processed'),assets=path.join(base,'assets');
for(const dir of ['local','output','preview/slides','qa','content','assets'])fs.mkdirSync(path.join(base,dir),{recursive:true});
const P=new pptxgen();P.layout='LAYOUT_WIDE';P.author='';P.company='';P.title='出兵 · 入将';P.subject='水龙祠壁画数字交互设计';P.lang='zh-CN';
P.theme={headFontFace:'SimSun',bodyFontFace:'Microsoft YaHei',lang:'zh-CN'};
const C={bg:'101519',white:'EEE8DA',muted:'AFB4B1',gold:'C9B69A',line:'65716D'};
const S=P.ShapeType;let current=0;const geometry=[],manifest=[];
function text(slide,str,x,y,w,h,size=18,color=C.white,opt={}){
 slide.addText(str,{x,y,w,h,fontFace:opt.serif?'SimSun':'Microsoft YaHei',fontSize:size,color,margin:0,wrap:true,valign:'top',paraSpaceAfter:0,...opt});
 geometry.push({slide:current,type:'text',text:str,x,y,w,h,size});
}
function rect(slide,x,y,w,h,color,transparency=0){slide.addShape(S.rect,{x,y,w,h,line:{color,width:0},fill:{color,transparency}});}
function line(slide,x1,y1,x2,y2,color=C.line,width=.9,arrow=false){slide.addShape(S.line,{x:x1,y:y1,w:x2-x1,h:y2-y1,line:{color,width,...(arrow?{endArrowType:'triangle'}:{})}});}
function ring(slide,x,y,d,width=1.1,color=C.gold){slide.addShape(S.ellipse,{x,y,w:d,h:d,line:{color,width},fill:{color:C.bg,transparency:100}});}
function dot(slide,x,y,d=.06){slide.addShape(S.ellipse,{x:x-d/2,y:y-d/2,w:d,h:d,line:{color:C.gold,width:0},fill:{color:C.gold}});}
function slide(n,label){current=n;const s=P.addSlide();s.background={color:C.bg};text(s,label,.65,.32,10,.28,11.5,C.gold);text(s,String(n).padStart(2,'0'),12.12,.32,.55,.28,11.5,C.muted,{align:'right'});return s;}
function title(s,str,x=.65,y=.92,w=12,h=1.05,size=36){text(s,str,x,y,w,h,size,C.white,{serif:true});}
function foot(s,str){text(s,str,.65,7.04,12.0,.3,11.5,C.muted);}
function notes(s,str){s.addNotes(str);}
async function image(s,name,x,y,w,h,fit='contain'){
 const file=fs.existsSync(path.join(assets,name+'.png'))?path.join(assets,name+'.png'):path.join(oldAssets,name+'.png');
 const m=await sharp(file).metadata(),hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const f=Math.min(1,fit==='cover'?Math.max(w*190/m.width,h*190/m.height):Math.min(w*190/m.width,h*190/m.height));
 const alpha=m.hasAlpha,embedded=path.join(assets,`${name}-${hash.slice(0,10)}-${w}-${h}-${fit}.${alpha?'png':'jpg'}`);
 if(!fs.existsSync(embedded)){let img=sharp(file).resize({width:Math.round(m.width*f),withoutEnlargement:true});await(alpha?img.png():img.jpeg({quality:97,chromaSubsampling:'4:4:4'})).toFile(embedded);}
 const em=await sharp(embedded).metadata(),scale=Math.min(w/em.width,h/em.height);
 const box=fit==='cover'?{x,y,w:em.width/144,h:em.height/144,sizing:{type:'cover',w,h}}:{x:x+(w-em.width*scale)/2,y:y+(h-em.height*scale)/2,w:em.width*scale,h:em.height*scale};
 s.addImage({path:embedded,...box,altText:name});
 geometry.push({slide:current,type:'image',name,x,y,w,h,fit,actualBox:box});manifest.push({slide:current,name,source:path.relative(rt.root,file).replaceAll('\\','/'),sha256:hash,sourceSize:[m.width,m.height],embeddedSize:[em.width,em.height],fit,box:[x,y,w,h],treatment:'Crop/aspect-preserving downsample only; no repaint, filter, flip or recolor'});
 return box;
}
async function prepare(){
 await sharp(path.join(oldAssets,'mural-02.png')).extract({left:380,top:0,width:1750,height:1357}).png().toFile(path.join(assets,'mural-portrait.png'));
 await sharp(path.join(oldAssets,'gesture-dwell.png')).extract({left:1025,top:780,width:280,height:280}).png().toFile(path.join(assets,'dwell-detail.png'));
 await sharp(path.join(oldAssets,'gesture-open.png')).extract({left:830,top:165,width:980,height:720}).png().toFile(path.join(assets,'reading-detail.png'));
}

async function p01(){
 const s=slide(1,'E 类 · 智能科技类');
 await image(s,'mural-portrait',7.65,0,5.683333,7.5,'cover');
 text(s,'01',6.35,.32,.55,.28,11.5,C.muted,{align:'right'});
 title(s,'出兵 · 入将',.65,1.42,7.0,1.2,57);
 text(s,'水龙祠壁画数字交互设计',.72,2.8,6.5,.45,22,C.muted);
 text(s,'让壁画，\n从静态观看走向主动探索。',.72,4.0,6.15,1.0,23);
 await image(s,'mural-02',.72,5.72,6.15,1.39);
 notes(s,'封面以真实第二幅壁画的局部与全幅建立尺度关系。右侧局部来自原图left380/top0/1750×1357，左下为完整图像。未镜像、换色、生成或修复。');
}
async function p02(){
 const s=slide(2,'设计背景');
 await image(s,'mural-portrait',0,.94,5.1,6.56,'cover');
 title(s,'从文化遗产\n到数字体验',5.75,1.02,6.5,1.52,39);
 text(s,'湖南江永 · 勾蓝瑶水龙祠',5.8,2.9,6.6,.4,19,C.gold);
 text(s,'让观众先理解壁画所处空间，\n再自主进入图像与人物细节。',5.8,3.53,6.6,.85,22);
 await image(s,'architecture-crop',6.0,4.58,6.45,2.05);
 text(s,'空间认知',5.8,6.78,2.12,.32,17,C.muted);
 text(s,'图像理解',8.1,6.78,2.12,.32,17,C.muted);
 text(s,'主动参与',10.4,6.78,2.12,.32,17,C.muted);
 notes(s,'地点及文化对象沿用已核实项目资料。本页为空间认知、图像理解、主动参与的设计问题定义，不是用户研究结论。大图为真实壁画局部，小图为既有项目建筑模型。');
}
async function p03(){
 const s=slide(3,'设计理念');title(s,'从静态观看，到主动探索',.65,.94,12,1,39);
 await image(s,'model',.65,2.25,4.0,2.7);
 await image(s,'mural-02',5.12,2.39,7.55,1.71);
 await image(s,'figure',9.1,4.03,3.45,2.86);
 text(s,'01',.65,5.24,.5,.3,13,C.gold);text(s,'空间叙事',.65,5.68,3.8,.5,27,C.white,{serif:true});text(s,'在建筑中理解壁画位置。',.65,6.4,4.3,.5,18,C.muted);
 line(s,4.3,3.65,4.92,3.65,C.gold,1,true);
 text(s,'02',5.13,4.58,.5,.3,13,C.gold);text(s,'数字图鉴',5.13,5.02,3.45,.5,27,C.white,{serif:true});text(s,'从完整图像，进入人物。',5.13,5.75,3.9,.65,18,C.muted);
 line(s,8.3,4.6,8.84,4.6,C.gold,1,true);
 text(s,'03  体感参与',9.1,7.0,3.1,.3,15,C.gold);
 notes(s,'空间、图像、人物的尺度递进是设计结构示意，不是三幅壁画物理排列。建筑为本轮从既有Three.js场景导出的真实模型，人物为项目既有数字表达figure.png。体感输入为单手光标与目标驻留。');
}
async function p04(){
 const s=slide(4,'交互体验架构');
 title(s,'先建立观看语境',.65,1.0,6.3,.7,34);title(s,'再交还探索权',8.3,1.0,4.5,.7,34);
 text(s,'模块 A · 叙事引导',.65,1.97,6.5,.4,18,C.gold);text(s,'模块 B · 交互探索',8.3,1.97,4.4,.4,18,C.gold);
 const rows=[['architecture-crop','01','建筑与壁画','进入水龙祠 / 建筑空间认知 / 壁画位置'],['route','02','主题与空间路线','出兵 · 入将 / 第五幅 → 第一幅 → 第二幅'],['mural-02','03','逐幅图像导读','第五幅、第一幅、第二幅均完成独立导读']];
 for(const[i,[img,no,t,b]]of rows.entries()){const y=2.7+i*1.37;await image(s,img,.65,y,2.05,1.15);text(s,no,3.05,y+.05,.5,.3,13,C.gold);text(s,t,3.63,y,3.7,.45,22,C.white,{serif:true});text(s,b,3.05,y+.63,4.5,.63,16,C.muted);}
 line(s,7.55,3.95,8.03,3.95,C.gold,1.2,true);text(s,'点击进入',7.13,4.29,1.15,.3,12.5,C.gold,{align:'center'});
 await image(s,'b02-panorama',8.3,2.73,4.39,2.47);text(s,'图鉴探索',8.3,5.32,2.3,.4,22,C.white,{serif:true});
 await image(s,'gesture-open',10.0,5.64,2.69,1.51);text(s,'体感交互',8.3,6.11,1.65,.4,21,C.white,{serif:true});
 notes(s,'以三组梳理已实现A01–A08旅程，保持真实章节与第五幅→第一幅→第二幅顺序。主动入口进入模块B后选择图鉴/体感，不虚构第三模块。');
}
async function p05(){
 const s=slide(5,'建筑空间叙事');
 title(s,'让壁画回到\n建筑空间之中',.65,1.05,6.2,1.65,39);
 const box=await image(s,'model',3.5,1.66,9.45,5.4);
 // Project wall anchors projected by the unchanged Three.js scene, then adjusted for trim.
 const wall=(px,py)=>[box.x+(px-492)/1607*box.w,box.y+(py-136)/1105*box.h];
 const a=wall(1451.2769269932971,316.880107670767),b=wall(768.1933482280637,630.8616219413487),c=wall(1093.6953498262071,897.7824983134066);
 for(const [p,lx,ly,label]of [[a,8.15,1.14,'第一幅'],[b,4.9,2.84,'第二幅'],[c,10.55,6.25,'第五幅']]){dot(s,...p,.075);if(lx<p[0])line(s,lx+.18,ly+.42,...p,C.gold,.8);else line(s,...p,lx+.18,ly+.42,C.gold,.8);text(s,label,lx,ly,1.35,.35,16,C.gold);}
 text(s,'在院落、墙面与镜头之间，\n建立连续的空间关系。',.7,3.21,3.75,.95,21,C.muted);
 text(s,'三维建筑',.7,4.9,2.8,.4,19,C.white);text(s,'建立院落与建筑关系',.7,5.43,3.1,.4,16,C.muted);
 text(s,'位置标注 / 滚动视角',.7,6.19,3.65,.4,19,C.gold);
 foot(s,'既有模型用于空间展示，非测绘认证的历史原貌复原。壁面位置为项目坐标投影，局部受屋顶遮挡。');
 notes(s,'既有模型、材质与相机来自当前网页A02状态。只在导出帧中隐藏外围环境及地面，以透明图片独立排版，网页业务和原模型未改。三个核心壁面的关系以项目原位置数据为准。');
}
async function p06(){
 const s=slide(6,'壁画叙事设计');title(s,'沿着壁画，阅读出行与归来',.65,.94,12,1,37);
 const rows=[['05','第五幅','mural-05','数字路线的起点，完成整体介绍与独立导读'],['01','第一幅','mural-01','沿空间路线转向与行进，保留独立完整观看'],['02','第二幅《入将图》','mural-02','导读结束后，由用户主动进入人物探索']];
 for(const[i,[no,t,img,desc]]of rows.entries()){const y=2.04+i*1.55;const x=i===2?3.55:4.28,w=i===2?9.14:8.41;text(s,no,.65,y-.08,1.5,.85,45,C.gold,{serif:true});text(s,t,.65,y+.81,i===2?3.0:1.75,.5,19,C.white);await image(s,img,x,y,w,1.04,'cover');text(s,desc,x,y+1.16,w,.34,16,C.muted);if(i<2)line(s,2.65,y+.91,2.65,y+1.29,C.line,.9,true);}
 foot(s,'三幅均由右端巡视至左端。图示为真实局部；第五幅→第一幅→第二幅是项目数字路线，非已证实的历史仪式。');
 notes(s,'完整图像来自三幅真实display.webp，保持原方向。长卷局部按行串联的是数字导读顺序，不是三幅同墙。创意线索出庙、行进、归来不作为第一幅具体历史情节的断言。');
}
async function p07(){
 const s=slide(7,'数字图鉴探索');title(s,'从全景，走进人物',.65,.94,9.0,1,39);
 await image(s,'b02-panorama',.65,2.25,9.13,5.14);
 rect(s,8.33,3.68,4.7,3.58,C.bg);
 await image(s,'b02-detail',8.57,3.86,4.11,2.31);
 text(s,'人物档案',8.57,6.37,3.9,.4,24,C.white,{serif:true});
 text(s,'缩放 / 拖动平移',10.3,2.33,2.6,.75,18,C.gold);
 text(s,'热点选择\n人物索引\n详情阅读',10.3,3.0,2.5,1.05,17,C.muted);
 line(s,6.5,4.0,8.28,4.0,C.gold,.9,true);
 notes(s,'两张均为上一轮实际Chrome采集的真实B02界面。主图保留全景，较大的详情图形成尺度递进；连接线表示通过热点进入人物档案，不是伪造网页按钮或新功能。截图和原有功能未改。');
}
async function p08(){
 const s=slide(8,'多层图像对照');title(s,'看清同一人物的三个层次',.65,.94,12,1,37);
 const xs=[.65,4.87,9.09],arr=[['person-org','原图','保留现存图像信息'],['person-line','线稿','强调形态与线条结构'],['person-color','数字色稿','项目整理后的数字表达']];
 for(const[i,[img,t,b]]of arr.entries()){await image(s,img,xs[i],2.25,3.59,3.77);text(s,t,xs[i],6.22,3.59,.45,25,C.white,{serif:true});text(s,b,xs[i],6.83,3.59,.35,15.5,C.muted);}
 notes(s,'三图保持上一版匹配裁切，均为同一人物同一像素区域。数字色稿是设计表达，非历史原色复原。原图与数字表达不混用身份；人物称谓只沿用已有项目标签。');
}
async function p09(){
 const s=slide(9,'体感交互设计');
 title(s,'停留，\n让选择被确认',.65,1.0,5.7,1.7,41);
 await image(s,'figure',4.55,1.15,4.25,4.75);
 text(s,'单手光标',.7,3.38,3.5,.45,25,C.white,{serif:true});text(s,'识别操作人与控制手，\n映射并平滑显示光标。',.7,4.0,3.7,.85,18,C.muted);
 await image(s,'dwell-detail',.7,5.15,1.35,1.35);
 text(s,'驻留确认',2.32,5.29,2.65,.45,23,C.gold);text(s,'目标激活 → 进度反馈\n确认后移开释放',2.32,5.89,3.35,.76,16,C.muted);
 await image(s,'gesture-open',9.1,1.62,3.58,2.02);
 text(s,'选择人物',9.1,3.96,3.4,.38,20,C.white);text(s,'驻留“下一人物”目标。',9.1,4.47,3.4,.36,16,C.muted);
 text(s,'查看简介',9.1,5.17,3.4,.38,20,C.white);text(s,'驻留查看 / 收起目标。',9.1,5.68,3.4,.36,16,C.muted);
 foot(s,'人物与界面来自既有数字表达；状态图为预设流程动画。现场摄像头验收待完成。');
 notes(s,'大人物来自项目既有figure.png，非新生成图像。驻留细节为实际最终V4 F3839的底部目标原图裁切，未重画进度或伪造摄像头识别结果。设计图解呈现单手控制、目标驻留及界面反馈。');
}
async function p10(){
 const s=slide(10,'交互技术与系统实现');title(s,'输入如何成为反馈',.65,.94,10,1,39);
 text(s,'A  空间叙事',.65,2.25,3.1,.4,21,C.gold);text(s,'HTML / CSS / JavaScript\nThree.js + 滚动进度\n摄像机与视觉状态控制',.65,2.91,4.1,1.2,17,C.muted);
 text(s,'B  图鉴数据',5.1,2.25,3.1,.4,21,C.gold);text(s,'大图坐标 / 缩放平移\n热点与人物数据关联\n原图 / 线稿 / 数字色稿',5.1,2.91,4.1,1.2,17,C.muted);
 text(s,'C  体感输入链',9.55,2.25,3.15,.4,21,C.gold);text(s,'有效输入才累计驻留。\n失效、过期或归属不明\n即中止当前进度。',9.55,2.91,3.15,1.2,17,C.muted);
 const x=[.65,2.73,4.81,6.89,8.97,11.05],zh=['人体与手部','操作人跟踪','控制手归属','光标映射','目标驻留','界面反馈'],en=['MediaPipe\nHands / Pose','OperatorTracker','HandOwnership','GesturePointer','DwellController','NEXT / OPEN\nCLOSE'];
 for(let i=0;i<6;i++){if(i===4){ring(s,x[i]-.13,4.45,1.97,1.5);}text(s,zh[i],x[i],4.98,1.65,.5,i===4?22:18,i===4?C.gold:C.white,{align:'center',serif:true});text(s,en[i],x[i]-.05,5.7,1.75,.8,12.5,C.muted,{align:'center'});if(i<5)line(s,x[i]+1.76,5.25,x[i+1]-.13,5.25,C.gold,1,true);}
 foot(s,'当前驻留1000ms、释放250ms为校准配置，非性能实测。体感部分组件与模型资源依赖网络。');
 notes(s,'实际调用链由index.html、OperatorTracker、HandOwnership、GesturePointer、DwellController核对。MediaPipeHands/Pose观测输入→操作人→控制手→光标→驻留→界面反馈。环形仅强调驻留模块，属于可编辑逻辑图，不是测试进度。物理摄像头验收未完成。');
}
async function p11(){
 const s=slide(11,'宣传视频剧本与制作流程');title(s,'把交互组织成\n一段完整体验',.65,1.0,3.55,1.5,32);
 text(s,'173',.65,2.86,3.5,1.25,65,C.gold,{serif:true});text(s,'秒',2.95,3.58,.6,.5,20,C.gold);
 text(s,'真实网页采集\nChatCut 剪辑与混音\nRemotion 动态文字\nH.264 / 1080p / 30fps',.7,4.71,3.4,1.66,17,C.muted);
 const data=[['00:00–00:34','architecture','建筑开场'],['00:34–01:18','route','路线与壁画导读'],['01:18–01:57','recap','图鉴探索'],['01:57–02:31','gesture-open','体感流程展示'],['02:31–02:47','architecture-crop','功能回顾'],['02:47–02:53','ending','主题收束']];
 for(const[i,[time,img,t]]of data.entries()){const x=4.25+(i%3)*3.01,y=1.88+Math.floor(i/3)*2.62;text(s,time,x,y,2.65,.3,13,C.gold);await image(s,img,x,y+.48,2.65,1.49);text(s,t,x,y+2.12,2.65,.4,18,C.white,{serif:true});}
 notes(s,'173秒六段时码严格沿用最终V4剧本。ChatCut负责时间线、字幕与混音；Remotion负责动态文字与状态可视化；真实网页采集对应图鉴交互，体感片段仍为预设流程动画。视频合成与网页技术分开解释。');
}
async function p12(){
 const s=slide(12,'创新价值 · 生态设计与可持续创新');title(s,'让传统壁画\n持续被看见',.65,1.0,7.5,1.75,43);
 const items=[['叙事','连接建筑空间与壁画观看'],['交互','以图鉴与体感提供不同观看方式'],['复用','持续组织图像与人物，用于展示传播']];
 for(const[i,[a,b]]of items.entries()){const y=1.1+i*.96;text(s,a,8.0,y,1.0,.4,20,C.gold);text(s,b,9.06,y,3.62,.65,16,C.muted);}
 await image(s,'mural-02',0,4.33,13.333333,3.015);
 notes(s,'文化资源持续利用是设计贡献与可拓展路径，不是已证实的社会传播成效或环境收益。完整真实第二幅壁画收束体验，保持原色和方向。');
}
async function main(){await prepare();const fns=[p01,p02,p03,p04,p05,p06,p07,p08,p09,p10,p11,p12],pages=process.argv.includes('--benchmarks')?[1,5,9]:fns.map((_,i)=>i+1);for(const n of pages)await fns[n-1]();const dest=path.join(base,'local',pages.length===3?'benchmarks.pptx':'candidate.pptx');await P.writeFile({fileName:dest,compression:true});fs.writeFileSync(path.join(base,'local/geometry.json'),JSON.stringify(geometry,null,2));fs.writeFileSync(path.join(base,'content/asset-manifest.json'),JSON.stringify(manifest,null,2));console.log(dest);}
main().catch(e=>{console.error(e);process.exitCode=1;});
