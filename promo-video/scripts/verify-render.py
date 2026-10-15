"""Inspect the actual exported media. Reports limits separately from checks."""
import json,subprocess,sys,math,io,struct,wave
from pathlib import Path
import numpy as np
from PIL import Image
base=Path(__file__).resolve().parents[1]
ff=base/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
probe=ff.with_name('ffprobe.exe')
source=Path(sys.argv[1]).resolve()
target_frames=int(sys.argv[2])
metadata=json.loads(subprocess.check_output([str(probe),'-v','error','-count_frames','-show_streams','-show_format','-of','json',str(source)]))
v=next(s for s in metadata['streams'] if s['codec_type']=='video');a=next(s for s in metadata['streams'] if s['codec_type']=='audio')
checks={'width':v['width']==1920,'height':v['height']==1080,'codec':v['codec_name']=='h264','pixelFormat':v['pix_fmt']=='yuv420p','fps':v['r_frame_rate']=='30/1' and v['avg_frame_rate']=='30/1','decodedFrames':int(v['nb_read_frames'])==target_frames,'videoDuration':abs(float(v['duration'])-target_frames/30)<.001,'stereo48k':a['channels']==2 and a['sample_rate']=='48000'}
audio=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-vn','-ac','2','-ar','48000','-f','wav','-c:a','pcm_s16le','pipe:1'])
with wave.open(io.BytesIO(audio),'rb') as w: pcm=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
peak=float(np.max(np.abs(pcm)));rms=float(np.sqrt(np.mean(pcm**2)));checks['nonSilentAudio']=rms>.0001;checks['noClippedPcmSamples']=peak<.999
# The bundled compositor does not register rawvideo or s16le muxers; use
# supported lossless PNG and WAV containers rather than installing another codec.
pixels=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-an','-vf','scale=64:36','-c:v','png','-f','image2pipe','pipe:1'])
means=[];offset=0
while offset<len(pixels):
 begin=offset;assert pixels[offset:offset+8]==b'\x89PNG\r\n\x1a\n';offset+=8
 while True:
  length=struct.unpack('>I',pixels[offset:offset+4])[0];kind=pixels[offset+4:offset+8];offset+=length+12
  if kind==b'IEND':break
 means.append(float(np.asarray(Image.open(io.BytesIO(pixels[begin:offset])).convert('RGB')).mean()))
black=np.array(means)<2
runs=[];start=None
for i,x in enumerate(list(black)+[False]):
 if x and start is None:start=i
 if not x and start is not None:runs.append({'startFrame':start,'endFrame':i});start=None
checks['noInternalBlackRuns']=all(r['endFrame']-r['startFrame']<4 or r['startFrame']>=target_frames-12 for r in runs)
tags={**metadata['format'].get('tags',{}),**v.get('tags',{}),**a.get('tags',{})};checks['noIdentityTags']=not any(k.lower() in ['artist','author','copyright','comment','title'] for k in tags)
report={'source':source.name,'status':'PASS' if all(checks.values()) else 'NEEDS_REVIEW','checks':checks,'videoFrames':len(means),'videoDuration':float(v['duration']),'audioDuration':float(a['duration']),'containerDuration':float(metadata['format']['duration']),'sizeBytes':source.stat().st_size,'peakDbFS':20*math.log10(max(peak,1e-12)),'rmsDbFS':20*math.log10(max(rms,1e-12)),'blackRuns':runs,'metadataTags':tags,'limits':['Automated encoding/PCM/pixel checks do not certify listening preference, cultural-source rights, all text pixels, or physical-camera recognition.','No LUFS or true-peak claim; measurements are decoded PCM peak and RMS.']}
(base/'docs'/f'{source.stem}-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,indent=2));sys.exit(0 if report['status']=='PASS' else 1)
