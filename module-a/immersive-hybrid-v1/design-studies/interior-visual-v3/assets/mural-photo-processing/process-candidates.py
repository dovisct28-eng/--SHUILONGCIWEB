"""Build review artifacts only. Never write source photos or live gallery data.

Run with Python 3 and Pillow. Coordinates are authored after visual inspection,
not inferred from image aspect ratios. Candidate PNGs are never resampled.
"""
import hashlib
import html
import json
from pathlib import Path
import shutil

import PIL
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'AGENTS.md').exists())
SELECTED = ROOT / 'docs/validation/interior-visual-v3-3-stage-a/selected'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def font(size):
    for path in [Path('C:/Windows/Fonts/msyh.ttc'), Path('C:/Windows/Fonts/simhei.ttf')]:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    raise RuntimeError('Chinese preview labels need Microsoft YaHei or SimHei')


def fit(image, size):
    result = image.copy()
    result.thumbnail(size, Image.Resampling.LANCZOS)
    return result


def annotated(image, box):
    canvas = image.convert('RGBA')
    shade = Image.new('RGBA', image.size)
    draw = ImageDraw.Draw(shade)
    left, top, right, bottom = box
    for rect in [(0, 0, image.width, top - 1), (0, bottom, image.width, image.height - 1)]:
        draw.rectangle(rect, fill=(0, 0, 0, 125))
    canvas = Image.alpha_composite(canvas, shade).convert('RGB')
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((left, top, right - 1, bottom - 1), outline='#54f3c2', width=4)
    label = f'裁切候选  x={left}  y={top}  w={right-left}  h={bottom-top}'
    # Keep labels outside the retained mural, even on the annotated copy.
    draw.rectangle((12, 20, 835, 65), fill='#172322')
    draw.text((24, 26), label, font=font(24), fill='#ffffff')
    return canvas


def comparison(spec, original, boundary, candidate):
    # All panels use contain and the same available area. No stretching or upscaling.
    sheet = Image.new('RGB', (1660, 1010), '#141a1c')
    draw = ImageDraw.Draw(sheet)
    number = '第三铺' if spec['id'] == 'mural-03' else '第四铺'
    draw.text((38, 24), f'{number}壁画 · 节点 A 裁切候选', font=font(31), fill='#eee8dd')
    draw.text((38, 72), '保留原貌与残损边缘；待用户确认；未接入展厅', font=font(21), fill='#b5b9b5')
    for i, (im, title, subtitle) in enumerate([
        (original, '原始照片', f'{original.width} × {original.height}'),
        (boundary, '裁切边界', '绿线内保留；暗化部分移除'),
        (candidate, '裁切结果', f'{candidate.width} × {candidate.height} · 原比例'),
    ]):
        x = 38 + i * 542
        draw.text((x, 125), title, font=font(24), fill='#eee8dd')
        draw.text((x, 162), subtitle, font=font(18), fill='#aeb3b0')
        thumb = fit(im, (500, 720))
        sheet.paste(thumb, (x + (500 - thumb.width) // 2, 218 + (720 - thumb.height) // 2))
    note = ('保留底部不规则灰皮及少量砖基，不沿着笔画裁切。' if spec['id'] == 'mural-03'
            else '下部浅色区属性未明，整体保留；不能将其当成无效留白删除。')
    draw.text((38, 964), note, font=font(22), fill='#d8d2c5')
    return sheet


def inventory():
    entries = []
    # Inspect source/fieldwork directories, including Git-ignored fieldwork photos.
    for dirname in ['水龙祠壁画素材', '水龙祠实地照片']:
        for path in sorted((ROOT / dirname).rglob('*')):
            if path.suffix.lower() not in {'.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp'}:
                continue
            # Trusted local mural masters can exceed Pillow's decode pixel guard.
            # Read dimensions only: never call load/convert/thumbnail on these files.
            pixel_limit = Image.MAX_IMAGE_PIXELS
            try:
                Image.MAX_IMAGE_PIXELS = None
                with Image.open(path) as im:
                    entries.append({'path': path.relative_to(ROOT).as_posix(), 'width': im.width,
                                    'height': im.height, 'bytes': path.stat().st_size})
            finally:
                Image.MAX_IMAGE_PIXELS = pixel_limit
    return {'scope': ['水龙祠壁画素材/**', '水龙祠实地照片/**', 'V3 assets/mural-0[34]-source.jpg'],
            'finding': '原图与现有网页照片 SHA-256 相同；上述素材目录未找到同一照片的更高分辨率版本。不代表用户其他磁盘不存在原件。',
            'images': entries}


def review_page(specs):
    cards = []
    for s in specs:
        ident = s['id']
        name = '第三铺壁画' if ident == 'mural-03' else '第四铺壁画'
        c = s['crop']
        cards.append(f'''<section aria-labelledby="{ident}">
<h2 id="{ident}">{name}</h2>
<p>原图 {s['sourceWidth']} × {s['sourceHeight']} → 候选 {s['outputWidth']} × {s['outputHeight']}。
裁切框：左 {c['left']}，上 {c['top']}，右 {c['right']}，下 {c['bottom']}（右、下为不含端点）。</p>
<div class="photos">
<figure><a href="{ident}-original-preview.jpg"><img src="{ident}-original-preview.jpg" alt="{name}原始现场照片" width="{s['sourceWidth']}" height="{s['sourceHeight']}"></a><figcaption>原始照片 · 点击查看原尺寸</figcaption></figure>
<figure><a href="{ident}-boundary-preview.webp"><img src="{ident}-boundary-preview.webp" alt="{name}裁切边界，绿线内保留，上下暗化区域移除" width="{s['sourceWidth']}" height="{s['sourceHeight']}"></a><figcaption>裁切边界 · 绿线内保留</figcaption></figure>
<figure><a href="{s['candidate']}"><img src="{s['candidate']}" alt="{name}保留真实残损的裁切候选" width="{s['outputWidth']}" height="{s['outputHeight']}"></a><figcaption>裁切候选 · 无透视拉伸、无改色</figcaption></figure>
</div>
<p class="note">{html.escape(s['inspection']['damageAndBlankAreas'])}</p>
<p>{html.escape(s['perspective']['reason'])}</p>
<p><a href="{ident}-crop.json">查看裁切参数与来源记录</a></p>
</section>''')
    return '''<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="data:,">
<title>水龙祠 V3.3 · 第三、第四铺裁切候选</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#141a1c;color:#e7e2d8;font:16px/1.7 "Microsoft YaHei",sans-serif}
main{max-width:1800px;margin:auto;padding:32px 4vw 64px}h1{font-size:28px;line-height:1.4}h2{font-size:23px;margin:0}
p{max-width:95ch;color:#c3c7c2}section{padding:28px 0;border-top:1px solid #495051;margin-top:30px}
.photos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;align-items:start}figure{margin:0;min-width:0}
img{display:block;width:100%;height:58vh;object-fit:contain;background:#101517}figcaption{font-size:15px;padding-top:10px;color:#d1d4cd}
a{color:#d6c5a7;text-underline-offset:4px}a:focus-visible{outline:3px solid #d6c5a7;outline-offset:4px}.note{color:#e6d6b8}
@media(max-width:800px){.photos{grid-template-columns:1fr}img{height:auto;max-height:85vh}h1{font-size:24px}}
</style>
<main><h1>水龙祠 V3.3 · 第三、第四铺裁切候选</h1>
<p>节点 A / 等待用户确认。仅供审图，网页中的照片、阅读布局、空间路线及配准状态均未替换。</p>
<p>原件与当前网页照片完全相同，未找到同图更高分辨率版本。两张均不放大、不修复、不改色；候选以无损 PNG 保存。点击图片可检查原尺寸。</p>
''' + '\n'.join(cards) + '''<p>第四铺下方大面积浅色带性质尚待确认，本候选将其保留。边界判断为照片目视结果，不代替现场鉴定。</p></main></html>\n'''


def main():
    SELECTED.mkdir(parents=True, exist_ok=True)
    specs = [json.loads((HERE / f'mural-0{i}-crop.json').read_text(encoding='utf-8')) for i in [3, 4]]
    results = []
    for spec in specs:
        source = ROOT / spec['source']
        before = digest(source)
        assert before == spec['sourceSha256'] == digest(ROOT / spec['existingWebSource'])
        with Image.open(source) as original:
            assert original.size == (spec['sourceWidth'], spec['sourceHeight'])
            assert original.getexif().get(274) == spec['exifOrientation']
            icc = original.info.get('icc_profile')
            c = spec['crop']
            box = tuple(c[k] for k in ['left', 'top', 'right', 'bottom'])
            assert 0 <= box[0] < box[2] <= original.width and 0 <= box[1] < box[3] <= original.height
            candidate = original.crop(box)
            assert candidate.size == (spec['outputWidth'], spec['outputHeight'])
            candidate.save(HERE / spec['candidate'], icc_profile=icc)
            # This is an exact copy, not a JPEG re-encode or a higher-resolution claim.
            shutil.copyfile(source, HERE / f"{spec['id']}-original-preview.jpg")
            boundary = annotated(original, box)
            boundary.save(HERE / f"{spec['id']}-boundary-preview.webp", lossless=True, icc_profile=icc)
            sheet = comparison(spec, original, boundary, candidate)
            sheet.save(SELECTED / f"{spec['id']}-comparison.jpg", quality=94, subsampling=0, icc_profile=icc)
            with Image.open(HERE / spec['candidate']) as saved:
                assert saved.tobytes() == candidate.tobytes()
                assert saved.info.get('icc_profile') == icc
        assert digest(source) == before
        results.append({'id': spec['id'], 'status': spec['status'], 'sourceSha256': before,
                        'candidateSha256': digest(HERE / spec['candidate']),
                        'output': [spec['outputWidth'], spec['outputHeight']],
                        'widthToHeight': spec['outputWidth'] / spec['outputHeight'],
                        'pixelEquality': True, 'iccPreserved': True, 'sourceUnchanged': True,
                        'removedRows': {'top': box[1], 'bottom': spec['sourceHeight'] - box[3]},
                        'perspective': 'none', 'runtimeImageReplaced': False})
    (HERE / 'source-inventory.json').write_text(json.dumps(inventory(), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (HERE / 'index.html').write_text(review_page(specs), encoding='utf-8')
    report = {'tool': f'Python / Pillow {PIL.__version__}', 'stage': 'A / preview only',
              'baseline': specs[0]['baselineCommit'], 'results': results}
    (HERE / 'processing-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
