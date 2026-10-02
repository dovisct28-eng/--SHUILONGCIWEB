"""Subset only A01 copy locally. Fonts are public Noto CJK OFL resources."""
from pathlib import Path
import sys, re, json, hashlib
from html import unescape
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent
html = (root.parent / 'index.html').read_text(encoding='utf-8')
hero = html.split('<div class="hero">')[1].split('<section class="a02"')[0]
text = ''.join(sorted(set(unescape(re.sub('<[^>]+>', '', hero)) + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz，。·：；！？（）《》—→ %.-/')))
manifest = {'text': text, 'budgetBytes': 65536, 'fonts': []}
for path, name, weight in zip(sys.argv[1:], ['a01-serif','a01-sans'], [500,400]):
    font = TTFont(path)
    cmap = font.getBestCmap()
    missing = [c for c in text if not c.isspace() and ord(c) not in cmap]
    assert not missing, missing
    version = font['name'].getDebugName(5)
    options = subset.Options()
    options.flavor = 'woff2'
    sub = subset.Subsetter(options=options)
    sub.populate(text=text)
    sub.subset(font)
    font.flavor = 'woff2'
    destination = root / (name+'.woff2')
    font.save(destination)
    verify = TTFont(destination)
    assert all(ord(c) in verify.getBestCmap() for c in text if not c.isspace())
    manifest['fonts'].append({'file': destination.name, 'weight': weight, 'sourceVersion': version, 'bytes': destination.stat().st_size, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest(), 'sourceSHA256': hashlib.sha256(Path(path).read_bytes()).hexdigest()})
assert len(manifest['fonts']) == 2
assert sum(f['bytes'] for f in manifest['fonts']) <= manifest['budgetBytes']
(root/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False))
