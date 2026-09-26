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


def smooth_noise(x, y, step, seed, periodic=False):
    gx, gy = x / step, y / step
    ix, iy = int(gx), int(gy)
    fx, fy = gx - ix, gy - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    period = SIZE // step
    def sample(a, b):
        return noise(a % period, b % period, seed) if periodic else noise(a, b, seed)
    top = sample(ix, iy) * (1 - fx) + sample(ix + 1, iy) * fx
    bottom = sample(ix, iy + 1) * (1 - fx) + sample(ix + 1, iy + 1) * fx
    return top * (1 - fy) + bottom * fy


def texture(kind):
    color = Image.new('RGB', (SIZE, SIZE))
    rough = Image.new('RGB', (SIZE, SIZE))
    normal = Image.new('RGB', (SIZE, SIZE))
    colors = {
        'plaster': (190, 183, 167), 'brick': (124, 91, 76),
        'wood': (55, 45, 39), 'roof': (82, 76, 70),
        'stone': (157, 153, 144), 'paving': (135, 127, 111),
    }
    base = colors[kind]
    for y in range(SIZE):
        for x in range(SIZE):
            wall = kind in ('brick', 'plaster')
            large = smooth_noise(x, y, 64 if wall else 58, 2, periodic=wall) - .5
            small = noise(x // 3, y // 3, 7) - .5
            grain = 0
            if kind == 'brick':
                row = y // 64
                # Small irregularities soften the mortar edges without modeling bricks.
                edge = smooth_noise(x, y, 16, 23, periodic=True) * 1.4
                joint = y % 64 < 3 + edge or (x + (row % 2) * 64) % 128 < 3 + edge
                grain = (noise(((x + (row % 2) * 64) // 128) % 4, row, 4) - .5) * 24
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
                color.putpixel((x, y), tuple(clamp(c + small * 8 + large * 6) for c in (166, 159, 145)))
            else:
                weathering = max(0, large - .08) * .45 if kind == 'brick' else 0
                color.putpixel((x, y), tuple(clamp((c + variation) * (1 - weathering) + 172 * weathering) for c in base))
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
