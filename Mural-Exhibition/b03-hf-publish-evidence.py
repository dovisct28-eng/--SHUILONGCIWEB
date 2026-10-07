"""Publish only selected actual screenshots; retain original captures in local/."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'docs/validation/b03-hf-01'
selected = root / 'selected'
selected.mkdir(parents=True, exist_ok=True)
record = {'type': 'Actual Chrome screenshots, no concept renders', 'screenshots': []}
for size in ['1920x1080', '1440x900', '1366x768', '1280x800']:
    for state in ['default', 'revealed']:
        source = root / 'local/theatre' / f'{state}-{size}.png'
        target = selected / f'{state}-{size}.webp'
        with Image.open(source) as image:
            original = image.convert('RGBA')
            original.save(target, format='WEBP', lossless=True, method=6)
            with Image.open(target) as published:
                assert published.size == original.size
                assert published.convert('RGBA').tobytes() == original.tobytes()
        record['screenshots'].append({'file': str(target.relative_to(root)),
            'source': str(source.relative_to(root)), 'bytes': target.stat().st_size,
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'rgbaIdentical': True})
record['count'] = len(record['screenshots'])
record['totalBytes'] = sum(x['bytes'] for x in record['screenshots'])
for source, target in [('b03/results.json', 'b03-results.json'),
                       ('b03/stage-results.json', 'stage-results.json'),
                       ('theatre/results.json', 'theatre-results.json'),
                       ('b01/results.json', 'b01-results.json'),
                       ('b02/results.json', 'b02-results.json')]:
    payload = json.loads((root / 'local' / source).read_text(encoding='utf-8'))
    assert not payload.get('errors'), (source, payload.get('errors'))
    (root / target).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
(root / 'evidence-publication.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
print(f"Selected {record['count']} screenshots, {record['totalBytes']} bytes; exact RGBA verified.")
