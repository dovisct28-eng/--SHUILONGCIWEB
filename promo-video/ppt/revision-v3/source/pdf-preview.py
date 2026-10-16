"""Assemble the inspected PPTX renders into a static, anonymous PDF preview."""
from pathlib import Path
from io import BytesIO
import json,sys
import numpy as np
from PIL import Image
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
import pypdfium2 as pdfium

BASE=Path(__file__).resolve().parents[1]
files=sorted((BASE/'preview/slides').glob('slide-*.png'))
assert len(files)==12
raw=BytesIO()
c=Canvas(raw,pagesize=(960,540),pageCompression=1,invariant=1)
c.setAuthor('');c.setCreator('');c.setTitle('出兵 · 入将')
for file in files:
    assert Image.open(file).size==(1920,1080)
    c.drawImage(ImageReader(str(file)),0,0,width=960,height=540)
    c.showPage()
c.save();raw.seek(0)
w=PdfWriter();w.clone_document_from_reader(PdfReader(raw))
w.add_metadata({'/Title':'出兵 · 入将','/Author':'','/Creator':'','/Producer':'','/Subject':'水龙祠壁画数字交互设计'})
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else BASE/'output/出兵·入将-独立阅读评审版V3.pdf'
if out.exists():raise FileExistsError(f'Use a new filename for a revision: {out}')
with out.open('wb') as f:w.write(f)
doc=pdfium.PdfDocument(str(out));assert len(doc)==12
results=[];rend=BASE/'local/pdf-roundtrip';rend.mkdir(exist_ok=True)
for i,page in enumerate(doc):
    img=page.render(scale=2).to_pil().convert('RGB');img.save(rend/f'page-{i+1:02}.png')
    source=Image.open(files[i]).convert('RGB')
    diff=np.abs(np.array(img,dtype=np.int16)-np.array(source,dtype=np.int16))
    results.append({'page':i+1,'size':img.size,'meanAbsoluteChannelDifference':float(diff.mean()),'maxDifference':int(diff.max())})
    assert diff.mean()<1.0
reader=PdfReader(out)
assert len(reader.pages)==12
assert not reader.metadata.get('/Author') and not reader.metadata.get('/Creator')
(BASE/'qa/pdf-review.json').write_text(json.dumps({'status':'PASS','method':'Inspected PPTX rendered images, lossless PDF image assembly, PDFium render roundtrip','pdfTextIsSelectable':False,'reason':'Static PDF assembled from inspected PPTX renders; PPTX remains editable. Native PowerPoint execution was not tested.','pages':results,'metadata':dict(reader.metadata)},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(out)
