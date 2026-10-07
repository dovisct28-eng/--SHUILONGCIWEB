"""Publish only reviewed actual runtime keyframes; keep full captures in local/."""
from pathlib import Path
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'docs/validation/b03-hf-02'
selected = root / 'selected'
selected.mkdir(parents=True, exist_ok=True)
shots = [(f'layout/formal-01-{state}-{size}.png', f'formal-01-{state}-{size}.webp', 'Tracked formal figure ID01')
         for size in ['1920x1080', '1440x900', '1366x768', '1280x800'] for state in ['default', 'revealed']]
shots += [(f'layout/local-author-05-{state}-1440x900.png', f'local-author-05-{state}.webp', 'Preexisting local uncommitted ID05 figure, excluded from asset delivery') for state in ['default', 'revealed']]
shots += [(f'layout/synthetic-{name}-default.png', f'synthetic-{name}-default.webp', 'Synthetic algorithm fixture, not a heritage image') for name in ['tall', 'wide', 'left']]
shots += [('layout/synthetic-thin-revealed.png', 'synthetic-thin-revealed.webp', 'Synthetic faint thin structure; algorithm fixture only'),
          ('theatre/legacy-02.png', 'legacy-02.webp', 'Legacy line/color compatibility, no formal cutout acceptance')]
record = {'type': 'Actual Chrome screenshots; synthetic cases explicitly labeled', 'screenshots': []}
for source, target, status in shots:
    source = root / 'local' / source
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
for source, target in [('b03/results.json', 'b03-results.json'), ('b03/stage-results.json', 'stage-results.json'),
                       ('layout/results.json', 'layout-results.json'), ('theatre/results.json', 'theatre-results.json'),
                       ('b01/results.json', 'b01-results.json'), ('b02/results.json', 'b02-results.json')]:
    payload = json.loads((root / 'local' / source).read_text(encoding='utf-8-sig'))
    assert not payload.get('errors') and not payload.get('failure'), source
    (root / target).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
record['count'] = len(record['screenshots'])
record['totalBytes'] = sum(x['bytes'] for x in record['screenshots'])
(root / 'evidence-publication.json').write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
layout = json.loads((root / 'layout-results.json').read_text(encoding='utf-8'))
times = sorted(p['layoutMs'] for p in layout['performance'])
summary = {'samples': len(times), 'layoutMs': {'mean': sum(times)/len(times), 'p95': times[int((len(times)-1)*.95)], 'max': max(times)},
    'limits': 'Headless browser timing, not physical camera/gesture or exhibition FPS acceptance',
    'formal': [{'id': p['id'], 'resourceStatus': p['resourceStatus'], 'defaultTemplate': p['closed'].get('template'),
                'defaultPanels': p['closed'].get('count', 0), 'revealedPanels': p['opened'].get('count', 0)} for p in layout['formal'] if 'id' in p],
    'synthetic': [{'name': p['name'], 'width': p['width'], 'height': p['height'], 'template': p['before']['template'],
                   'defaultPanels': p['before']['count'], 'revealedPanels': p['opened']['count']} for p in layout['synthetic'] if 'width' in p]}
(root / 'layout-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding='utf-8')
print(f"Published {record['count']} lossless keyframes, {record['totalBytes']} bytes; exact RGBA verified.")
print(summary['layoutMs'])
