"""Generate a web presentation derivative. Never overwrite the source mural."""
from pathlib import Path
from PIL import Image
import hashlib, json

repo = Path(__file__).resolve().parent.parent
source = repo / '水龙祠壁画素材/网页展示图/mural-02-display.webp'
output = repo / 'Mural-Exhibition/public/b01/mural-02-left.webp'
output.parent.mkdir(exist_ok=True)
with Image.open(source) as image:
    assert image.size == (6000, 1357), 'Source changed: review the crop before regenerating.'
    image.crop((0, 0, 2250, 1357)).resize((1800, 1086), Image.Resampling.LANCZOS).save(output, quality=88)
manifest = {
    'source': source.relative_to(repo).as_posix(),
    'sourceSHA256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'sourceDimensions': [6000, 1357],
    'crop': [0, 0, 2250, 1357],
    'output': output.relative_to(repo).as_posix(),
    'outputDimensions': [1800, 1086],
    'quality': 88,
    'bytes': output.stat().st_size,
    'outputSHA256': hashlib.sha256(output.read_bytes()).hexdigest(),
    'processing': 'left crop, proportional resampling, WebP compression; no mirroring, retouching or color filter'
}
(output.parent / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest, ensure_ascii=False))
