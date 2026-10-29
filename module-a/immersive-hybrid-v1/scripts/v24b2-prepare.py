"""Prepare conservative B2 projection maps from new B1-view diagnostics.

The masks are reference-view validity masks, not live screen-space occlusion.
Live occlusion is provided by the existing architecture depth buffer.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw, ImageChops

base = Path(__file__).resolve().parents[1] / 'assets' / 'combined-b-transition'
names = ['gate-interior', 'stage-turn', 'corridor-advance', 'mural-approach']
out = base / 'prepared'
out.mkdir(exist_ok=True)
for name in names:
    # Render output is 1672x941, whereas the camera is 1920x1080. Resize to
    # that explicit reference canvas, rather than silently assuming dimensions.
    Image.open(base / 'candidates' / f'strict-{name}.png').convert('RGB').resize((1280, 720), Image.Resampling.LANCZOS).save(out / f'{name}.webp', quality=90, method=6)
    reg = Image.open(base / 'references' / f'{name}-regions.png').convert('RGB')
    masks = []
    for kind, channel in [('wall', 0), ('floor', 1)]:
        # Semantic labels come from the actual B1 GLB at each camera.
        mask = ImageChops.subtract(reg.getchannel(channel), reg.getchannel(1-channel)).point(lambda v: 255 if v > 230 else 0)
        if kind == 'wall':
            # The second set preserves the structural boundaries more closely;
            # still keep a guard band around every actual modeled edge.
            safe = Image.new('L', reg.size); d = ImageDraw.Draw(safe)
            d.rectangle((1018, 100, 1900, 1050), fill=255)
        else:
            # Central lower paving patch; kept independently switchable because
            # generated shadows and perspective need visual review.
            safe = Image.new('L', reg.size); d = ImageDraw.Draw(safe)
            d.rectangle((480, 680, 1340, 1050), fill=255)
        mask = ImageChops.multiply(mask, safe).filter(ImageFilter.MinFilter(21)).filter(ImageFilter.GaussianBlur(32 if kind == 'wall' else 24))
        mask.save(out / f'{name}-{kind}-valid.png', optimize=True)
        masks.append(mask.resize((1280, 720), Image.Resampling.LANCZOS))
    Image.merge('RGB', (masks[0], masks[1], Image.new('L', (1280, 720)))).save(out / f'{name}-valid-rg.png', optimize=True)
    print(name, 'prepared')
