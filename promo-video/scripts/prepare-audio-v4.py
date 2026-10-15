"""Edit the original PCM master at native pitch; measure attack, not loudest sample."""
import json,wave
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parents[1];out=base/'assets/music-edit-173s-v4.wav'
if out.exists():raise FileExistsError(out)
with wave.open(str(base/'assets/music-original.wav'),'rb') as w:
 rate=w.getframerate();assert rate==48000 and w.getnchannels()==2 and w.getsampwidth()==2
 samples=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
# Preserve the original introduction and the complete original closing phrase.
first=samples[:int(147.8*rate)].copy();tail=samples[-27*rate:].copy();cross=int(1.8*rate)
blend=np.linspace(0,1,cross)[:,None];first[-cross:]=first[-cross:]*(1-blend)+tail[:cross]*blend
edit=np.concatenate([first,tail[cross:]])*.72
assert len(edit)==173*rate
edit[:int(.4*rate)]*=np.linspace(0,1,int(.4*rate))[:,None]
edit[-int(1.6*rate):]*=np.linspace(1,0,int(1.6*rate))[:,None]
with wave.open(str(out),'wb') as w:w.setparams((2,2,rate,0,'NONE','not compressed'));w.writeframes((edit*32767).astype('<i2').tobytes())
# 5ms-hop spectral positive flux in 35-180Hz; attack observation is bounded.
mono=samples.mean(axis=1);hop=240;n=2048;freq=np.fft.rfftfreq(n,1/rate);band=(freq>=35)&(freq<=180);rows=[];prev=None
for at in range(int(23.8*rate),int(25.3*rate),hop):
 spec=np.abs(np.fft.rfft(mono[at:at+n]*np.hanning(n)));energy=float(np.sum(spec[band]**2));flux=0 if prev is None else float(np.maximum(spec[band]-prev[band],0).sum());rows.append({'time':(at+n/2)/rate,'bassEnergy':energy,'positiveBassFlux':flux});prev=spec
attack=max((r for r in rows if 24.65<=r['time']<=25.1),key=lambda r:r['positiveBassFlux'])
r={'durationSeconds':173,'sampleRate':rate,'channels':2,'sourceSegmentsSeconds':[[0,147.8],[len(samples)/rate-27,len(samples)/rate]],'crossfadeTimelineSeconds':[146,147.8],'gain':.72,'pitchOrRateChanged':False,'themeAttackMeasurement':attack,'themeVisualFrame':747,'attackVsVisualFrames':(attack['time']-24.9)*30,'attackAnalysis':rows,'listeningAcceptance':'PENDING_HUMAN_LISTENING','limits':['Flux is a technical onset estimate, not a substitute for listening or musical-phrase approval.','Existing mixed instrumental master; no isolated stems.']}
(base/'docs/v4-audio-edit.json').write_text(json.dumps(r,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in r.items()if k!='attackAnalysis'}))
