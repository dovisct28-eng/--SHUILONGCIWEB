"""Real-source checks: crop identity, provenance and live-gallery protection."""
import hashlib
import json
from pathlib import Path
import subprocess
import unittest

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'AGENTS.md').exists())
BASELINE = 'a2176cece5beefdee39ab7b6be04c0549d8fef86'


class CandidateTests(unittest.TestCase):
    def test_generation_finished_and_inventory_covers_ignored_field_photos(self):
        report = json.loads((HERE / 'processing-report.json').read_text(encoding='utf-8'))
        inventory = json.loads((HERE / 'source-inventory.json').read_text(encoding='utf-8'))
        self.assertEqual(len(report['results']), 2)
        self.assertTrue(any(p['path'].startswith('水龙祠实地照片/') for p in inventory['images']))
        for result in report['results']:
            self.assertTrue(result['pixelEquality'] and result['iccPreserved'] and result['sourceUnchanged'])
            self.assertFalse(result['runtimeImageReplaced'])
            candidate = HERE / (result['id'] + '-crop-candidate.png')
            self.assertEqual(hashlib.sha256(candidate.read_bytes()).hexdigest(), result['candidateSha256'])

    def test_sources_and_original_previews_are_untouched(self):
        for i in [3, 4]:
            spec = json.loads((HERE / f'mural-0{i}-crop.json').read_text(encoding='utf-8'))
            for path in [ROOT / spec['source'], ROOT / spec['existingWebSource'], HERE / f'mural-0{i}-original-preview.jpg']:
                with self.subTest(path=str(path)):
                    self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), spec['sourceSha256'])

    def test_crop_is_lossless_and_preserves_profile_without_rotation_or_resize(self):
        for i in [3, 4]:
            spec = json.loads((HERE / f'mural-0{i}-crop.json').read_text(encoding='utf-8'))
            with self.subTest(mural=i), Image.open(ROOT / spec['source']) as original, Image.open(HERE / spec['candidate']) as candidate:
                c = spec['crop']
                box = tuple(c[k] for k in ['left', 'top', 'right', 'bottom'])
                self.assertEqual(original.size, (spec['sourceWidth'], spec['sourceHeight']))
                self.assertEqual(original.getexif().get(274), spec['exifOrientation'])
                self.assertEqual(candidate.size, (spec['outputWidth'], spec['outputHeight']))
                self.assertEqual(candidate.tobytes(), original.crop(box).tobytes())
                self.assertEqual(candidate.info.get('icc_profile'), original.info.get('icc_profile'))
                self.assertEqual(c['left'], 0)
                self.assertEqual(c['right'], original.width)
                self.assertEqual(spec['perspective']['method'], 'none')
                self.assertEqual(spec['status'], 'preview-candidate-awaiting-user-confirmation')

    def test_conservative_edges_and_unresolved_lower_band_are_retained(self):
        # Reviewed source landmarks, independent of exported candidate dimensions.
        # These include damaged grey plaster and the ambiguous fourth-mural lower band.
        for i, points in [(3, [(40, 128), (640, 132), (940, 754), (22, 700), (1260, 134)]),
                          (4, [(140, 211), (1220, 230), (640, 1350), (40, 1555), (1230, 1475)])]:
            spec = json.loads((HERE / f'mural-0{i}-crop.json').read_text(encoding='utf-8'))
            c = spec['crop']
            for x, y in points:
                with self.subTest(mural=i, point=[x, y]):
                    self.assertTrue(c['left'] <= x < c['right'] and c['top'] <= y < c['bottom'])

    def test_live_resources_and_controls_still_match_fetched_baseline(self):
        base = HERE.parent.parent
        for name in ['murals.json', 'study-v3.2.mjs', 'route-v3.2.mjs', 'route-surface-v3.2.mjs',
                     'route-v3.2.css', 'v32.html', 'mural-introductions.mjs', 'observations.mjs', 'reading-ambience.css']:
            path = base / name
            relative = path.relative_to(ROOT).as_posix()
            expected = subprocess.check_output(['git', 'show', f'{BASELINE}:{relative}'], cwd=ROOT)
            # Git working-tree line endings may be CRLF.
            self.assertEqual(path.read_bytes().replace(b'\r\n', b'\n'), expected.replace(b'\r\n', b'\n'), name)


if __name__ == '__main__':
    unittest.main(verbosity=2)
