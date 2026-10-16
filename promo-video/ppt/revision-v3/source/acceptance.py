"""Check reading essentials, editability, provenance and exported artifacts."""
from pathlib import Path
from xml.etree import ElementTree as E
from zipfile import ZipFile
import hashlib,json,re,unittest
from PIL import Image
from pypdf import PdfReader

BASE=Path(__file__).resolve().parents[1]
ROOT=BASE.parents[2]
NS={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
class Acceptance(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.pptx=next((BASE/'output').glob('*.pptx'))
  cls.z=ZipFile(cls.pptx)
  cls.slides=[E.fromstring(cls.z.read(f'ppt/slides/slide{i}.xml')) for i in range(1,13)]
  cls.texts=['\n'.join(''.join(p.itertext()) for p in s.findall('.//a:p',NS)) for s in cls.slides]
 def test_reader_can_identify_product_before_detail_pages(self):
  self.assertIn('电脑浏览器',self.texts[0]);self.assertIn('壁画导读',self.texts[0]);self.assertIn('人物探索',self.texts[0])
  self.assertIn('可按需选择',self.texts[2])
 def test_journey_keeps_three_murals_and_user_entry(self):
  for term in ['第五幅','第一幅','第二幅','主动点击','模块 A','模块 B']:self.assertIn(term,self.texts[3])
  for term in ['第五幅','第一幅','第二幅','右端','左','项目设计']:self.assertIn(term,self.texts[5])
 def test_actions_and_results_are_visible_without_notes(self):
  for term in ['缩放','拖动','热点','人物索引','人物简介']:self.assertIn(term,self.texts[6])
  for term in ['1秒','手掌','光标','进度环','切换人物','收起']:self.assertIn(term,self.texts[8])
 def test_authenticity_boundaries_are_visible_on_relevant_pages(self):
  self.assertIn('不等同于历史原色复原',self.texts[7])
  self.assertIn('预设流程演示',self.texts[8]);self.assertIn('待实测',self.texts[8])
  self.assertIn('不替代现场摄像头测试',self.texts[10])
 def test_pptx_is_editable_and_has_twelve_visible_slides(self):
  pres=E.fromstring(self.z.read('ppt/presentation.xml'));self.assertEqual(len(pres.find('p:sldIdLst',NS)),12)
  for s in self.slides:
   self.assertNotEqual(s.get('show'),'0');self.assertGreaterEqual(len(s.findall('.//p:sp/p:txBody',NS)),5)
  self.assertGreater(len(self.slides[9].findall('.//p:sp',NS)),20)
 def test_existing_deck_and_every_media_part_are_preserved(self):
  baseline=json.loads((BASE/'content/baseline.json').read_text('utf8'));old=ROOT/baseline['source']
  self.assertEqual(hashlib.sha256(old.read_bytes()).hexdigest(),baseline['sha256'])
  with ZipFile(old) as z:
   for name in z.namelist():
    if name.startswith('ppt/media/'):self.assertEqual(z.read(name),self.z.read(name))
 def test_no_added_personal_identity_or_placeholder(self):
  text='\n'.join(self.z.read(n).decode('utf8') for n in self.z.namelist() if n.endswith('.xml') and ('slides/' in n or 'notesSlides/' in n or n.startswith('docProps/')))
  self.assertIsNone(re.search(r'dovis|C:\\Users|D:\\YJS|github\.com|TODO|lorem ipsum|作者姓名|指导教师',text,re.I))
 def test_geometry_and_structural_receipts(self):
  for b in json.loads((BASE/'local/geometry.json').read_text('utf8')):
   self.assertGreaterEqual(b['x'],0);self.assertGreaterEqual(b['y'],0)
   self.assertLessEqual(b['x']+b['w'],13.334);self.assertLessEqual(b['y']+b['h'],7.501)
  r=json.loads((BASE/'qa/presentation-validation.json').read_text('utf8'))
  self.assertEqual(r['packageIntegrity']['status'],'pass')
  self.assertEqual(r['presentationLayout']['finding_count'],0)
  self.assertEqual(r['presentationLayout']['warning_count'],0)
  self.assertTrue(r['firstPartyImport']['passed'])
  self.assertEqual(hashlib.sha256(self.pptx.read_bytes()).hexdigest(),r['finalSha256'])
 def test_all_slide_previews_and_pdf_roundtrip(self):
  files=sorted((BASE/'preview/slides').glob('slide-*.png'));self.assertEqual(len(files),12)
  for p in files:
   with Image.open(p) as image:self.assertEqual(image.size,(1920,1080))
  pdf=PdfReader(next((BASE/'output').glob('*.pdf')));self.assertEqual(len(pdf.pages),12)
  self.assertFalse(pdf.metadata.get('/Author'))
  r=json.loads((BASE/'qa/pdf-review.json').read_text('utf8'));self.assertEqual(r['status'],'PASS')
  self.assertEqual(max(p['maxDifference'] for p in r['pages']),0)

def document():
 rows=['# V3 实际文件文字存档','直接从正式 PPTX 提取，不依赖讲稿。网页截图内的文字不在此列。']
 with ZipFile(next((BASE/'output').glob('*.pptx'))) as z:
  for i in range(1,13):
   rows.append(f'\n## P{i:02}')
   for s in E.fromstring(z.read(f'ppt/slides/slide{i}.xml')).findall('.//p:sp',NS):
    text='\n'.join(''.join(p.itertext()) for p in s.findall('.//a:p',NS)).strip()
    if text:rows.append('\n'+text)
 (BASE/'content/slide-copy.md').write_text('\n'.join(rows)+'\n',encoding='utf8')
 files=[*sorted((BASE/'output').iterdir()),*sorted((BASE/'preview/slides').glob('*.png')),BASE/'preview/contact-sheet.png']
 (BASE/'qa/delivery-manifest.json').write_text(json.dumps({'date':'2026-10-16','files':[{'path':str(p.relative_to(BASE)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],'nativePowerPointReview':False,'pdfSelectableText':False},ensure_ascii=False,indent=2)+'\n',encoding='utf8')

if __name__=='__main__':
 document();unittest.main(verbosity=2)
