"""Create the selected submission copy only after completed output checks."""
import json,hashlib,shutil
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
def read(name):return json.loads((BASE/name).read_text(encoding='utf-8'))
def sha(file):return hashlib.sha256(file.read_bytes()).hexdigest()
def main():
    report=read('docs/v4-final-media-review.json');play=read('docs/v4-final-playback.json');motion=read('docs/v4-final-motion.json');decision=read('docs/v4-final-visual-decision.json')
    assert report['status']=='TECHNICAL_PASS_VISUAL_REVIEW_REQUIRED'
    assert all(all(x['checks'].values()) for x in report['files'])
    assert play['status']=='BROWSER_FULL_PLAYBACK_PASS' and all(x['playback']['ended'] and x['playback']['error'] is None for x in play['results'])
    assert all(x['cadence']['constant30fpsPTS'] for x in motion['results'])
    assert decision['status']=='SAMPLED_VISUAL_PASS' and decision['selectedVersion']=='master'
    for item in report['files']:assert sha(BASE/'renders/v4-final'/item['file'])==item['sha256'],'Output changed after QA'
    source=BASE/'renders/v4-final/chubing-rujiang-v4-master.mp4';target=source.with_name('chubing-rujiang-final-submission.mp4')
    if target.exists():assert sha(target)==sha(source),'Refusing to overwrite different submission copy'
    else:shutil.copyfile(source,target)
    assert sha(target)==sha(source)
    manifest={'status':'SELECTED_SUBMISSION_COPY_TECHNICAL_AND_SAMPLED_VISUAL_PASS','selection':'master','reason':'Preserves mural fine texture better than 48 MB copy; no stated upload size ceiling.','files':[{**{k:x[k] for k in ['file','sha256','bytes','MB']}} for x in report['files']]+[{'file':target.name,'sha256':sha(target),'bytes':target.stat().st_size,'MB':target.stat().st_size/1e6}], 'nativeExportTaskId':'8e70d1bf-32f6-41fb-aaec-d4564dcae766','sourceTimelineId':'4d3d4a82-0b81-4c59-bc4f-5fb15969224a','watermark':'Original Veo mark retained; no compliant replacement available, per user.','continuousHumanAV':'NOT_PERFORMED; automated browser playback was muted.','limits':['No Windows Media Player/VLC visual acceptance.','No full-frame identity/text OCR certification.','Selection does not certify source-media licensing or physical-camera performance.']}
    (BASE/'docs/v4-final-delivery-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(manifest,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
