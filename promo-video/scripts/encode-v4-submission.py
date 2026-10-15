"""Remux the direct editor export without generation loss, then encode 2-pass.

Usage: <python> encode-v4-submission.py <direct-editor-export.mp4> [--kbps 2100]
Existing outputs are never overwritten. MB uses decimal bytes; MiB is reported too.
The Desktop exporter controls the master encoder; this script does not pretend
to have set CRF or preset on that native render.
"""
import argparse, json, subprocess, struct
from pathlib import Path

BASE=Path(__file__).resolve().parents[1]
FF=BASE/'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
PROBE=FF.with_name('ffprobe.exe')

def probe(file):
    return json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-show_format','-of','json',str(file)]))

def faststart(file):
    atoms=[]
    with file.open('rb') as stream:
        while stream.tell()<file.stat().st_size:
            offset=stream.tell(); raw=stream.read(8)
            if len(raw)!=8: break
            size,kind=struct.unpack('>I4s',raw)
            if size==1:size=struct.unpack('>Q',stream.read(8))[0]
            if size==0:size=file.stat().st_size-offset
            if size<8:raise ValueError('Invalid MP4 atom size')
            atoms.append((kind.decode('ascii',errors='replace'),offset));stream.seek(offset+size)
    lookup=dict(atoms)
    return 'moov' in lookup and 'mdat' in lookup and lookup['moov']<lookup['mdat']

def check_format(info):
    video=next(s for s in info['streams'] if s['codec_type']=='video')
    audio=next(s for s in info['streams'] if s['codec_type']=='audio')
    checks={
        'mp4':'mp4' in info['format']['format_name'],
        'h264':video['codec_name']=='h264','1080p':(video['width'],video['height'])==(1920,1080),
        'yuv420p':video['pix_fmt']=='yuv420p','30fps':video['r_frame_rate']==video['avg_frame_rate']=='30/1',
        'aac48k':audio['codec_name']=='aac' and audio['sample_rate']=='48000',
        'duration':60<=float(info['format']['duration'])<=180,
        'noIdentityTags':not any(k.lower() in ['author','artist','copyright','comment','title'] for obj in [info['format'],*info['streams']] for k in obj.get('tags',{})),
    }
    return checks

def encode(source,kbps=2100):
    source=Path(source).resolve(); out=BASE/'renders/v4-final';out.mkdir(parents=True,exist_ok=True)
    assert source.is_file(),'Missing direct V4 editor render'
    assert all(check_format(probe(source)).values()),'Unexpected native render format'
    master=out/'chubing-rujiang-v4-master.mp4'
    compressed=out/('chubing-rujiang-v4-50mb.mp4' if kbps==2100 else f'chubing-rujiang-v4-{kbps}kbps.mp4')
    if not master.exists():
        subprocess.run([str(FF),'-v','error','-n','-i',str(source),'-map','0:v:0','-map','0:a:0','-c','copy','-map_metadata','-1','-movflags','+faststart',str(master)],check=True)
    assert not compressed.exists(),'Refusing to overwrite compressed output'
    log=out/f'two-pass-{kbps}'
    options=['-c:v','libx264','-preset','slow','-b:v',f'{kbps}k','-profile:v','high','-level:v','4.1','-pix_fmt','yuv420p','-r','30','-passlogfile',str(log)]
    # Always start from the high-quality editor master, never a previous small copy.
    subprocess.run([str(FF),'-hide_banner','-v','warning','-n','-i',str(master),'-map','0:v:0',*options,'-pass','1','-an','-f','null','NUL'],check=True)
    subprocess.run([str(FF),'-hide_banner','-v','warning','-n','-i',str(master),'-map','0:v:0','-map','0:a:0',*options,'-pass','2','-c:a','aac','-b:a','128k','-ar','48000','-map_metadata','-1','-movflags','+faststart',str(compressed)],check=True)
    reports=[]
    for file in [master,compressed]:
        info=probe(file);checks=check_format(info);checks['faststart']=faststart(file)
        assert all(checks.values()),checks
        reports.append({'file':file.name,'bytes':file.stat().st_size,'MB':file.stat().st_size/1e6,'MiB':file.stat().st_size/2**20,'checks':checks,'probe':info})
    result={'source':source.name,'masterEncoding':'Direct ChatCut native H.264 export; stream-copy remux only. Native API has no CRF/preset control.','compression':{'videoKbps':kbps,'audioKbps':128,'preset':'slow','passes':2,'profile':'high','level':'4.1'},'files':reports}
    (BASE/'docs'/f'v4-final-encoding-{kbps}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps([{k:r[k] for k in ['file','bytes','MB','MiB','checks']} for r in reports],indent=2),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('source');parser.add_argument('--kbps',type=int,default=2100);args=parser.parse_args();encode(args.source,args.kbps)
