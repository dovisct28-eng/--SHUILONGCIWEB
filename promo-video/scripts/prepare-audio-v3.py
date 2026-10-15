"""Retime existing accepted-direction music candidate, preserve all previous masters."""
import json,wave
from pathlib import Path
import numpy as np
base=Path(__file__).resolve().parents[1]
out=base/'assets/music-edit-150s-v3.wav'
if out.exists():raise FileExistsError(out)
with wave.open(str(base/'assets/music-original.wav'),'rb') as w:
    rate=w.getframerate();channels=w.getnchannels();assert rate==48000 and channels==2 and w.getsampwidth()==2
    samples=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').reshape(-1,2).astype(float)/32768
cross=int(.8*rate);first=samples[:int(130.8*rate)].copy();tail=samples[-20*rate:].copy()
blend=np.linspace(0,1,cross)[:,None];first[-cross:]=first[-cross:]*(1-blend)+tail[:cross]*blend
edit=np.concatenate([first,tail[cross:]])[:150*rate]*.72
edit[:int(.4*rate)]*=np.linspace(0,1,int(.4*rate))[:,None]
edit[-int(1.6*rate):]*=np.linspace(1,0,int(1.6*rate))[:,None]
with wave.open(str(out),'wb') as w:
    w.setparams((2,2,rate,0,'NONE','not compressed'));w.writeframes((edit*32767).astype('<i2').tobytes())
report={'durationSeconds':len(edit)/rate,'sampleRate':rate,'channels':channels,'sourceSegmentsSeconds':[[0,130.8],[len(samples)/rate-20,len(samples)/rate]],'crossfadeTimelineSeconds':[130,130.8],'gain':.72,'status':'EXISTING_INSTRUMENTAL_LISTENING_CANDIDATE','limits':['Mixed original, not separable instrument stems.','No new generation; listening and music-join approval remain pending.']}
(base/'docs/v3-audio-edit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
