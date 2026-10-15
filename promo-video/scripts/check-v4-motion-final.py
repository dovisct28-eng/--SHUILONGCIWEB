"""Verify presentation timestamps and motion in known active intervals only."""
import json,subprocess,importlib.util
from pathlib import Path
import numpy as np
BASE=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('review',BASE/'scripts/review-v4-final.py');review=importlib.util.module_from_spec(spec);spec.loader.exec_module(review)
ROIS=[('wire',2.2,1,(105,40,855,465)),('tour-turn',41.2,2.6,None),('mural05',59.7,2,None),('mural01',65.7,2,None),('mural02',73.2,1.3,None),('gallery-drag',82.1,2,(30,50,930,475)),('next',128.1,1,(235,50,685,400)),('open',139.05,.7,(50,40,800,415)),('close',148.05,.7,(50,40,800,415)),('dwell',127.05,.8,(540,410,620,490))]
results=[]
for name in ['master','50mb']:
 file=BASE/f'renders/v4-final/chubing-rujiang-v4-{name}.mp4'
 raw=json.loads(subprocess.check_output([str(review.PROBE),'-v','error','-select_streams','v:0','-show_frames','-show_entries','frame=best_effort_timestamp_time','-of','json',str(file)]))
 times=np.array([float(f['best_effort_timestamp_time']) for f in raw['frames']]);diff=np.diff(times)
 cadence={'frames':len(times),'minStep':float(diff.min()),'maxStep':float(diff.max()),'constant30fpsPTS':len(times)==5190 and bool(np.all(np.abs(diff-1/30)<.000002))}
 motion=[]
 for label,start,duration,crop in ROIS:
  previous=None;differences=[]
  for im in review.pngs([str(review.FF),'-v','error','-ss',str(start),'-i',str(file),'-t',str(duration),'-an','-vf','scale=960:540','-vsync','0','-c:v','png','-f','image2pipe','pipe:1']):
   if crop:im=im.crop(crop)
   a=np.asarray(im.convert('L').resize((320,180))).astype(float)
   if previous is not None:differences.append(float(np.abs(a-previous).mean()))
   previous=a
  count=sum(x<.035 for x in differences);motion.append({'region':label,'start':start,'duration':duration,'nearDuplicatePairs':count,'pairs':len(differences),'meanLumaDifference':float(np.mean(differences))})
 results.append({'file':file.name,'cadence':cadence,'motion':motion});print(name,cadence,flush=True)
report={'results':results,'limits':['Known active intervals only; intentional reading holds are not counted as dropped frames.','Source character video is 24fps, repeated samples in a 30fps composition are expected; this does not infer real-time sensor performance.','Near-duplicate threshold .035 on resized luma is diagnostic, not an optical-flow certification.']}
(BASE/'docs/v4-final-motion.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
assert all(r['cadence']['constant30fpsPTS'] for r in results)
