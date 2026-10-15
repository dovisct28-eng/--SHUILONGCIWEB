from pathlib import Path
import hashlib,json,zipfile
from xml.etree import ElementTree as E
BASE=Path(__file__).resolve().parents[1]
candidate=BASE/'local/candidate.pptx';final=BASE/'output/chubing-rujiang-e-category.pptx'
differences=[]
with zipfile.ZipFile(candidate) as a,zipfile.ZipFile(final) as b:
 assert set(a.namelist())==set(b.namelist())
 for name in a.namelist():
  if a.read(name)==b.read(name):continue
  differences.append(name)
  assert name=='docProps/core.xml',name
  x,y=E.fromstring(a.read(name)),E.fromstring(b.read(name))
  for root in (x,y):
   for e in root:
    if e.tag.endswith('}created') or e.tag.endswith('}modified'):e.text='BUILD_TIMESTAMP'
  assert E.tostring(x)==E.tostring(y)
 report={'status':'PASS','recreatedPackageParts':len(a.namelist()),'allSlideAndMediaPartsByteIdentical':True,'onlyDifferences':differences,'allowedDifference':'Build timestamp only in docProps/core.xml','finalSha256':hashlib.sha256(final.read_bytes()).hexdigest()}
(BASE/'qa/source-reproduction.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report))
