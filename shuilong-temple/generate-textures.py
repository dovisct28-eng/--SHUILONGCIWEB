"""Deterministic, photo-informed material studies; no site photograph is mapped to geometry."""
from pathlib import Path
from PIL import Image
import math

OUT = Path(__file__).with_name('textures')
OUT.mkdir(exist_ok=True)
SIZE = 512


def noise(x, y, seed=0):
    value = (x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)
    value = (value ^ (value >> 13)) * 1274126177
    return ((value ^ (value >> 16)) & 255) / 255


def clamp(v):
    return max(0, min(255, int(v)))


def smooth_noise(x, y, step, seed):
    gx, gy = x / step, y / step
    ix, iy = int(gx), int(gy)
    fx, fy = gx - ix, gy - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    top = noise(ix, iy, seed) * (1 - fx) + noise(ix + 1, iy, seed) * fx
    bottom = noise(ix, iy + 1, seed) * (1 - fx) + noise(ix + 1, iy + 1, seed) * fx
    return top * (1 - fy) + bottom * fy


def texture(kind):
    color = Image.new('RGB', (SIZE, SIZE))
    rough = Image.new('RGB', (SIZE, SIZE))
    normal = Image.new('RGB', (SIZE, SIZE))
    colors = {
        'plaster': (199, 184, 157), 'brick': (139, 91, 68),
        'wood': (55, 45, 39), 'roof': (82, 76, 70),
        'stone': (157, 153, 144), 'paving': (135, 127, 111),
    }
    base = colors[kind]
    for y in range(SIZE):
        for x in range(SIZE):
            large = smooth_noise(x, y, 58, 2) - .5
            small = noise(x // 3, y // 3, 7) - .5
            grain = 0
            if kind == 'brick':
                row = y // 64
                joint = y % 64 < 4 or (x + (row % 2) * 64) % 128 < 4
                grain = (noise((x + (row % 2) * 64) // 128, row, 4) - .5) * 30
            elif kind == 'wood':
                grain = 7 * math.sin(x * .12 + 2 * math.sin(y * .012)) + 4 * math.sin(x * .047)
            elif kind == 'roof':
                joint = y % 128 < 5 or (x + ((y // 128) % 2) * 64) % 64 < 3
                grain = -20 if joint else 5 * math.sin(x * .09)
            elif kind == 'paving':
                row = y // 128
                joint = y % 128 < 5 or (x + (row % 2) * 64) % 128 < 4
                grain = -24 if joint else (noise((x + (row % 2) * 64) // 128, row, 3) - .5) * 17
            variation = large * (16 if kind == 'plaster' else 20) + small * 8 + grain
            if kind == 'brick' and noise(x // 64, y // 64, 11) > .91:
                variation -= 15
            if kind == 'paving' and noise(x // 64, y // 64, 13) > .9:
                variation -= 12
            if kind == 'brick' and joint:
                color.putpixel((x, y), tuple(clamp(c + small * 8) for c in (177, 166, 147)))
            else:
                color.putpixel((x, y), tuple(clamp(c + variation) for c in base))
            r = clamp(237 + small * 14 + large * 9)
            rough.putpixel((x, y), (r, r, r))
            # Very shallow relief; the wall painting itself has no normal map.
            bump = 1.6 if kind in ('plaster', 'wood', 'stone') else 4.5
            dx = (noise(x // 4 + 1, y // 4, 19) - noise(x // 4 - 1, y // 4, 19)) * bump
            dy = (noise(x // 4, y // 4 + 1, 19) - noise(x // 4, y // 4 - 1, 19)) * bump
            normal.putpixel((x, y), (clamp(128 + dx), clamp(128 + dy), 255))
    for suffix, image in [('basecolor', color), ('roughness', rough), ('normal', normal)]:
        image.save(OUT / f'{kind}-{suffix}.jpg', quality=78, optimize=True, subsampling=0)


for material in ('plaster', 'brick', 'wood', 'roof', 'stone', 'paving'):
    texture(material)
