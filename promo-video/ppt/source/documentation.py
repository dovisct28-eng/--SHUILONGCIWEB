"""Export copy and an immutable-file delivery manifest from the actual final files."""
from pathlib import Path
import hashlib,json,zipfile
from xml.etree import ElementTree as E

BASE=Path(__file__).resolve().parents[1]
PPTX=BASE/'output/chubing-rujiang-e-category.pptx'
NS={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
copy=['# 正式 PPTX 原生文字存档','本文件直接从最终 PPTX 提取。图像内的网页原有文字不在此列；重要说明、标题与技术图形均为独立可编辑对象。']
stats=[]
with zipfile.ZipFile(PPTX) as z:
 for i in range(1,13):
  s=E.fromstring(z.read(f'ppt/slides/slide{i}.xml'));copy.append(f'\n## P{i:02}')
  for shape in s.findall('.//p:sp',NS):
   paras=[''.join(p.itertext()) for p in shape.findall('.//a:p',NS)]
   t='\n'.join(paras).strip()
   if t:copy.append('\n'+t+'\n')
  stats.append({'slide':i,'nativeTextBoxes':len(s.findall('.//p:sp/p:txBody',NS)),'nativeShapes':len(s.findall('.//p:sp',NS)),'replaceableImages':len(s.findall('.//p:pic',NS))})
(BASE/'content/slide-copy.md').write_text('\n'.join(copy).rstrip()+'\n',encoding='utf-8')
paths=[PPTX,BASE/'output/chubing-rujiang-e-category.pdf',BASE/'preview/contact-sheet.png',*sorted((BASE/'preview/slides').glob('slide-*.png'))]
files=[{'file':str(p.relative_to(BASE)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'gitArchive':'local only' if 'output' in p.parts or p.parent.name=='slides' else 'tracked selected overview'} for p in paths]
(BASE/'qa/delivery-manifest.json').write_text(json.dumps({'date':'2026-10-15','baseline':'1374d3c25be6d62c44abbbf63bb4f8618d614503','slideCount':12,'files':files,'editability':stats,'pdfPreview':'static image PDF; no selectable text','powerPointNativeExecution':'not tested','materialCompetitionPermission':'pending verification'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
textcount=sum(s['nativeTextBoxes'] for s in stats);shapes=sum(s['nativeShapes'] for s in stats);images=sum(s['replaceableImages'] for s in stats)
doc=f'''# 最终交付记录

2026-10-15，12页16:9参赛PPT制作完成。正文与图形验收已通过，素材许可及PowerPoint原生应用复核仍有下述边界。

| 交付物 | 本机位置（相对本目录） | 字节数 |
|---|---|---:|
| 可编辑PPTX | `output/chubing-rujiang-e-category.pptx` | {paths[0].stat().st_size} |
| PDF静态预览 | `output/chubing-rujiang-e-category.pdf` | {paths[1].stat().st_size} |
| 12页高清PNG | `preview/slides/slide-01.png` 至 `slide-12.png` | 见JSON清单 |
| 总览 | `preview/contact-sheet.png` | {paths[2].stat().st_size} |
| 制作源文件 | `source/build.cjs`及同目录脚本 | 见README |
| 文案与素材来源 | `content/` | 原生文案从最终PPTX提取 |
| 验收与制作记录 | `qa/` | Skill、内容、视觉、匿名、PDF与包检查 |

PPTX含{textcount}个原生文字框、{shapes}个原生形状（含文字框）、{images}个可替换图片对象，无隐藏附页。主要流程、箭头与技术节点可编辑，网页截图内的原有UI是图像。所有源素材哈希复查未变，没有镜像/调色滤镜。

通过：anthropics PPT Skill Office XML验证、额外包完整性、布局/字体/边界、最终12页实际导入渲染、9项定制验收、实际Chrome图鉴采集及PDF12页回渲逐像素对照。PDF对照差值全部为0。独立验证的结构发现和布局警告均为0。

制作使用用户安装的 `anthropics/skills` 中 `pptx`，PptxGenJS负责可编辑制作；补充presentations工具负责导入渲染与质量闸门；PDF Skill负责ReportLab/pypdf/PDFium组装与回渲。详情见skill-usage.md。

未解决事项：

- 未在Microsoft PowerPoint或LibreOffice中打开；当前环境无可用执行程序。使用两套结构验证和实际独立渲染，不伪报原生应用验收。
- PDF是与预览一致的静态图像版，文字不可选择；编辑使用PPTX。直接PDF导出器缺失内部Helvetica依赖，已记录替代方法。
- 素材参赛使用许可待权利人核实；赛事全套规则以主办方文件为准。
- 体感图示是最终视频预设动画，不能证明现场摄像头识别精度或稳定性；P09已在页面内说明。

范围与归档：新增修改均限定本PPT目录。没有开发网页、改动B03输入代码、母版、模型、视频或ChatCut工程。成品与完整预览保留本地并明确忽略；源代码、文案、素材清单、验收、总览和三张精选提交Git。P09采用两个小状态加一个简介主图，属于任务书允许的版式调整，其余页次/主题未变化。

Git：开始与交付前远程master均核实为`1374d3c25be6d62c44abbbf63bb4f8618d614503`。本次commit/push后的SHA和独立远程核实写入本机`local/git-delivery.json`及最终交付消息；本记录不在push之前冒充同步成功。所有最终文件的SHA256见delivery-manifest.json。
'''
(BASE/'qa/final-delivery.md').write_text(doc,encoding='utf-8')
print(f'Native text boxes: {textcount}; shapes: {shapes}; images: {images}; manifest written')
