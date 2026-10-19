"""Delivery checks for source preservation, editability and package completeness."""
from pathlib import Path
import hashlib,json,posixpath,sys,unittest,zipfile
from lxml import etree as E
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT.parent/'revision-v3/output/出兵·入将-独立阅读评审版V3.pptx'
FINAL=Path(sys.argv.pop(1)) if len(sys.argv)>1 else ROOT/'local/candidate.pptx'
P='http://schemas.openxmlformats.org/presentationml/2006/main'
A='http://schemas.openxmlformats.org/drawingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS={'p':P,'a':A,'r':R}
class Delivery(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.old=zipfile.ZipFile(SOURCE);cls.new=zipfile.ZipFile(FINAL)
 def test_source_is_unchanged(self):
  self.assertEqual(hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'eface3ee8eddefc46ab3a6ae683b9727cd70a9fbdd39e033a4c8eecf15fabdc6')
 def test_slide_order_and_dimensions(self):
  pres=E.fromstring(self.new.read('ppt/presentation.xml'))
  rels={r.get('Id'):r.get('Target').lstrip('/') for r in E.fromstring(self.new.read('ppt/_rels/presentation.xml.rels'))}
  ordered=[posixpath.normpath(posixpath.join('ppt',rels[n.get('{'+R+'}id')])) for n in pres.find('p:sldIdLst',NS)]
  expected=[f'ppt/slides/slide{i}.xml' for i in [1,2,3,4,13,14,15,5,6,7,8,9,10,11,12]]
  self.assertEqual(ordered,expected)
  self.assertEqual(pres.find('p:sldSz',NS).attrib,{'cx':'12192000','cy':'6858000'})
 def test_original_slides_preserved_except_page_number(self):
  for i in range(1,13):
   path=f'ppt/slides/slide{i}.xml';old=E.fromstring(self.old.read(path));new=E.fromstring(self.new.read(path))
   if i>=5:
    candidates=[s for s in new.xpath('//p:sp',namespaces=NS) if s.xpath('string(.//a:t)',namespaces=NS)==f'{i+3:02}' and s.xpath('.//a:xfrm/a:off[number(@x)>10000000 and number(@y)<800000]',namespaces=NS)]
    self.assertEqual(len(candidates),1);candidates[0].xpath('.//a:t',namespaces=NS)[0].text=f'{i:02}'
   self.assertEqual(E.tostring(old,method='c14n'),E.tostring(new,method='c14n'),f'Original content changed: {path}')
 def test_all_original_media_and_slide_relationships_preserved(self):
  for path in self.old.namelist():
   if not path.endswith('/') and (path.startswith('ppt/media/') or path.startswith('ppt/slides/_rels/')):
    self.assertEqual(self.old.read(path),self.new.read(path),path)
 def test_no_missing_internal_relationships(self):
  names=set(self.new.namelist())
  for f in names:
   if not f.endswith('.rels'):continue
   owner=f.replace('/_rels/','/')[:-5] if f!='_rels/.rels' else ''
   for r in E.fromstring(self.new.read(f)):
    if r.get('TargetMode')=='External':continue
    t=r.get('Target');target=t[1:] if t.startswith('/') else posixpath.normpath(posixpath.join(posixpath.dirname(owner),t))
    self.assertIn(target,names,f'{f}: {target}')
 def test_three_new_slides_have_separate_editable_text_and_images(self):
  for i,count in [(13,3),(14,2),(15,2)]:
   xml=E.fromstring(self.new.read(f'ppt/slides/slide{i}.xml'))
   self.assertEqual(len(xml.xpath('//p:pic',namespaces=NS)),count)
   self.assertGreaterEqual(len(xml.xpath('//p:sp[p:txBody]',namespaces=NS)),6)
   text=''.join(xml.xpath('//a:t/text()',namespaces=NS));self.assertNotIn('待补',text);self.assertNotIn('placeholder',text.lower())
 def test_source_notes_present(self):
  notes=''.join(self.new.read(n).decode('utf-8') for n in self.new.namelist() if n.startswith('ppt/notesSlides/evo_') and n.endswith('.xml'))
  for phrase in ['figma.com/design/1oSGGtdcJY92KlzOdhLEpJ','48f272497e86e4549c5bcd0dee275ff347171a3f','copy-update-2026-10-05']:
   self.assertIn(phrase,notes)
 def test_all_xml_parses_and_zip_crc(self):
  self.assertIsNone(self.new.testzip())
  for path in self.new.namelist():
   if path.endswith(('.xml','.rels')):E.fromstring(self.new.read(path))
 def test_master_ids_unique_and_single_notes_master(self):
  pres=E.fromstring(self.new.read('ppt/presentation.xml'))
  self.assertEqual(len(pres.xpath('//p:notesMasterId',namespaces=NS)),1)
  values=[]
  for path in self.new.namelist():
   if path.endswith('.xml') and (path=='ppt/presentation.xml' or path.startswith('ppt/slideMasters/')):
    values+=E.fromstring(self.new.read(path)).xpath('//p:sldMasterId/@id | //p:sldLayoutId/@id',namespaces=NS)
  self.assertEqual(len(values),len(set(values)))
if __name__=='__main__':unittest.main(verbosity=2)
