import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve('promo-video/ppt/revision-v4/local/runtime.cjs'));
const {Presentation,PresentationFile}=require('@oai/artifact-tool');
const root=path.resolve('promo-video/ppt/revision-v4');
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#101519',ink:'#EEE8DA',accent:'#C9B69A',muted:'#AFB4B1'};
function text(s,name,value,x,y,w,h,size=24,color=C.ink,font='微软雅黑'){
  const t=s.shapes.add({geometry:'textbox',name,position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  t.text=value;t.text.style={typeface:font,fontSize:size,color,wrap:'none',autoFit:'none',insets:0};return t;
}
function base(step,num,title,sub){
  const s=p.slides.add();s.background.fill=C.bg;
  text(s,'section',`设计过程 · ${step}`,64,32,900,28,16,C.accent);
  text(s,'page-number',num,1192,32,48,28,16,C.muted);
  text(s,'title',title,64,95,1150,68,48,C.ink,'宋体');
  text(s,'subtitle',sub,64,169,1150,38,22,C.muted);return s;
}
async function img(s,file,x,y,w,h){
  const b=await fs.readFile(path.join(root,'assets',file));
  s.images.add({blob:b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),contentType:file.endsWith('webp')?'image/webp':'image/png',alt:file,fit:'contain',position:{left:x,top:y,width:w,height:h}});
}
{
 const s=base('草稿规划','05','先规划观看顺序与页面关系','Figma 早期草稿用占位图组织建筑、壁画与探索入口。');
 const items=[['figma-early-hero.png','建筑开场','确定建筑与标题的构图关系'],['figma-early-space.png','空间与路线','讨论三幅壁画的位置和衔接'],['figma-early-explore.png','探索交接','在导读末端设置模块 B 入口']];
 for(let i=0;i<3;i++){let x=64+i*390;text(s,'stage-'+i,items[i][1],x,226,370,32,24,C.accent);await img(s,items[i][0],x,273,370,263.12);text(s,'caption-'+i,items[i][2],x,558,370,62,20);}
 text(s,'evolution-note','后续调整：开场由滚动进度控制；壁画位置认知与观看路线分章展开。',64,655,1150,32,18,C.muted);
 s.speakerNotes.text='来源：Figma 原始画板 https://www.figma.com/design/1oSGGtdcJY92KlzOdhLEpJ/Untitled ，节点 14:7、25:7、14:38。2026-10-19 从原文件导出。参照 docs/A01_STORYBOARD.md、docs/A02_DESIGN_REVIEW.md。早期草稿中的自动旋转、章节分配与文化解释属于当时方案，不能作为当前实现规格或已核实历史事实。';
}
{
 const s=base('低保真验证','06','低保真先验证连续导读','低保真阶段重点验证滚动推进、建筑到壁画的衔接，以及章节边界。');
 await img(s,'lofi-hero.png',64,231,560,350);await img(s,'lofi-space.png',656,231,560,350);
 text(s,'left-label','建筑开场与阅读停留',64,596,560,36,25,C.accent);
 text(s,'left-caption','验证模型呈现、文字进入和继续滚动的节奏。',64,642,560,48,20,C.muted);
 text(s,'right-label','壁画位置与空间参照',656,596,560,36,25,C.accent);
 text(s,'right-caption','先建立建筑位置认知，再进入逐幅图像导读。',656,642,560,48,20,C.muted);
 s.speakerNotes.text='真实低保真阶段浏览器验收截图：docs/validation/a01/a01-reading-1440x900.png、docs/validation/a02/core-1440x900.png。此处是开发过程的阶段截图，不声称逐像素等同最终冻结归档。最终低保真固定基线见 docs/LOFI_ARCHIVE.md，commit 48f272497e86e4549c5bcd0dee275ff347171a3f。低保真验证连续滚动与可逆章节衔接，不等同于用户研究或现场体感验证。';
}
{
 const s=base('当前界面','07','当前界面与视觉完善','保留建筑定位与逐幅观看的逻辑，将模型、文字和真实壁画整合到界面中。');
 await img(s,'current-hero.png',64,230,738,461.25);
 await img(s,'current-mural.png',834,230,382,238.75);
 text(s,'detail-title','视觉呈现的推进',834,492,382,38,27,C.accent);
 text(s,'detail-body','建筑开场加入环境与材质。\n壁画导读强化层级与阅读节奏。\n原始壁画保持可追溯。',834,547,382,116,21,C.muted);
 s.speakerNotes.text='当前实现阶段留档：docs/validation/copy-update-2026-10-05/a01-1440x900.png；docs/validation/a05-a08-editorial-2026-10-06/after/a05-opening-1440x900.webp。2026-10-19 选取真实项目浏览器截图，未绘制假界面，未重绘或重色壁画。此页展示已实现的界面阶段，不是对未决功能、审美或摄像头现场识别的最终验收结论。';
}
await fs.mkdir(path.join(root,'local'),{recursive:true});
await (await PresentationFile.exportPptx(p)).save(path.join(root,'local/additions.pptx'));
for(const [i,s] of p.slides.items.entries()){
 await fs.writeFile(path.join(root,'local',`new-${i+1}.png`),new Uint8Array(await (await p.export({slide:s,format:'png',scale:1.5})).arrayBuffer()));
}
console.log('Created three editable process slides.');
