"""Publish reviewed, exact runtime captures; originals and full regressions stay local."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'docs/validation/b03-hf-03'
selected = root / 'selected'
selected.mkdir(parents=True, exist_ok=True)
shots = [(f'{state}-{size}.png', f'formal-01-{state}-{size}.webp', 'Tracked formal figure ID01')
         for size in ['1920x1080', '1440x900', '1366x768', '1280x800'] for state in ['default', 'revealed']]
# Reuse the standard material comparison as the 1440 default evidence, no duplicate.
shots = [('material-standard.png' if target == 'formal-01-default-1440x900.webp' else source, target, label)
         for source, target, label in shots]
shots += [(f'{name}.png', f'{name}.webp', 'Actual formal ID01, exhibition layer only')
          for name in ['material-off', 'material-subtle', 'pigment-forming', 'orbit-forming', 'switching']]
record = {'type': 'Actual Chrome screenshots; camera boundary stubbed', 'screenshots': []}
for source, target, status in shots:
    source = root / 'local/surface' / source
    target = selected / target
    with Image.open(source) as image:
        original = image.convert('RGBA')
        original.save(target, format='WEBP', lossless=True, method=6)
        with Image.open(target) as published:
            assert published.size == original.size
            assert published.convert('RGBA').tobytes() == original.tobytes()
    record['screenshots'].append({'file': target.relative_to(root).as_posix(), 'source': source.relative_to(root).as_posix(),
        'status': status, 'size': list(original.size), 'bytes': target.stat().st_size,
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest(), 'rgbaIdentical': True})
with Image.open(root / 'local/surface/off-shader.png') as treated, Image.open(root / 'local/surface/off-original-material.png') as bare:
    assert treated.size == bare.size and treated.convert('RGBA').tobytes() == bare.convert('RGBA').tobytes()
    record['offComparison'] = {'originalMaterial': 'Three.js MeshBasicMaterial without surface hook', 'sameRGBA': True, 'differentPixels': 0, 'size': list(treated.size)}
for source, target in [('b03/results.json', 'b03-results.json'), ('b03/stage-results.json', 'stage-results.json'),
                       ('surface/results.json', 'surface-results.json'), ('layout/results.json', 'layout-results.json'),
                       ('theatre/results.json', 'theatre-results.json'), ('b01/results.json', 'b01-results.json'), ('b02/results.json', 'b02-results.json'),
                       ('performance-baseline.json', 'performance-baseline.json'), ('performance-candidate.json', 'performance-candidate.json')]:
    payload = json.loads((root / 'local' / source).read_text(encoding='utf-8-sig'))
    assert not payload.get('errors') and not payload.get('failure'), source
    (root / target).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
record['count'] = len(record['screenshots'])
record['totalBytes'] = sum(x['bytes'] for x in record['screenshots'])
(root / 'evidence-publication.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Published {record['count']} lossless keyframes, {record['totalBytes']} bytes; exact RGBA verified, OFF identical to original material.")
