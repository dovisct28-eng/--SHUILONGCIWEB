"""Actual exported-frame evidence, bounded SSIM and all editorial cut handles."""
import io,json,subprocess,hashlib
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
base=Path(__file__).resolve().parents[1];ff=base/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
final=base/'previews/preview-v3-150s.mp4';local=base/'local/v3-review';local.mkdir(parents=True,exist_ok=True)
selected=base.parent/'docs/validation/promo-video-v3/selected';selected.mkdir(parents=True,exist_ok=True)
keyframes=[('a01',230),('a02',620),('a03',780),('a04-fifth',1000),('a04-first',1160),('a04-second',1280),('b02-panorama',2000),('b02-original',2240),('b02-line',2390),('b02-color',2660),('b03-dwell',3239),('b03-reading',3630),('ending',4420)]
plan=json.loads((base/'planning/timeline-v3-150s.json').read_text(encoding='utf-8'))
cuts=[x['startFrame'] for x in plan['shots'][1:]]+[2160,2340,2445,2685,3240,3600,3870]
def frame(file,f):
    b=subprocess.check_output([str(ff),'-v','error','-ss',str(f/30),'-i',str(file),'-frames:v','1','-c:v','png','-f','image2pipe','pipe:1'])
    return Image.open(io.BytesIO(b)).convert('RGB')
def sheet(rows,file,columns=4,width=480):
    height=width*9//16;out=Image.new('RGB',(width*columns,((len(rows)+columns-1)//columns)*(height+26)),'#151515');d=ImageDraw.Draw(out)
    for i,(fileName,f,label) in enumerate(rows):
        im=frame(fileName,f);im.thumbnail((width,height));x=i%columns*width;y=i//columns*(height+26);out.paste(im,(x,y));d.text((x+7,y+height+5),label,fill='white')
    out.save(file,quality=90)
for name,f in keyframes:
    im=frame(final,f);im.save(local/f'{name}-f{f}.png');im.save(selected/f'{name}-f{f}.webp',lossless=True)
sheet([(final,f,f'V3 F{f} {f/30:.3f}s {name}')for name,f in keyframes],local/'overview.jpg')
for page in range(0,len(cuts),4):
    rows=[]
    for cut in cuts[page:page+4]:
        for offset in [-30,-1,0,1,15,30]:
            f=min(4499,max(0,cut+offset));rows.append((final,f,f'cut F{cut}, offset {offset:+d}, F{f}'))
    sheet(rows,local/f'cuts-{page//4+1}.jpg',columns=6,width=400)
old=base/'previews/preview-v2-130s-revised.mp4'
sheet([(old,2609,'V2 OPEN -1 F2609'),(old,2610,'V2 OPEN trigger F2610'),(final,3599,'V3 OPEN -1 F3599'),(final,3600,'V3 OPEN trigger F3600')],selected/'open-continuity-before-after.jpg',columns=2,width=960)
sheet([(old,939,'V2 A04 -1 F939'),(old,940,'V2 A04 cut F940'),(final,1035,'V3 A04 F1035'),(final,1036,'V3 A04 F1036')],selected/'a04-continuity-before-after.jpg',columns=2,width=960)
# No overlays in these exact source/export comparison frames.
pairs=[('wire','a01-a03',100,100),('space','a01-a03',620,620),('theme','a01-a03',780,780),('tour','a04-complete',290,1160),('mural','a06',60,1608),('gallery-original','b02-full',400,2230),('gallery-line','b02-full',560,2390)]
metrics=[]
for name,source,sf,df in pairs:
    a=np.asarray(frame(base/f'recordings/v3/{source}.mp4',sf)).astype(float);b=np.asarray(frame(final,df)).astype(float);mse=float(np.mean((a-b)**2));mae=float(np.mean(np.abs(a-b)))
    # Non-overlapping 8x8 luma SSIM; not the full sliding-window reference SSIM.
    def blocks(rgb):
        y=rgb@np.array([.299,.587,.114]);return y.reshape(135,8,240,8).transpose(0,2,1,3).reshape(-1,64)
    x,y=blocks(a),blocks(b);mx=x.mean(1);my=y.mean(1);vx=x.var(1);vy=y.var(1);cov=((x-mx[:,None])*(y-my[:,None])).mean(1)
    ss=((2*mx*my+6.5025)*(2*cov+58.5225))/((mx*mx+my*my+6.5025)*(vx+vy+58.5225))
    metrics.append({'label':name,'sourceFrame':sf,'exportFrame':df,'mae8bit':mae,'psnrDb':float(10*np.log10(255**2/max(mse,1e-10))),'block8LumaSSIM':float(ss.mean())})
report={'source':final.name,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'actualFrameComparisons':metrics,'reviewedCutFrames':cuts,'selectedFiles':[{'name':p.name,'bytes':p.stat().st_size}for p in selected.iterdir()],'limits':['Block SSIM is one bounded metric, not perceptual approval or all-frame identity OCR.','All cut sheets include actual export frames from -1s through +1s; full-resolution PNGs stay local.']}
(base/'docs/v3-frame-review.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2))
