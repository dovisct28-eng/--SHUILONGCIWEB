"""Artifact acceptance: content, editability, anonymity, geometry and provenance."""
import hashlib,json,re,unittest,zipfile
from pathlib import Path
from xml.etree import ElementTree as E
from PIL import Image
from pypdf import PdfReader

BASE=Path(__file__).resolve().parents[1];ROOT=BASE.parents[1]
NS={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
class Acceptance(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.z=zipfile.ZipFile(BASE/'output/chubing-rujiang-e-category.pptx')
  cls.slides=[E.fromstring(cls.z.read(f'ppt/slides/slide{i}.xml')) for i in range(1,13)]
  cls.texts=[''.join(r.itertext()) for r in cls.slides]
 def test_exact_slide_count_and_canvas(self):
  p=E.fromstring(self.z.read('ppt/presentation.xml'))
  self.assertEqual(len(p.find('p:sldIdLst',NS)),12)
  sz=p.find('p:sldSz',NS);self.assertEqual((sz.get('cx'),sz.get('cy')),('12192000','6858000'))
 def test_editable_text_and_native_diagrams(self):
  counts=[len(s.findall('.//p:sp/p:txBody',NS)) for s in self.slides]
  self.assertTrue(all(n>=4 for n in counts));self.assertGreater(sum(counts),150)
  self.assertGreater(len(self.slides[3].findall('.//p:sp',NS)),25)
  self.assertGreater(len(self.slides[9].findall('.//p:sp',NS)),25)
 def test_content_coverage_and_current_components(self):
  for index,terms in {0:['出兵','入将','水龙祠'],3:['模块 A','模块 B','第五幅','第一幅','第二幅'],5:['第五幅','第一幅','第二幅','右端','左端'],6:['缩放','拖动','热点','人物索引'],7:['原图','线稿','数字色稿','非历史原色复原'],8:['选择人物','驻留确认','查看简介','预设','现场摄像头'],9:['MediaPipe','OperatorTracker','HandOwnership','GesturePointer','DwellController'],10:['173 秒','00:00','02:53','ChatCut','Remotion','H.264'],11:['持续利用','数字叙事']}.items():
   compact=self.texts[index].replace('\n','')
   for term in terms:self.assertIn(term,compact)
 def test_anonymity_and_no_hidden_slides(self):
  files=[n for n in self.z.namelist() if n.endswith('.xml') and ('slides/'in n or 'notesSlides/'in n or n.startswith('docProps/'))]
  text='\n'.join(self.z.read(n).decode('utf-8') for n in files)
  self.assertIsNone(re.search(r'dovis|C:\\Users|D:\\YJS|github\.com|指导教师|作者姓名|学校名称|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',text,re.I))
  for s in self.slides:self.assertNotEqual(s.get('show'),'0')
  core=E.fromstring(self.z.read('docProps/core.xml'))
  for e in core:
   if e.tag.endswith('creator') or e.tag.endswith('lastModifiedBy'):self.assertFalse(e.text)
 def test_no_image_mirroring_or_recolor_filters(self):
  for s in self.slides:
   for pic in s.findall('.//p:pic',NS):
    transform=pic.find('.//a:xfrm',NS)
    self.assertNotIn(transform.get('flipH'),['1','true']);self.assertNotIn(transform.get('flipV'),['1','true'])
    for tag in ['grayscl','duotone','lum','clrChange']:self.assertIsNone(pic.find('.//a:'+tag,NS))
 def test_original_asset_hashes_unchanged(self):
  assets=json.loads((BASE/'content/asset-manifest.json').read_text(encoding='utf-8'))
  for a in assets:
   if 'sha256'in a:self.assertEqual(hashlib.sha256((ROOT/a['source']).read_bytes()).hexdigest(),a['sha256'])
 def test_frame_geometry_inside_slide(self):
  geometry=json.loads((BASE/'local/geometry.json').read_text(encoding='utf-8'))
  for g in geometry:
   self.assertGreaterEqual(g['x'],-.001,g);self.assertGreaterEqual(g['y'],-.001,g)
   self.assertLessEqual(g['x']+g['w'],13.334,g);self.assertLessEqual(g['y']+g['h'],7.501,g)
 def test_all_previews_and_anonymous_pdf(self):
  files=list((BASE/'preview/slides').glob('slide-*.png'));self.assertEqual(len(files),12)
  for p in files:
   with Image.open(p) as image:self.assertEqual(image.size,(1920,1080))
  pdf=PdfReader(BASE/'output/chubing-rujiang-e-category.pdf');self.assertEqual(len(pdf.pages),12)
  self.assertFalse(pdf.metadata.get('/Author'));self.assertFalse(pdf.metadata.get('/Creator'))
 def test_renderer_and_runtime_records(self):
  receipt=json.loads((BASE/'qa/presentation-validation.json').read_text(encoding='utf-8'))
  self.assertEqual(receipt['packageIntegrity']['status'],'pass')
  self.assertEqual(receipt['presentationLayout']['finding_count'],0)
  self.assertEqual(receipt['presentationLayout']['warning_count'],0)
  self.assertTrue(receipt['firstPartyImport']['passed'])
  runtime=json.loads((BASE/'qa/runtime-capture.json').read_text(encoding='utf-8'))
  self.assertEqual(runtime['status'],'PASS');self.assertEqual(runtime['errors'],[])
if __name__=='__main__':unittest.main(verbosity=2)
