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
        # A warm, restrained illustration palette, informed by the site photos.
        # These are display materials, not sampled conservation colour records.
        'plaster': (211, 201, 180), 'brick': (158, 112, 87),
        'wood': (97, 66, 47), 'roof': (105, 99, 87),
        'stone': (184, 177, 161), 'paving': (183, 171, 148),
    }
    base = colors[kind]
    for y in range(SIZE):
        for x in range(SIZE):
            # All six materials repeat in world space; keep broad stains periodic.
            large = smooth_noise(x, y, 64, 2, periodic=True) - .5
            small = noise(x // 3, y // 3, 7) - .5
            grain = 0
            if kind == 'brick':
                row = y // 64
                # Small irregularities soften the mortar edges without modeling bricks.
                edge = smooth_noise(x, y, 16, 23, periodic=True) * 1.4
                joint = y % 64 < 3 + edge or (x + (row % 2) * 64) % 128 < 3 + edge
                grain = (noise(((x + (row % 2) * 64) // 128) % 4, row, 4) - .5) * 32
            elif kind == 'wood':
                grain = 5 * math.sin(x * math.tau / 32 + 1.2 * math.sin(y * math.tau / SIZE)) + 3 * math.sin(x * math.tau / 128)
            elif kind == 'roof':
                # Narrow channels read as layered grey clay, without tiny geometry.
                tile_x, tile_y = x // 64, y // 128
                joint = y % 128 < 4 or x % 64 < 3
                clay = (noise(tile_x, tile_y, 31) - .5) * 29
                grain = -21 if joint else clay + 8 * math.sin((x % 64) * math.pi / 64)
            elif kind == 'paving':
                row = y // 128
                joint = y % 128 < 5 or (x + (row % 2) * 64) % 128 < 4
                grain = -20 if joint else (noise(((x + (row % 2) * 64) // 128) % 4, row, 3) - .5) * 25
            variation = large * (13 if kind == 'plaster' else 19) + small * 6 + grain
            if kind == 'brick' and noise(x // 64, y // 64, 11) > .91:
                variation -= 15
            if kind == 'paving' and noise(x // 64, y // 64, 13) > .9:
                variation -= 12
            if kind == 'brick' and joint:
                color.putpixel((x, y), tuple(clamp(c + small * 6 + large * 6) for c in (180, 167, 145)))
            else:
                weathering = max(0, large - .08) * .45 if kind == 'brick' else 0
                color.putpixel((x, y), tuple(clamp((c + variation) * (1 - weathering) + 172 * weathering) for c in base))
            r = clamp((218 if kind == 'wood' else 237) + small * 14 + large * 9)
            rough.putpixel((x, y), (r, r, r))
            # Very shallow relief; the wall painting itself has no normal map.
            bump = 1.6 if kind in ('plaster', 'wood', 'stone') else 4.5
            dx = (noise(x // 4 + 1, y // 4, 19) - noise(x // 4 - 1, y // 4, 19)) * bump
            dy = (noise(x // 4, y // 4 + 1, 19) - noise(x // 4, y // 4 - 1, 19)) * bump
            normal.putpixel((x, y), (clamp(128 + dx), clamp(128 + dy), 255))
    for suffix, image in [('basecolor', color), ('roughness', rough), ('normal', normal)]:
        image.save(OUT / f'{kind}-{suffix}.jpg', quality=78, optimize=True, subsampling=0)


if __name__ == '__main__':
    for material in ('plaster', 'brick', 'wood', 'roof', 'stone', 'paving'):
        texture(material)
