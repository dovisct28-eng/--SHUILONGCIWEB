"""Source protection, user-reference correspondence and planar-warp invariants."""
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import unittest

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'AGENTS.md').exists())
OUT = HERE / 'revision-2'
API = runpy.run_path(str(HERE / 'revise-candidates.py'), run_name='revision_helpers')
S3 = json.loads((OUT / 'mural-03-front.json').read_text(encoding='utf-8'))
S4 = json.loads((OUT / 'mural-04-crop.json').read_text(encoding='utf-8'))


class RevisionTests(unittest.TestCase):
    def test_originals_and_first_candidates_preserved(self):
        for spec in [S3, S4]:
            self.assertEqual(API['sha'](ROOT / spec['source']), spec['sourceSha256'])
        for name in ['mural-03-crop-candidate.png', 'mural-04-crop-candidate.png',
                     'mural-03-crop.json', 'mural-04-crop.json', 'mural-03-original-preview.jpg', 'mural-04-original-preview.jpg']:
            path = HERE / name
            expected = subprocess.check_output(['git', 'show', '990bcdf:' + path.relative_to(ROOT).as_posix()], cwd=ROOT)
            # JSON may have CRLF in Windows worktree; images must be byte-identical.
            actual = path.read_bytes()
            if path.suffix == '.json':
                self.assertEqual(json.loads(actual), json.loads(expected))
            else:
                self.assertEqual(hashlib.sha256(actual).digest(), hashlib.sha256(expected).digest())

    def test_fourth_crop_matches_pixels_and_requested_bottom(self):
        with Image.open(ROOT / S4['source']) as original, Image.open(OUT / S4['candidate']) as crop:
            self.assertEqual(crop.size, (1280, 939))
            self.assertEqual(crop.tobytes(), original.crop((0, 196, 1280, 1135)).tobytes())
            self.assertEqual(crop.info.get('icc_profile'), original.info.get('icc_profile'))
        with Image.open(ROOT / S4['source']) as original, Image.open(OUT / S4['reference']['file']) as reference:
            self.assertEqual(reference.size, (528, 389))
            match = API['reference_match'](original, reference)
            self.assertLess(match['interiorRGBMeanSquaredError'], 100)
            self.assertLess(abs(match['mappedSourceBottomApprox'] - 1135), 2)

    def test_third_reference_edges_become_horizontal_and_vertical(self):
        forward, _, _ = API['transform_parameters'](S3)
        p = API['project'](forward, S3['perspective']['sourceQuad'])
        self.assertAlmostEqual(p[0, 1], p[1, 1], places=8)
        self.assertAlmostEqual(p[2, 1], p[3, 1], places=8)
        self.assertAlmostEqual(p[0, 0], p[3, 0], places=8)
        self.assertAlmostEqual(p[1, 0], p[2, 0], places=8)
        self.assertTrue(p[1, 0] > p[0, 0] and p[3, 1] > p[0, 1])

    def test_third_full_uncorrected_crop_is_inside_output(self):
        forward, inverse, (w, h) = API['transform_parameters'](S3)
        points = API['project'](forward, [[0,96],[1280,96],[1280,760],[0,760]])
        self.assertTrue((points >= 0).all())
        self.assertTrue((points[:, 0] <= w).all() and (points[:, 1] <= h).all())
        np.testing.assert_allclose(API['project'](inverse, points), [[0,0],[1280,0],[1280,664],[0,664]], atol=1e-8)

    def test_third_is_only_declared_warp_with_transparent_gaps(self):
        with Image.open(ROOT / S3['source']) as original, Image.open(OUT / S3['candidate']) as saved:
            expected, _, _ = API['rectify'](original, S3)
            self.assertEqual(saved.size, (1323, 698))
            self.assertEqual(saved.tobytes(), expected.tobytes())
            self.assertEqual(saved.info.get('icc_profile'), original.info.get('icc_profile'))
            self.assertEqual(saved.getchannel('A').getextrema(), (0, 255))
            self.assertFalse(S3['processing']['ai'] or S3['processing']['repair'] or S3['processing']['colorAdjustment'])

    def test_report_records_interpolation_instead_of_lossless_pixel_claim(self):
        report = json.loads((OUT / 'processing-report.json').read_text(encoding='utf-8'))
        self.assertFalse(report['runtimeImageReplaced'])
        self.assertFalse(report['mural03']['pixelEquality'])
        self.assertTrue(report['mural04']['pixelEquality'])
        for spec, key in [(S3, 'mural03'), (S4, 'mural04')]:
            self.assertEqual(API['sha'](OUT / spec['candidate']), report[key]['candidateSha256'])


if __name__ == '__main__':
    unittest.main(verbosity=2)
