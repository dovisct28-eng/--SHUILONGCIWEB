"""Local deterministic confirm sound and PCM measurements. No source overwrite."""
import wave, math, json
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parents[1]
rate=48000
t=np.arange(int(rate*.65))/rate
signal=.22*np.exp(-8*t)*(np.sin(2*np.pi*880*t)+.35*np.sin(2*np.pi*1320*t))*np.minimum(1,t/.008)
stereo=np.repeat((signal*32767).astype('<i2')[:,None],2,axis=1)
with wave.open(str(base/'assets/confirm.wav'),'wb') as w:
 w.setparams((2,2,rate,0,'NONE','not compressed'));w.writeframes(stereo.tobytes())
src=base/'assets/music-test.wav'
with wave.open(str(src),'rb') as w:
 raw=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
 peak=float(np.max(np.abs(raw)));rms=float(np.sqrt(np.mean(raw**2)))
report={'musicCandidate':{'peakDbFS':20*math.log10(max(peak,1e-10)),'rmsDbFS':20*math.log10(max(rms,1e-10)),'listeningAcceptance':'PENDING_USER_LISTENING'},'confirm':{'duration':.65,'sampleRate':rate,'peakDbFS':20*math.log10(float(np.max(np.abs(signal)))),'method':'Damped 880/1320 Hz partials; local synthesis; no reference recording'}}
(base/'docs/audio-test-measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
full=base/'assets/music-original.wav'
if full.exists():
 with wave.open(str(full),'rb') as w:
  rate=w.getframerate();samples=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
 # Preserve the generated opening and natural ending. Keep the source intact.
 cross=int(.8*rate);first=samples[:int(110.8*rate)].copy();tail=samples[-20*rate:].copy()
 blend=np.linspace(0,1,cross)[:,None]
 first[-cross:]=first[-cross:]*(1-blend)+tail[:cross]*blend
 assembled=np.concatenate([first,tail[cross:]])[:130*rate]*.72
 assembled[:int(.4*rate)]*=np.linspace(0,1,int(.4*rate))[:,None]
 assembled[-int(1.6*rate):]*=np.linspace(1,0,int(1.6*rate))[:,None]
 with wave.open(str(base/'assets/music-edit-130s.wav'),'wb') as w:
  w.setparams((2,2,rate,0,'NONE','not compressed'));w.writeframes((assembled*32767).astype('<i2').tobytes())
 report['fullMusicEdit']={'duration':len(assembled)/rate,'gain':.72,'sourceSegmentsSeconds':[[0,110.8],[len(samples)/rate-20,len(samples)/rate]],'crossfadeSeconds':.8,'peakDbFS':20*math.log10(float(np.max(np.abs(assembled)))),'status':'LISTENING_CANDIDATE_NOT_APPROVED'}
 (base/'docs/audio-test-measurements.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
