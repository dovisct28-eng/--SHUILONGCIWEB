"""Optional study thumbnails from author assets; never overwrite source artwork.
Run with Pillow from Mural-Exhibition after adding/updating formal images.
"""
from pathlib import Path
import json,re
from PIL import Image
root=Path(__file__).resolve().parent/'public'
out=root/'b03/thumbs'
out.mkdir(parents=True,exist_ok=True)
for folder in (root/'assets').iterdir():
    if not folder.is_dir() or not (folder/'meta.json').is_file(): continue
    meta=json.loads((folder/'meta.json').read_text(encoding='utf-8'))
    if not isinstance(meta.get('id'),str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,64}',meta['id']): continue
    for layer in ('org','line','color'):
        source=next((folder/f'{layer}.{ext}' for ext in ('webp','png','jpg','jpeg') if (folder/f'{layer}.{ext}').is_file()),None)
        if source:
            with Image.open(source) as im:
                im.thumbnail((112,80),Image.Resampling.LANCZOS)
                im.save(out/f'{meta["id"]}-{layer}.webp',quality=85)
