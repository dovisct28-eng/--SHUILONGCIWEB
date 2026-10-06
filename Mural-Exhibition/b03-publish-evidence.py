"""Publish lossless browser evidence; keep original PNG captures locally."""
from hashlib import sha256
import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent / 'docs/validation/b03-v2-2026-10-06'
records = []
for source in sorted(root.glob('*.png')):
    target = source.with_suffix('.webp')
    with Image.open(source) as decoded:
        original = decoded.convert('RGBA')
        original.save(target, format='WEBP', lossless=True, exact=True, method=6)
        with Image.open(target) as compressed:
            restored = compressed.convert('RGBA')
            if restored.size != original.size or restored.tobytes() != original.tobytes():
                raise ValueError(f'Pixel mismatch: {target.name}')
        records.append({
            'source': source.name,
            'published': target.name,
            'size': list(original.size),
            'sourceBytes': source.stat().st_size,
            'publishedBytes': target.stat().st_size,
            'sourceSha256': sha256(source.read_bytes()).hexdigest(),
            'publishedSha256': sha256(target.read_bytes()).hexdigest(),
            'rgbaSha256': sha256(original.tobytes()).hexdigest(),
            'pixelsIdentical': True,
        })

report = {
    'format': 'WebP lossless, exact=True; RGBA decoded bytes verified identical',
    'scope': 'B03 actual browser captures only; regression PNGs and reference copies stay local',
    'count': len(records),
    'sourceBytes': sum(item['sourceBytes'] for item in records),
    'publishedBytes': sum(item['publishedBytes'] for item in records),
    'files': records,
}
(root / 'evidence-publication.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps({key: value for key, value in report.items() if key != 'files'}))
