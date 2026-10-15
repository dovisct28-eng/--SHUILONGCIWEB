import io,json,subprocess,wave
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parents[1];ff=base/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
plan=json.loads((base/'planning/timeline-v3-150s.json').read_text(encoding='utf-8'));source=base/'previews/preview-v3-150s.mp4'
raw=subprocess.check_output([str(ff),'-v','error','-i',str(source),'-vn','-ar','48000','-ac','2','-c:a','pcm_s16le','-f','wav','pipe:1'])
with wave.open(io.BytesIO(raw))as w:a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)
with wave.open(str(base/'assets/confirm.wav'))as w:t=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).mean(axis=1)
results=[]
for f in plan['audio']['sfxFrames']:
 start=int((f/plan['fps']-.1)*48000);x=a[start:start+len(t)+9600];n=1<<int(np.ceil(np.log2(len(x)+len(t))));v=np.fft.irfft(np.fft.rfft(x,n)*np.fft.rfft(t[::-1],n),n);i=int(np.argmax(v[len(t)-1:len(x)]));delta=(start+i)/48000-f/plan['fps'];results.append({'frame':f,'offsetMilliseconds':delta*1000,'withinOneFrame':abs(delta)<=1/plan['fps']})
r={'source':source.name,'sfxCorrelation':results,'listeningAcceptance':'PENDING_USER_LISTENING'}
(base/'docs/v3-final-sync.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8');print(json.dumps(r));assert all(x['withinOneFrame']for x in results)
