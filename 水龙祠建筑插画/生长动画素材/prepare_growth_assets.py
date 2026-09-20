"""Derive aligned RGBA previews from the two approved temple illustrations.

The source PNGs are read only. Run from this directory with the bundled Python.
"""

from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


SCRIPT_DIR = Path(__file__).resolve().parent
if SCRIPT_DIR.name == "生长动画素材":
    ART_DIR = SCRIPT_DIR.parent
    OUT_DIR = SCRIPT_DIR
else:
    ART_DIR = SCRIPT_DIR.parent / "水龙祠建筑插画"
    OUT_DIR = SCRIPT_DIR / "growth_stage_work"
FOUNDATION = ART_DIR / "水龙祠-2.5D地基插画-初稿.png"
COMPLETE = ART_DIR / "水龙祠-2.5D建筑插画-开屏右侧结构校正版-v1.png"
SIZE = (1122, 1402)

# Registration from visible footprint anchors: entrance corners and far-hall edge.
FOUNDATION_SCALE_X = 0.774
FOUNDATION_SCALE_Y = 0.842
FOUNDATION_OFFSET_X = 329.0
FOUNDATION_OFFSET_Y = 51.0


def extract_rgba(source: Path) -> Image.Image:
    image = Image.open(source).convert("RGB")
    if image.size != SIZE:
        raise ValueError(f"Unexpected source size: {source}: {image.size}")
    if source == FOUNDATION:
        # The base is rectilinear. A traced outline avoids keeping its broad,
        # pale baked-in shadow as an opaque fringe on dark webpage backgrounds.
        alpha = Image.new("L", SIZE, 0)
        ImageDraw.Draw(alpha).polygon(
            [
                (250, 70), (818, 70), (823, 1165), (858, 1165),
                (858, 1320), (212, 1320), (212, 1165), (240, 1165),
                (240, 72),
            ],
            fill=255,
        )
        result = image.convert("RGBA")
        result.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.7)))
        return result
    rgb = np.asarray(image)
    low = rgb.min(axis=2)
    high = rgb.max(axis=2)
    # Only near-neutral, nearly white pixels can belong to the outside field.
    # The final art uses a lightly textured warm-ivory field, not pure white.
    outside_candidate = (low >= 155) & ((high - low) <= 100)
    height, width = outside_candidate.shape
    candidates = outside_candidate.ravel()
    outside = np.zeros(height * width, dtype=bool)
    queue = deque([0])
    outside[0] = True
    while queue:
        index = queue.popleft()
        x = index % width
        neighbors = []
        if x > 0:
            neighbors.append(index - 1)
        if x < width - 1:
            neighbors.append(index + 1)
        if index >= width:
            neighbors.append(index - width)
        if index < width * (height - 1):
            neighbors.append(index + width)
        for next_index in neighbors:
            if candidates[next_index] and not outside[next_index]:
                outside[next_index] = True
                queue.append(next_index)
    foreground = ~outside.reshape(height, width)
    hard_alpha = Image.fromarray(np.where(foreground, 255, 0).astype("uint8"), "L")
    # Anti-alias the silhouette by one pixel without reducing interior opacity.
    alpha = hard_alpha.filter(ImageFilter.GaussianBlur(0.8))
    result = image.convert("RGBA")
    result.putalpha(alpha)
    return result


def align_foundation(image: Image.Image) -> Image.Image:
    sx, sy = FOUNDATION_SCALE_X, FOUNDATION_SCALE_Y
    tx, ty = FOUNDATION_OFFSET_X, FOUNDATION_OFFSET_Y
    return image.transform(
        SIZE,
        Image.Transform.AFFINE,
        (1 / sx, 0, -tx / sx, 0, 1 / sy, -ty / sy),
        resample=Image.Resampling.BICUBIC,
        fillcolor=(0, 0, 0, 0),
    )


def preview_overlay(foundation: Image.Image, complete: Image.Image) -> Image.Image:
    bg = Image.new("RGB", SIZE, (225, 226, 222)).convert("RGBA")
    f = foundation.copy()
    c = complete.copy()
    f.putalpha(f.getchannel("A").point(lambda a: round(a * 0.55)))
    c.putalpha(c.getchannel("A").point(lambda a: round(a * 0.55)))
    bg.alpha_composite(f)
    bg.alpha_composite(c)
    return bg.convert("RGB")


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    foundation = align_foundation(extract_rgba(FOUNDATION))
    complete = extract_rgba(COMPLETE)
    foundation.save(OUT_DIR / "地基-透明对齐样张.png")
    complete.save(OUT_DIR / "完整建筑-透明样张.png")
    preview_overlay(foundation, complete).save(OUT_DIR / "地基与完整建筑-叠加检查.png")
    dark = Image.new("RGBA", SIZE, (32, 41, 46, 255))
    dark.alpha_composite(complete)
    dark.convert("RGB").save(OUT_DIR / "完整建筑-深色背景检查.png")
    for name, image in (("foundation", foundation), ("complete", complete)):
        if image.mode != "RGBA" or image.getpixel((0, 0))[3] != 0:
            raise AssertionError(f"Transparent export failed for {name}")
        if image.getpixel((750, 700))[3] != 255:
            raise AssertionError(f"Courtyard unexpectedly transparent for {name}")
        if image.getpixel((1115, 700))[3] != 0:
            raise AssertionError(f"Right-side background unexpectedly opaque for {name}")
    print("PASS: aligned foundation, exported two RGBA cutouts and overlay preview")


if __name__ == "__main__":
    main()
