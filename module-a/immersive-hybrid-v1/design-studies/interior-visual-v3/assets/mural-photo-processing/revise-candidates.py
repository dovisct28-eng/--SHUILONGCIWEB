"""User-directed revision: one planar warp for mural 03, reference crop for 04.

Requires Pillow and NumPy. Keeps all revision-1 artifacts and original photos.
The user's reference is archived separately and never becomes a mural source.
"""
import hashlib
import json
from pathlib import Path
import re
import runpy

import numpy as np
import PIL
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'AGENTS.md').exists())
OUT = HERE / 'revision-2'
SELECTED = ROOT / 'docs/validation/interior-visual-v3-3-stage-a/selected'
HELPERS = runpy.run_path(str(HERE / 'process-candidates.py'), run_name='crop_helpers')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(name):
    return json.loads((OUT / name).read_text(encoding='utf-8'))


def project(matrix, points):
    values = np.column_stack((np.asarray(points, dtype=float), np.ones(len(points)))) @ matrix.T
    return values[:, :2] / values[:, 2:]


def transform_parameters(spec):
    src = np.array(spec['perspective']['sourceQuad'], dtype=float)
    w = spec['perspective']['targetPlane']['width']
    h = spec['perspective']['targetPlane']['height']
    dst = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype=float)
    a, b = [], []
    for (x, y), (u, v) in zip(src, dst):
        a.extend([[x, y, 1, 0, 0, 0, -u*x, -u*y], [0, 0, 0, x, y, 1, -v*x, -v*y]])
        b.extend([u, v])
    planar = np.append(np.linalg.solve(a, b), 1).reshape(3, 3)
    c = spec['sourceCrop']
    corners = [[c['left'], c['top']], [c['right'], c['top']],
               [c['right'], c['bottom']], [c['left'], c['bottom']]]
    projected = project(planar, corners)
    lower, upper = np.floor(projected.min(axis=0)), np.ceil(projected.max(axis=0))
    translation = np.array([[1, 0, -lower[0]], [0, 1, -lower[1]], [0, 0, 1]])
    forward = translation @ planar  # full-source coordinates -> output coordinates
    crop_offset = np.array([[1, 0, c['left']], [0, 1, c['top']], [0, 0, 1]])
    inverse = np.linalg.inv(forward @ crop_offset)
    inverse /= inverse[2, 2]
    size = tuple((upper - lower).astype(int))
    assert size == (spec['outputWidth'], spec['outputHeight'])
    return forward, inverse, size


def rectify(source, spec):
    forward, inverse, size = transform_parameters(spec)
    c = spec['sourceCrop']
    crop = source.crop(tuple(c[k] for k in ['left', 'top', 'right', 'bottom'])).convert('RGBA')
    result = crop.transform(size, Image.Transform.PERSPECTIVE, tuple(inverse.flatten()[:8]),
                            Image.Resampling.BICUBIC, fillcolor=(0, 0, 0, 0))
    return result, forward, inverse


def reference_match(source, reference):
    # Ignore screenshot border and compare content, not the requested aspect ratio.
    a = np.asarray(reference.convert('RGB'), dtype=float)
    best = None
    for width in range(526, 532):
        b = np.asarray(source.resize((width, round(source.height*width/source.width)),
                                    Image.Resampling.LANCZOS), dtype=float)
        for x in range(-2, 4):
            for y in range(76, 86):
                xa, xb = max(10, -x), min(reference.width-10, width-x)
                target = a[10:-10, xa:xb]
                sample = b[y+10:y+reference.height-10, x+xa:x+xb]
                if target.shape != sample.shape:
                    continue
                record = (float(np.mean((target-sample)**2)), width, x, y)
                if best is None or record < best:
                    best = record
    mse, width, x, y = best
    return {'interiorRGBMeanSquaredError': mse, 'resizedSourceWidth': width,
            'referenceToResizedSourceOffset': [x, y],
            'mappedSourceTopApprox': y*source.width/width,
            'mappedSourceBottomApprox': (y+reference.height)*source.width/width,
            'method': 'LANCZOS reference-width search and integer translation; 10px border excluded'}


def sheet(title, panels, note, filename):
    canvas = Image.new('RGB', (1660, 1010), '#141a1c')
    draw = ImageDraw.Draw(canvas)
    font, fit = HELPERS['font'], HELPERS['fit']
    draw.text((38, 24), title, font=font(30), fill='#eee8dd')
    draw.text((38, 74), '节点 A · 第二版候选 · 未接入展厅', font=font(21), fill='#b5b9b5')
    for i, (image, caption, detail) in enumerate(panels):
        x = 38 + 542*i
        draw.text((x, 124), caption, font=font(24), fill='#eee8dd')
        draw.text((x, 163), detail, font=font(18), fill='#b5b9b5')
        thumb = fit(image, (500, 720))
        position = (x + (500-thumb.width)//2, 218 + (720-thumb.height)//2)
        canvas.paste(thumb.convert('RGB'), position, thumb.getchannel('A') if thumb.mode == 'RGBA' else None)
    draw.text((38, 963), note, font=font(20), fill='#d8d2c5')
    canvas.save(SELECTED / filename, quality=94, subsampling=0)


def figure(file, title, size):
    return f'<figure><a href="{file}"><img src="{file}" width="{size[0]}" height="{size[1]}" alt="{title}"></a><figcaption>{title}</figcaption></figure>'


def review_page(s3, s4):
    first_specs = [json.loads((HERE / f'mural-0{i}-crop.json').read_text(encoding='utf-8')) for i in [3, 4]]
    initial = HELPERS['review_page'](first_specs)
    (HERE / 'initial-review.html').write_text(initial, encoding='utf-8')
    style = re.search(r'<style>(.*?)</style>', initial, re.S).group(1)
    three = ''.join([figure('mural-03-crop-candidate.png', '未校正裁切 · 保留对照', [1280, 664]),
                     figure('revision-2/mural-03-control-preview.webp', '参考边带与四个校正控制点', [1280, 960]),
                     figure('revision-2/'+s3['candidate'], '适度正视候选 · 透明角落无补绘', [s3['outputWidth'], s3['outputHeight']])])
    four = ''.join([figure('mural-04-crop-candidate.png', '上一版 · 下部浅色带保留', [1280, 1372]),
                    figure('revision-2/user-mural-04-crop-reference.png', '你提供的裁切参考', [528, 389]),
                    figure('revision-2/'+s4['candidate'], '本次裁切 · 按附图下沿', [s4['outputWidth'], s4['outputHeight']])])
    return f'''<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" href="data:,">
<title>水龙祠 V3.3 · 第三铺正视与第四铺裁切 · 第二版</title><style>{style}</style>
<main><h1>第三铺正视与第四铺裁切 · 第二版</h1>
<p>按你的反馈调整，仍停留在节点 A 审图。真实原图、第一版候选和正式网页均保留。</p>
<section><h2>第三铺壁画 · 适度正视</h2><p>未校正 1280×664 → 校正画布 {s3['outputWidth']}×{s3['outputHeight']}。以可见边带估计平面，仅校正一次；输出尺寸不代表新增细节。</p>
<div class="photos">{three}</div>
<p class="note">两侧参考边带趋于竖直、参考上下边趋于水平。保留整个未校正裁切范围，边缘空角透明，不补画、不改色。真实墙面宽高比仍未获得测量支持。</p>
<p><a href="revision-2/mural-03-front.json">校正控制点与参数</a> · <a href="mural-03-original-preview.jpg">原始照片</a></p></section>
<section><h2>第四铺壁画 · 按你的下沿裁切</h2><p>保留原有上沿 y=196 和全部宽度，下沿按附图内容对应至原图约 y=1135。候选 {s4['outputWidth']}×{s4['outputHeight']}。</p>
<div class="photos">{four}</div>
<p class="note">依你的裁切要求移除下方浅色带。附图只用于确定展示边界，真实图像仍从原照片导出，无缩放、透视变换或补绘。</p>
<p><a href="revision-2/mural-04-boundary-preview.webp">查看原图上的新裁切框</a> · <a href="revision-2/mural-04-crop.json">裁切参数</a> · <a href="mural-04-original-preview.jpg">原始照片</a></p></section>
<p><a href="initial-review.html">查看第一版审图页</a> · <a href="revision-2/processing-report.json">本轮处理记录</a></p>
<p>当前是展示候选，尚未替换网页资源、空间路线或现场配准状态。</p></main></html>\n'''


def main():
    s3, s4 = load('mural-03-front.json'), load('mural-04-crop.json')
    reference_path = OUT / s4['reference']['file']
    if not reference_path.exists():
        raise RuntimeError('Archive the user attachment as revision-2/user-mural-04-crop-reference.png first')
    report = {'revision': 2, 'stage': 'A / preview only', 'baselineCommit': '990bcdf8e416a2050ea75446d3c3f7d9514bdcf1',
              'tool': f'Python / Pillow {PIL.__version__} / NumPy {np.__version__}', 'runtimeImageReplaced': False}
    for s in [s3, s4]:
        assert sha(ROOT / s['source']) == s['sourceSha256']
    with Image.open(ROOT / s3['source']) as original:
        corrected, forward, inverse = rectify(original, s3)
        corrected.save(OUT / s3['candidate'], icc_profile=original.info.get('icc_profile'))
        marked = HELPERS['annotated'](original, (0, 96, 1280, 760))
        draw = ImageDraw.Draw(marked)
        quad = [tuple(p) for p in s3['perspective']['sourceQuad']]
        draw.line(quad + quad[:1], fill='#e7b26a', width=4)
        for i, (x, y) in enumerate(quad):
            draw.ellipse((x-6, y-6, x+6, y+6), fill='#e7b26a')
            draw.text((min(x+10, 1230), y+8), str(i+1), font=HELPERS['font'](24), fill='#ffffff', stroke_width=2, stroke_fill='#101517')
        marked.save(OUT / 'mural-03-control-preview.webp', lossless=True, icc_profile=original.info.get('icc_profile'))
        with Image.open(OUT / s3['unrectifiedCandidate']) as old:
            sheet('第三铺壁画 · 未校正与适度正视对照', [(old, '未校正裁切', '1280 × 664 · 原投影'),
                  (marked, '校正依据', '边带参考四角 · 非测绘'), (corrected, '正视候选', f'{corrected.width} × {corrected.height} · 几何插值')],
                  '原图与未校正版保留；透明角落不补绘，实际墙面比例未测定。', 'mural-03-front-comparison.jpg')
        report['mural03'] = {'sourceSha256': s3['sourceSha256'], 'candidateSha256': sha(OUT / s3['candidate']),
                             'output': list(corrected.size), 'sourceToOutputHomography': forward.tolist(),
                             'outputToCropHomography': inverse.tolist(), 'fullCropCornersInOutput': project(forward, [[0,96],[1280,96],[1280,760],[0,760]]).tolist(),
                             'controlPointsInOutput': project(forward, s3['perspective']['sourceQuad']).tolist(),
                             'pixelEquality': False, 'reason': 'BICUBIC geometric interpolation; no color adjustment',
                             'alphaOutsideSource': True, 'iccPreserved': True, 'unrectifiedCandidatePreserved': True}
    with Image.open(ROOT / s4['source']) as original, Image.open(reference_path) as reference:
        c = s4['crop']
        crop = original.crop(tuple(c[k] for k in ['left', 'top', 'right', 'bottom']))
        assert crop.size == (s4['outputWidth'], s4['outputHeight'])
        crop.save(OUT / s4['candidate'], icc_profile=original.info.get('icc_profile'))
        boundary = HELPERS['annotated'](original, tuple(c[k] for k in ['left', 'top', 'right', 'bottom']))
        boundary.save(OUT / 'mural-04-boundary-preview.webp', lossless=True, icc_profile=original.info.get('icc_profile'))
        matching = reference_match(original, reference)
        assert abs(matching['mappedSourceBottomApprox']-c['bottom']) < 2
        sheet('第四铺壁画 · 按用户附图收短下沿', [(reference, '你的裁切参考', '528 × 389 · 仅用于定位'),
              (boundary, '原图上的新裁切框', '上 196 / 下 1135 / 全宽'), (crop, '本次裁切', '1280 × 939 · 无缩放')],
              '根据附图裁去下方浅色带；仍从真实原照片裁切，原件及上一版完整保留。', 'mural-04-revised-comparison.jpg')
        report['mural04'] = {'sourceSha256': s4['sourceSha256'], 'candidateSha256': sha(OUT / s4['candidate']),
                             'output': list(crop.size), 'pixelEquality': True, 'iccPreserved': True,
                             'referenceSha256': sha(reference_path), 'referenceMatching': matching,
                             'cropBottom': c['bottom'], 'cropDecision': 'user reference, not heritage-boundary identification'}
    for s in [s3, s4]:
        assert sha(ROOT / s['source']) == s['sourceSha256']
    (OUT / 'processing-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    (HERE / 'index.html').write_text(review_page(s3, s4), encoding='utf-8')
    print(json.dumps({'mural03': report['mural03']['output'], 'mural04': report['mural04']['output'],
                      'referenceBottomApprox': report['mural04']['referenceMatching']['mappedSourceBottomApprox']}, indent=2))


if __name__ == '__main__':
    main()
