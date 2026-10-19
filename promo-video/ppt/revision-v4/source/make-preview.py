"""Create a raster PDF preview from all fifteen verified slide renders."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'output/出兵·入将-设计演进增补版V4-预览.pdf'
c=canvas.Canvas(str(out),pagesize=(960,540),pageCompression=1)
c.setTitle('出兵·入将 设计演进增补版 V4 - 页面预览')
for i in range(1,16):
    src=ROOT/f'local/final-render/slide-{i:02}.png'
    if not src.exists():raise FileNotFoundError(src)
    c.drawImage(ImageReader(str(src)),0,0,width=960,height=540)
    c.showPage()
c.save()
assert len(PdfReader(out).pages)==15
print(out)
