"""Decode real outputs, collect equal-frame comparisons and check audio timing.
Metrics are block-8 luma SSIM, not VMAF or standard sliding-window SSIM.
All full-size comparisons/contact sheets stay local; a small selection is archived.
"""
import io,json,subprocess,hashlib,struct,wave,math,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
import importlib.util
BASE=Path(__file__).resolve().parents[1]
FF=BASE/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
PROBE=FF.with_name('ffprobe.exe')
LOCAL=BASE.parent/'docs/validation/promo-video-v4-final/local'
SELECTED=LOCAL.parent/'selected'
OUT=BASE/'renders/v4-final'
KEYS=[('opening',100),('architecture',530),('theme',780),('route-fifth',1200),('route-first',1400),('route-second',1600),('mural-fifth',1820),('mural-first',2010),('mural-second',2220),('gallery-original',2840),('gallery-line',2920),('gallery-animation',3100),('gesture-dwell',3839),('gesture-open',4200),('gesture-close',4480),('recap-gallery',4760),('recap-gesture',4930),('ending',5115)]

def frame(file,f):
    raw=subprocess.check_output([str(FF),'-v','error','-ss',str(f/30),'-i',str(file),'-frames:v','1','-c:v','png','-f','image2pipe','pipe:1'])
    return Image.open(io.BytesIO(raw)).convert('RGB')

def pngs(command):
    proc=subprocess.Popen(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    def read(size):
        parts=[]
        while size:
            block=proc.stdout.read(size)
            if not block:raise EOFError('Truncated PNG decode')
            parts.append(block);size-=len(block)
        return b''.join(parts)
    while True:
        signature=proc.stdout.read(8)
        if not signature:break
        assert signature==b'\x89PNG\r\n\x1a\n';parts=[signature]
        while True:
            header=read(8);size,kind=struct.unpack('>I4s',header);parts.extend([header,read(size+4)])
            if kind==b'IEND':break
        yield Image.open(io.BytesIO(b''.join(parts))).convert('RGB')
    error=proc.stderr.read().decode(errors='replace');assert proc.wait()==0,error

def pcm(file):
    raw=subprocess.check_output([str(FF),'-v','error','-i',str(file),'-vn','-ac','2','-ar','48000','-c:a','pcm_s16le','-f','wav','pipe:1'])
    with wave.open(io.BytesIO(raw)) as w:return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(np.float32)/32768

def similarity(a,b):
    x=np.asarray(a).astype(float);y=np.asarray(b).astype(float)
    mse=float(np.mean((x-y)**2))
    def blocks(rgb):
        luma=rgb@np.array([.299,.587,.114]);h,w=luma.shape;h=h//8*8;w=w//8*8
        return luma[:h,:w].reshape(h//8,8,w//8,8).transpose(0,2,1,3).reshape(-1,64)
    x,y=blocks(x),blocks(y);mx=x.mean(1);my=y.mean(1);vx=x.var(1);vy=y.var(1);cov=((x-mx[:,None])*(y-my[:,None])).mean(1)
    ssim=((2*mx*my+6.5025)*(2*cov+58.5225))/((mx*mx+my*my+6.5025)*(vx+vy+58.5225))
    return {'block8LumaSSIM':float(ssim.mean()),'psnrDb':float(10*np.log10(255**2/max(mse,1e-10)))}

def pair(a,b,target,caption,crop=None):
    if crop:a=a.crop(crop);b=b.crop(crop)
    else:a=a.resize((960,540),Image.Resampling.LANCZOS);b=b.resize((960,540),Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(a.width*2,a.height+50),'#11191d');canvas.paste(a,(0,50));canvas.paste(b,(a.width,50));d=ImageDraw.Draw(canvas)
    d.text((15,12),'MASTER | '+caption,fill='white');d.text((a.width+15,12),'50 MB | same decoded frame',fill='white')
    canvas.save(target,lossless=True)

def decode(file):
    # Bundled FFmpeg omits wrapped_avframe (null muxer's default encoder).
    # Explicit PNG/PCM encoders still decode every video/audio frame before discard.
    command=[str(FF),'-v','error','-xerror','-i',str(file),'-map','0:v:0','-map','0:a:0','-vf','scale=64:36','-c:v','png','-c:a','pcm_s16le','-f','null','NUL']
    result=subprocess.run(command,capture_output=True)
    return {'passed':result.returncode==0 and not result.stderr,'exitCode':result.returncode,'stderr':result.stderr.decode(errors='replace'),'method':'Full video and audio decode; explicit PNG/PCM encoders to null output'}

def decode_report(file):
    info=json.loads(subprocess.check_output([str(PROBE),'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(file)]))
    v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
    decoded=decode(file)
    means=[]
    for im in pngs([str(FF),'-v','error','-i',str(file),'-an','-vf','scale=64:36','-vsync','0','-c:v','png','-f','image2pipe','pipe:1']):means.append(float(np.asarray(im).mean()))
    black=[i for i,x in enumerate(means) if x<2]
    audio=pcm(file);peak=float(np.abs(audio).max());rms=float(np.sqrt(np.mean(audio**2)))
    tail=audio[-48000:];last_rms=float(np.sqrt(np.mean(audio[-4800:]**2)))
    checks={'decode':decoded['passed'],'frames':int(v['nb_read_frames'])==len(means)==5190,'1080pH264':(v['width'],v['height'],v['codec_name'],v['pix_fmt'])==(1920,1080,'h264','yuv420p'),'30fps':v['r_frame_rate']==v['avg_frame_rate']=='30/1','aac48k':a['codec_name']=='aac' and a['sample_rate']=='48000','duration':60<=float(info['format']['duration'])<=180,'AVDurationWithinOneFrame':abs(float(a['duration'])-float(v['duration']))<1/30,'noInternalBlack':all(f>=5160 for f in black),'noClippedPCM':peak<.999,'audiblePCM':rms>.0001,'tailFades':last_rms<float(np.sqrt(np.mean(tail[:4800]**2)))}
    return {'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size,'MB':file.stat().st_size/1e6,'checks':checks,'decode':decoded,'probe':info,'blackFrames':black,'peakDbFS':20*math.log10(max(peak,1e-12)),'rmsDbFS':20*math.log10(max(rms,1e-12)),'last100msDbFS':20*math.log10(max(last_rms,1e-12))},audio

def main():
    LOCAL.mkdir(parents=True,exist_ok=True);SELECTED.mkdir(parents=True,exist_ok=True)
    master=OUT/'chubing-rujiang-v4-master.mp4';small=OUT/'chubing-rujiang-v4-50mb.mp4'
    reports=[];audios=[]
    for file in [master,small]:
        print('decode',file.name,flush=True);r,a=decode_report(file);reports.append(r);audios.append(a)
    metrics=[]
    crops={'opening':(400,320,1360,800),'mural-second':(400,300,1360,780),'gallery-line':(280,300,1240,780),'gallery-animation':(280,320,1240,800),'gesture-open':(750,230,1710,710),'ending':(480,760,1440,1080)}
    for name,f in KEYS:
        a=frame(master,f);b=frame(small,f);a.save(LOCAL/f'{name}-master-f{f}.png');b.save(LOCAL/f'{name}-50mb-f{f}.png')
        row={'name':name,'frame':f,'seconds':f/30,**similarity(a,b)};metrics.append(row)
        pair(a,b,LOCAL/f'compare-{name}.webp',f'{name} F{f} {f/30:.3f}s')
        if name in crops:
            pair(a,b,SELECTED/f'compare-{name}-100pct.webp',f'{name} F{f} 1:1 crop',crops[name])
            row['detailCrop']=crops[name];row['detailMetrics']=similarity(a.crop(crops[name]),b.crop(crops[name]))
        if name in ['opening','architecture','theme','route-second','mural-second','ending','gallery-animation','gallery-line','gesture-open']:
            a.save(SELECTED/f'{name}-master-f{f}.webp',lossless=True)
    # Every-second survey plus all cut/action handles, decoded once per file.
    plan=json.loads((BASE/'planning/timeline-v4.json').read_text(encoding='utf-8'))
    cuts=sorted(set([s['startFrame'] for s in plan['shots'][1:]]+[c['start'] for c in plan['captions']]+[e['frame'] for e in plan['galleryEvents']]+[5010,5040,5070,5100,5160,5189]))
    wanted=set(range(0,5190,30))|{max(0,min(5189,c+o)) for c in cuts for o in [-30,-1,0,1,15,30]}
    for label,file in [('master',master),('50mb',small)]:
        cache={}
        for f,im in enumerate(pngs([str(FF),'-v','error','-i',str(file),'-an','-vf','scale=480:270','-vsync','0','-c:v','png','-f','image2pipe','pipe:1'])):
            if f in wanted:cache[f]=im.copy()
        rows=sorted(cache)
        for start in range(0,len(rows),24):
            sheet=Image.new('RGB',(1920,6*294),'#12191d');d=ImageDraw.Draw(sheet)
            for i,f in enumerate(rows[start:start+24]):
                x=i%4*480;y=i//4*294;sheet.paste(cache[f],(x,y));d.text((x+8,y+274),f'{label} F{f} {f/30:.3f}s',fill='white')
            sheet.save(LOCAL/f'survey-{label}-{start//24:02}.jpg',quality=92)
    # Native soundtrack is unchanged. Compare decoded timing against the original V4.
    baseline=pcm(BASE/'previews/preview-v4-173s.mp4')
    correlations=[]
    for name,audio in zip(['master','50mb'],audios):
        n=min(len(audio),len(baseline));x=baseline[:n].mean(1)[::48];y=audio[:n].mean(1)[::48]
        values=[]
        for lag in range(-67,68):
            a=x[67:-67];b=y[67+lag:len(y)-67+lag];values.append(float(np.corrcoef(a,b)[0,1]))
        best=int(np.argmax(values))-67;correlations.append({'file':name,'offsetMilliseconds':best,'correlation':max(values),'withinOneFrame':abs(best)<1000/30})
    # Compare selected unchanged sections against the V4 visual baseline.
    preservation=[]
    for f in [100,530,780,1200,1820,2010,2220,3839,4200,4930]:
        preservation.append({'frame':f,**similarity(frame(BASE/'previews/preview-v4-173s.mp4',f),frame(master,f))})
    result={'status':'TECHNICAL_PASS_VISUAL_REVIEW_REQUIRED' if all(all(r['checks'].values()) for r in reports) and all(x['withinOneFrame'] for x in correlations) else 'FAILED','files':reports,'keyframeMetrics':metrics,'audioTiming':correlations,'unchangedBaselineComparisons':preservation,'surveyFrameCountPerVersion':len(wanted),'selected':[{'file':p.name,'bytes':p.stat().st_size} for p in SELECTED.iterdir()],'limits':['Metrics use block-8 luma SSIM; no standard SSIM/VMAF claim.','Pixel and PCM checks do not replace continuous human listening or certify cultural attributions.','Veo source watermark retained; user confirmed no known watermark-free source.','No physical-camera acceptance or Windows native player acceptance inferred from these results.']}
    (BASE/'docs/v4-final-media-review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':result['status'],'files':[{k:r[k] for k in ['file','bytes','MB','checks']} for r in reports],'metrics':metrics,'audio':correlations,'survey':len(wanted)},indent=2),flush=True)
    assert result['status']!='FAILED'

if __name__=='__main__':
    if '--recheck-decode' in sys.argv:
        file=BASE/'docs/v4-final-media-review.json';data=json.loads(file.read_text(encoding='utf-8'))
        (LOCAL/'initial-null-muxer-check-failed.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        for r in data['files']:
            media=OUT/r['file'];assert hashlib.sha256(media.read_bytes()).hexdigest()==r['sha256'],'Media changed; run full review instead'
            r['decode']=decode(media);r['checks']['decode']=r['decode']['passed'];print(r['file'],r['decode'],flush=True)
        data['harnessCorrection']='Initial null-output command selected unavailable wrapped_avframe encoder. Explicit PNG/PCM command retested both unchanged files. Initial failure preserved in local/.'
        data['status']='TECHNICAL_PASS_VISUAL_REVIEW_REQUIRED' if all(all(r['checks'].values()) for r in data['files']) and all(x['withinOneFrame'] for x in data['audioTiming']) else 'FAILED'
        file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');assert data['status']!='FAILED'
    else:main()
