"""Mask only roof/bare masonry outside the visible plaster, then trim canvas.

Reuses revision-2 RGB pixels and homography; no second RGB interpolation.
"""
import json
from pathlib import Path
import runpy
import hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageChops

HERE=Path(__file__).resolve().parent
ROOT=next(p for p in HERE.parents if (p/'AGENTS.md').exists())
OUT=HERE/'revision-3'
OUT.mkdir(exist_ok=True)
api=runpy.run_path(str(HERE/'revise-candidates.py'),run_name='crop_helpers')
spec=json.loads((HERE/'revision-2/mural-03-front.json').read_text(encoding='utf-8'))
# Source-space boundary follows the visible grey plaster, not colored motifs.
top=[[30,130],[160,128],[315,121],[480,118],[640,118],[800,111],[960,112],[1120,105],[1280,103]]
bottom=[[0,711],[25,720],[55,732],[110,730],[165,729],[205,737],[240,729],[285,729],[330,729],[368,723],[379,688],[430,689],[480,693],[545,693],[600,696],[650,696],[720,701],[800,702],[850,712],[883,730],[915,744],[950,752],[1000,754],[1050,751],[1100,750],[1155,751],[1190,741],[1220,739],[1260,746],[1280,750]]
polygon=top+list(reversed(bottom))+[[0,650]]
with Image.open(ROOT/spec['source']) as raw,Image.open(HERE/'revision-2'/spec['candidate']) as before:
    mask=Image.new('L',raw.size,0);ImageDraw.Draw(mask).polygon([tuple(p) for p in polygon],fill=255)
    _,inverse,size=api['transform_parameters'](spec)
    mapped=mask.crop((0,96,1280,760)).transform(size,Image.Transform.PERSPECTIVE,tuple(inverse.flatten()[:8]),Image.Resampling.BILINEAR,fillcolor=0)
    clean=before.copy();clean.putalpha(ImageChops.darker(before.getchannel('A'),mapped))
    bounds=clean.getchannel('A').getbbox();after=clean.crop(bounds)
    after.save(OUT/'mural-03-clean-candidate.png',icc_profile=before.info.get('icc_profile'))
    # Preserve color samples wherever the new mask retains the photograph.
    a=np.asarray(after);b=np.asarray(before.crop(bounds));assert np.array_equal(a[:,:,:3],b[:,:,:3])
    marked=raw.copy();draw=ImageDraw.Draw(marked);draw.line([tuple(p) for p in polygon]+[tuple(polygon[0])],fill='#54f3c2',width=3)
    marked.save(OUT/'mural-03-plaster-boundary.webp',lossless=True,icc_profile=raw.info.get('icc_profile'))
    api['sheet']('第三铺壁画 · 去掉屋檐与裸砖',[(before,'上一版','保留了屋檐和砖基'),(marked,'灰皮边界','只遮掉外部建筑区域'),(after,'新裁切候选',f'{after.width} × {after.height} · 保留真实残损')],
                 '边缘按灰皮自然轮廓保留；不补绘、不改色、不切掉波浪纹与红色边带。','mural-03-clean-comparison.jpg')
record={'id':'mural-03','revision':3,'status':'preview-awaiting-user-confirmation','source':spec['source'],'sourceSha256':spec['sourceSha256'],
        'base':'../revision-2/mural-03-front-candidate.png','sourcePlasterPolygon':polygon,'rectifiedCanvasCrop':list(bounds),'output':[after.width,after.height],
        'candidate':'mural-03-clean-candidate.png','candidateSha256':hashlib.sha256((OUT/'mural-03-clean-candidate.png').read_bytes()).hexdigest(),
        'rgbResampledAgain':False,'alpha':'boundary-only mask; bilinear edge antialiasing; no content fill','uncertainty':'Manual photo boundary candidate; keep damage and plaster margins, not a measured heritage outline'}
(OUT/'mural-03-crop.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'output':record['output'],'bounds':bounds}))
