"""Export copy and an immutable-file delivery manifest from the actual final files."""
from pathlib import Path
import hashlib,json,zipfile
from xml.etree import ElementTree as E

BASE=Path(__file__).resolve().parents[1]
PPTX=BASE/'output/chubing-rujiang-e-category-v2.pptx'
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
paths=[PPTX,BASE/'output/chubing-rujiang-e-category-v2.pdf',BASE/'preview/contact-sheet.png',*sorted((BASE/'preview/slides').glob('slide-*.png'))]
files=[{'file':str(p.relative_to(BASE)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'gitArchive':'local only' if 'output' in p.parts or p.parent.name=='slides' else 'tracked selected overview'} for p in paths]
(BASE/'qa/delivery-manifest.json').write_text(json.dumps({'date':'2026-10-15','baseline':'d546ef3e4685e3db551dec73a5c65022ce46ce47','slideCount':12,'files':files,'editability':stats,'pdfPreview':'static image PDF; no selectable text','powerPointNativeExecution':'not tested','materialCompetitionPermission':'pending verification'},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
textcount=sum(s['nativeTextBoxes'] for s in stats);shapes=sum(s['nativeShapes'] for s in stats);images=sum(s['replaceableImages'] for s in stats)
print(f'Native text boxes: {textcount}; shapes: {shapes}; images: {images}; manifest written')
