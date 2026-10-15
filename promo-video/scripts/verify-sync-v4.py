"""Verify actual AAC offsets against original PCM and event-derived confirmation audio."""
import io,json,subprocess,wave
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parents[1];ff=base/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
plan=json.loads((base/'planning/timeline-v4.json').read_text(encoding='utf-8'));source=base/'previews/preview-v4-173s.mp4'
def pcm(raw):
 with wave.open(io.BytesIO(raw))as w:return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)
a=pcm(subprocess.check_output([str(ff),'-v','error','-i',str(source),'-vn','-ar','48000','-ac','2','-c:a','pcm_s16le','-f','wav','pipe:1']))
t=pcm((base/'assets/confirm.wav').read_bytes());music=pcm((base/plan['audio']['music']).read_bytes())
def correlate(x,t):
 n=1<<int(np.ceil(np.log2(len(x)+len(t))));v=np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(t[::-1],n),n);return int(np.argmax(v[len(t)-1:len(x)]))
results=[]
for f in [*plan['audio']['sfxFrames'],*plan['audio']['recapSfxFrames']]:
 start=int((f/plan['fps']-.1)*48000);x=a[start:start+len(t)+9600];i=correlate(x,t);delta=(start+i)/48000-f/plan['fps'];results.append({'frame':f,'offsetMilliseconds':delta*1000,'withinOneFrame':abs(delta)<=1/plan['fps']})
musicOffsets=[]
for sec in [1,24,58,90,145,168]:
 start=int((sec-.08)*48000);template=music[sec*48000:(sec+1)*48000];i=correlate(a[start:start+len(template)+7680],template);delta=(start+i)/48000-sec;musicOffsets.append({'timeSeconds':sec,'offsetMilliseconds':delta*1000,'withinTwoFrames':abs(delta)<=2/30})
windows=np.array([float(np.sqrt(np.mean(a[i:i+4800]**2)))/32768 for i in range(48000,len(music)-48000,4800)]);silent=np.where(windows<.0001)[0]
r={'source':source.name,'sfxCorrelation':results,'musicCorrelation':musicOffsets,'interior100msSilenceWindowCount':len(silent),'silenceWindowSeconds':(1+silent*.1).tolist(),'listeningAcceptance':'PENDING_HUMAN_LISTENING','limits':['AAC correlation verifies timing, not subjective music transitions, true peak or loudness compliance.']}
(base/'docs/v4-final-sync.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8');print(json.dumps(r));assert all(x['withinOneFrame']for x in results);assert all(x['withinTwoFrames']for x in musicOffsets);assert len(silent)==0
