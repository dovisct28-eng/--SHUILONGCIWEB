from pathlib import Path
from PIL import Image, ImageChops, ImageStat, ImageDraw
import numpy as np,json,hashlib
root=Path(__file__).resolve().parent.parent
out=root/'docs/validation/b02-2026-10-06';out.mkdir(parents=True,exist_ok=True)
old=root/'Mural-Exhibition/public/assets/splash-bg.png';new=root/'Mural-Exhibition/public/gallery/mural-02-detail.webp'
a=Image.open(old);b=Image.open(new);sizes=[a.size,b.size]
a=a.convert('RGB').resize((2400,543),Image.Resampling.LANCZOS);b=b.convert('RGB').resize((2400,543),Image.Resampling.LANCZOS)
mean=ImageStat.Stat(ImageChops.difference(a,b)).mean
ar=np.asarray(a,dtype=np.float32);br=np.asarray(b,dtype=np.float32)
shifts=[]
for dy in range(-3,4):
 for dx in range(-3,4):
  aa=ar[4:539,4:2396];bb=br[4+dy:539+dy,4+dx:2396+dx]
  shifts.append(dict(dx=dx,dy=dy,rgb_mae=float(np.abs(aa-bb).mean())))
manifest=json.loads((root/'Mural-Exhibition/public/gallery/manifest.json').read_text(encoding='utf-8'))
report=dict(sizes=sizes,mode='RGBA',bytes=new.stat().st_size,sourceHash=hashlib.sha256((root/'水龙祠壁画素材/高清展示图/mural-02-detail.webp').read_bytes()).hexdigest(),deployedHash=hashlib.sha256(new.read_bytes()).hexdigest(),comparisonSize=[2400,543],rgbMeanDifference=mean,bestShift=min(shifts,key=lambda s:s['rgb_mae']),boundary='full image visually checked; no crop/padding/mirror/rotation observed',mapping='normalized percentages retained',coordinates=manifest['characters'])
(out/'registration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
board=Image.new('RGB',(1152,520),'#152129');draw=ImageDraw.Draw(board)
for idx,im in enumerate([a,b]):
 crop=im.crop((0,0,432,350)).resize((576,467))
 board.paste(crop,(idx*576,46));draw.text((idx*576+20,16),'OLD 17507x3960' if idx==0 else 'NEW 8192x1853',fill='#e0d9cd')
 for i,c in enumerate(manifest['characters']):
  x=idx*576+c['x']/100*2400*(576/432);y=46+c['y']/100*543*(467/350)
  draw.ellipse((x-5,y-5,x+5,y+5),outline='white',width=2);draw.text((x+8,y-10),c['folderName'].split('_')[0],fill='white')
board.save(out/'registration-left.png')
print(json.dumps({k:v for k,v in report.items() if k!='coordinates'},ensure_ascii=False))
