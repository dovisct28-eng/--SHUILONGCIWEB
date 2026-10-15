"""Measure decoded frames, preserving source timing; holds require editorial review."""
import argparse, io, json, struct, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

BASE = Path(__file__).resolve().parents[1]
FF = BASE / 'editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
PROBE = FF.with_name('ffprobe.exe')

def png_frames(command, mode='L'):
    p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    def read(n):
        data = p.stdout.read(n)
        if len(data) != n: raise EOFError('truncated PNG stream')
        return data
    while True:
        signature = p.stdout.read(8)
        if not signature: break
        if signature != b'\x89PNG\r\n\x1a\n': raise ValueError('invalid PNG stream')
        data = bytearray(signature)
        while True:
            header = read(8); length = struct.unpack('>I', header[:4])[0]
            data.extend(header); data.extend(read(length + 4))
            if header[4:] == b'IEND': break
        yield np.asarray(Image.open(io.BytesIO(data)).convert(mode)).astype(np.float32)
    error = p.stderr.read().decode(errors='replace')
    if p.wait(): raise RuntimeError(error)

def analyze(source, start, duration, output=None, crop=None):
    source = Path(source)
    meta = json.loads(subprocess.check_output([str(PROBE), '-v', 'error', '-select_streams', 'v:0', '-show_streams', '-show_format', '-of', 'json', str(source)]))
    pts = json.loads(subprocess.check_output([str(PROBE), '-v', 'error', '-select_streams', 'v:0', '-show_frames', '-show_entries', 'frame=best_effort_timestamp_time', '-read_intervals', f'{start}%+{duration}', '-of', 'json', str(source)]))
    times = [float(f['best_effort_timestamp_time']) for f in pts['frames'] if 'best_effort_timestamp_time' in f]
    deltas = np.diff(times)
    filters=(f'crop={crop},' if crop else '')+'scale=320:180'
    cmd = [str(FF), '-v', 'error', '-ss', str(start), '-i', str(source), '-t', str(duration), '-an', '-vf', filters, '-vsync', '0', '-c:v', 'png', '-f', 'image2pipe', 'pipe:1']
    prev = None; diffs = []
    for frame in png_frames(cmd):
        if prev is not None: diffs.append(float(np.abs(frame-prev).mean()))
        prev = frame
    # Near-identical frames are candidates, not automatic failures: deliberate holds
    # and slow/subpixel motion must be reviewed against shot/event intervals.
    duplicate = np.array(diffs) < .035
    runs = []; begin = None
    for i, flag in enumerate(list(duplicate)+[False]):
        if flag and begin is None: begin = i
        if not flag and begin is not None:
            if i-begin >= 2: runs.append({'fromPair':begin,'toPair':i,'pairs':i-begin})
            begin = None
    v = meta['streams'][0]
    result = {'source':str(source.relative_to(BASE)) if source.is_relative_to(BASE) else str(source), 'startSeconds':start, 'durationSeconds':duration, 'stream':{k:v.get(k) for k in ['codec_name','width','height','r_frame_rate','avg_frame_rate','time_base']}, 'decodedFrames':len(diffs)+1, 'pairMeanAbsoluteDifferences':diffs, 'nearDuplicateThreshold':.035, 'nearDuplicatePairs':int(duplicate.sum()), 'nearDuplicatePercent':round(float(duplicate.mean()*100),3) if len(duplicate) else 0, 'duplicateResiduesModulo6':np.bincount(np.where(duplicate)[0]%6,minlength=6).tolist(), 'candidateFreezeRuns':runs, 'ptsDeltaMs':{'min':round(float(deltas.min()*1000),4), 'max':round(float(deltas.max()*1000),4), 'median':round(float(np.median(deltas)*1000),4)} if len(deltas) else None, 'limits':['Luma differences at 320x180 identify candidates, not optical-flow or semantic acceptance.','Static reading holds and intentional cuts require manual classification; native PTS are retained.']}
    result['crop']=crop
    if output: Path(output).write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    return result

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('source',nargs='?'); parser.add_argument('--start',type=float,default=0); parser.add_argument('--duration',type=float,default=5); parser.add_argument('--output'); parser.add_argument('--crop'); parser.add_argument('--v2',action='store_true'); args=parser.parse_args()
    if args.v2:
        out=BASE/'local/v3-audit';out.mkdir(parents=True,exist_ok=True)
        ranges=[('v2-architecture','previews/preview-v2-130s-revised.mp4',3,4),('v2-space','previews/preview-v2-130s-revised.mp4',15,8),('v2-tour','previews/preview-v2-130s-revised.mp4',29,7),('v2-entry','previews/preview-v2-130s-revised.mp4',39,9),('v2-gallery','previews/preview-v2-130s-revised.mp4',48,17),('v2-gesture','previews/preview-v2-130s-revised.mp4',65,35),('v2-recap','previews/preview-v2-130s-revised.mp4',100,20),('source-intro','recordings/intro-v3/temple-intro.webm',7.7,4),('source-a02','recordings/full/real-a.webm',13.7,8),('source-a04','recordings/full/real-a.webm',36.2,12),('source-gallery','recordings/entry-b02/entry-and-b02.webm',11.6,14)]
        summary=[]
        for name,file,start,duration in ranges:
            r=analyze(BASE/file,start,duration,out/f'{name}.json'); summary.append({k:v for k,v in r.items() if k!='pairMeanAbsoluteDifferences'});print(name,r['stream']['avg_frame_rate'],r['decodedFrames'],r['nearDuplicatePercent'],flush=True)
        (out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8')
    else:
        r=analyze(Path(args.source).resolve(),args.start,args.duration,args.output,args.crop);print(json.dumps({k:v for k,v in r.items() if k!='pairMeanAbsoluteDifferences'},indent=2))
if __name__=='__main__':main()
