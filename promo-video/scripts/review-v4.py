"""Actual decoded output: keyframes, each cut/action handle, motion ROIs and source fidelity."""
import io,json,subprocess,hashlib,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
from importlib.util import spec_from_file_location,module_from_spec
base=Path(__file__).resolve().parents[1];ff=base/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe';final=base/'previews/preview-v4-173s.mp4'
local=base.parent/'docs/validation/promo-video-v4/local';local.mkdir(parents=True,exist_ok=True);selected=base.parent/'docs/validation/promo-video-v4/selected';selected.mkdir(parents=True,exist_ok=True)
plan=json.loads((base/'planning/timeline-v4.json').read_text(encoding='utf-8'))
spec=spec_from_file_location('motion',base/'scripts/motion-audit.py');module=module_from_spec(spec);spec.loader.exec_module(module)
cuts=sorted(set([s['startFrame']for s in plan['shots'][1:]]+[c['start']for c in plan['captions']]+[e['frame']for e in plan['galleryEvents']]+[e[k]for e in plan['gestureEvents']for k in ['dwellStartFrame','triggerFrame','releaseFrame']]))
keyframes=[('opening',100),('web-title',269),('theme-attack',747),('space-fifth',1200),('space-first',1400),('space-second',1600),('mural-fifth',1820),('mural-first',2010),('mural-second',2220),('entry',2339),('gallery-line',2920),('gallery-color',3100),('gesture-dwell',3839),('gesture-open',4200),('recap-space',4610),('recap-gallery',4760),('recap-gesture',4930),('ending',5110)]
thumbnailFrames=sorted(set([f for _,f in keyframes]+[max(0,min(plan['durationFrames']-1,c+o))for c in cuts for o in [-30,-1,0,1,15,30]]+list(range(0,5190,30))))
sourceSha=hashlib.sha256(final.read_bytes()).hexdigest()
cache=local/'frame-cache'/sourceSha[:16];cache.mkdir(parents=True,exist_ok=True)
if not all((cache/f'{f}.png').exists()for f in thumbnailFrames):
 # Bundled FFmpeg has scale but no select/crop filters. Decode every frame;
 # retain the requested frames in Python, without unsupported-filter hangs.
 wanted=set(thumbnailFrames)
 command=[str(ff),'-v','error','-i',str(final),'-an','-vf','scale=480:270','-vsync','0','-c:v','png','-f','image2pipe','pipe:1']
 count=0
 for f,pixels in enumerate(module.png_frames(command,mode='RGB')):
  if f in wanted:Image.fromarray(pixels.astype('uint8'),'RGB').save(cache/f'{f}.png');count+=1
 assert count==len(thumbnailFrames),'thumbnail decoding coverage'
 print('single-pass contact-frame cache',count,flush=True)
def frame(file,f):
 data=subprocess.check_output([str(ff),'-v','error','-ss',str(f/30),'-i',str(file),'-frames:v','1','-c:v','png','-f','image2pipe','pipe:1']);return Image.open(io.BytesIO(data)).convert('RGB')
def sheet(rows,file,cols=4,width=480):
 height=width*9//16;out=Image.new('RGB',(width*cols,((len(rows)+cols-1)//cols)*(height+26)),'#151515');d=ImageDraw.Draw(out)
 for i,(f,label)in enumerate(rows):
  im=Image.open(cache/f'{f}.png').convert('RGB');im.thumbnail((width,height));x=i%cols*width;y=i//cols*(height+26);out.paste(im,(x,y));d.text((x+7,y+height+5),label,fill='white')
 out.save(file,quality=92)
for name,f in keyframes:frame(final,f).save(selected/f'{name}-f{f}.webp',lossless=True)
sheet([(f,f'F{f} {f/30:.3f}s {name}')for name,f in keyframes],local/'overview.jpg')
for page in range(0,len(cuts),4):
 rows=[(max(0,min(plan['durationFrames']-1,cut+off)),f'cut {cut} offset {off:+d}')for cut in cuts[page:page+4]for off in [-30,-1,0,1,15,30]];sheet(rows,local/f'cut-handles-{page//4+1}.jpg',cols=6,width=400)
# Complete 1-second survey, explicitly not a claim of continuous human viewing.
for start in range(0,173,16):sheet([(f*30,f'{f}s / F{f*30}')for f in range(start,min(start+16,173))],local/f'whole-film-{start:03}.jpg')
pairs=[('opening-environment','a01-a03',210,210),('theme','a03-theme-r2',87,747),('route','a04-complete',360,1380),('mural05','a05',100,1810),('mural01','a06',100,1990),('mural02','a07',130,2200),('gallery','b02-full',420,2759)]
metrics=[]
for label,src,sf,df in pairs:
 a=np.asarray(frame(base/f'recordings/v4/{src}.mp4',sf)).astype(float);b=np.asarray(frame(final,df)).astype(float);mse=float(np.mean((a-b)**2))
 def blocks(rgb):return (rgb@np.array([.299,.587,.114])).reshape(135,8,240,8).transpose(0,2,1,3).reshape(-1,64)
 x,y=blocks(a),blocks(b);mx=x.mean(1);my=y.mean(1);vx=x.var(1);vy=y.var(1);cov=((x-mx[:,None])*(y-my[:,None])).mean(1);ss=((2*mx*my+6.5025)*(2*cov+58.5225))/((mx*mx+my*my+6.5025)*(vx+vy+58.5225))
 metrics.append({'label':label,'sourceFrame':sf,'exportFrame':df,'psnrDb':float(10*np.log10(255**2/max(mse,1e-10))),'block8LumaSSIM':float(ss.mean())})
spec=spec_from_file_location('motion',base/'scripts/motion-audit.py');module=module_from_spec(spec);spec.loader.exec_module(module)
rois=[('wire',2.2,1,'1500:850:210:80'),('tour-turn',41.2,2.6,None),('mural05-scan',59.7,2,None),('mural01-scan',65.7,2,None),('mural02-establish-and-scan',72,2,None),('mural02-active-pan',73.2,1.3,None),('gallery-drag',82.1,2,'1800:850:60:100'),('next',128.1,1,'900:700:470:100'),('open',139.05,.7,'1500:750:100:80'),('close',148.05,.7,'1500:750:100:80'),('dwell',127.05,.8,'160:160:1080:820')]
def analyze_roi(start,duration,crop):
 command=[str(ff),'-v','error','-ss',str(start),'-i',str(final),'-t',str(duration),'-an','-vf','scale=960:540','-vsync','0','-c:v','png','-f','image2pipe','pipe:1']
 prev=None;diffs=[]
 for pixels in module.png_frames(command):
  if crop:
   w,h,x,y=map(int,crop.split(':'));pixels=pixels[y//2:(y+h)//2,x//2:(x+w)//2]
  pixels=np.asarray(Image.fromarray(pixels.astype('uint8'),'L').resize((320,180))).astype(float)
  if prev is not None:diffs.append(float(np.abs(pixels-prev).mean()))
  prev=pixels
 duplicate=np.array(diffs)<.035;runs=[];begin=None
 for i,flag in enumerate(list(duplicate)+[False]):
  if flag and begin is None:begin=i
  if not flag and begin is not None:
   if i-begin>=2:runs.append({'fromPair':begin,'toPair':i,'pairs':i-begin})
   begin=None
 return {'startSeconds':start,'durationSeconds':duration,'cropOriginalPixels':crop,'decodedFrames':len(diffs)+1,'nearDuplicatePairs':int(duplicate.sum()),'candidateFreezeRuns':runs,'differenceThreshold':.035,'method':'decode960x540 then Python ROI, compare luma320x180','limits':['Reading holds and subpixel easing require editorial classification; not an optical-flow or live-performance test.']}
motion=[]
for name,start,duration,crop in rois:
 r=analyze_roi(start,duration,crop);r['name']=name;(local/f'motion-{name}.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8');motion.append(r);print(name,r['nearDuplicatePairs'],r['decodedFrames'],flush=True)
r={'source':final.name,'sha256':hashlib.sha256(final.read_bytes()).hexdigest(),'actualFrameComparisons':metrics,'checkedCutAndActionFrames':cuts,'motion':motion,'selectedFiles':[{'name':p.name,'bytes':p.stat().st_size}for p in selected.iterdir()],'reviewStatus':'AUTOMATED_AND_SAMPLED_REVIEW_HUMAN_CONTINUOUS_AV_PENDING','limits':['Every decoded frame is technically checked separately; visual review uses cut handles and a 1-second survey.','No claim of full-frame OCR, continuous human watching, actual audio listening or physical-camera performance.','B02 existing digital-content notice is retained by explicit user confirmation; B03 labels removed.']}
(base/'docs/v4-frame-review.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8');print(json.dumps({'sha256':r['sha256'],'selected':len(r['selectedFiles']),'cutActions':len(cuts),'fidelity':metrics},indent=2))
