"""Check shipped material readability and the lightweight texture budget."""
from pathlib import Path
import unittest
from PIL import Image, ImageStat

TEXTURES = Path(__file__).with_name('textures')
KINDS = ('plaster', 'brick', 'wood', 'roof', 'stone', 'paving')


def mean(kind):
    with Image.open(TEXTURES / f'{kind}-basecolor.jpg') as image:
        return ImageStat.Stat(image).mean


def luminance(kind):
    r, g, b = mean(kind)
    return .2126 * r + .7152 * g + .0722 * b


class ArchitecturalStyle(unittest.TestCase):
    def test_complete_small_local_material_sets(self):
        paths = [TEXTURES / f'{kind}-{channel}.jpg' for kind in KINDS
                 for channel in ('basecolor', 'roughness', 'normal')]
        self.assertLess(sum(path.stat().st_size for path in paths), 500_000)
        for path in paths:
            with self.subTest(path=path.name), Image.open(path) as image:
                self.assertEqual(image.size, (512, 512))
                self.assertEqual(image.mode, 'RGB')
                image.verify()

    def test_materials_remain_legible_in_aerial_view(self):
        # Pale courtyard and interior plaster must separate from the grey roofs.
        self.assertGreater(luminance('paving') - luminance('roof'), 45)
        self.assertGreater(luminance('plaster') - luminance('roof'), 70)
        self.assertGreater(luminance('stone') - luminance('wood'), 65)
        # Brick and wood have a warm undertone, without bright vermilion paint.
        for kind in ('brick', 'wood'):
            r, g, b = mean(kind)
            self.assertGreater(r, g)
            self.assertGreater(g, b)
            self.assertLess(r - b, 85)

    def test_roof_and_paving_keep_visible_surface_variation(self):
        for kind in ('roof', 'paving', 'brick'):
            with self.subTest(kind=kind), Image.open(TEXTURES / f'{kind}-basecolor.jpg') as image:
                variation = ImageStat.Stat(image.convert('L')).stddev[0]
                self.assertGreater(variation, 7)
                self.assertLess(variation, 30)


if __name__ == '__main__':
    unittest.main()
