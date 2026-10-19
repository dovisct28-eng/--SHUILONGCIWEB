"""Add three generated slides while retaining the user's existing slide XML/media."""
from pathlib import Path
import hashlib, json, posixpath, re, subprocess, sys, zipfile
try:
    from defusedxml.minidom import parseString
except ModuleNotFoundError:
    from xml.dom.minidom import parseString as _parse
    def parseString(data):
        # Runtime lacks defusedxml. Preserve namespace prefixes with minidom,
        # and reject document type/entity declarations before parsing.
        raw=data.encode('utf-8') if isinstance(data,str) else data
        if b'<!DOCTYPE' in raw.upper() or b'<!ENTITY' in raw.upper():
            raise ValueError('DTD/entity declarations are not permitted')
        return _parse(data)

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT.parent/'revision-v3/output/出兵·入将-独立阅读评审版V3.pptx'
ADD=ROOT/'local/additions.pptx'
OUT=ROOT/'local/candidate.pptx'
P='http://schemas.openxmlformats.org/presentationml/2006/main'
A='http://schemas.openxmlformats.org/drawingml/2006/main'
R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
PKG='http://schemas.openxmlformats.org/package/2006/relationships'
CT='http://schemas.openxmlformats.org/package/2006/content-types'
def dump(d): return d.toxml(encoding='utf-8')
def nodes(d,ns,name): return list(d.getElementsByTagNameNS(ns,name))
def resolved(owner,target): return posixpath.normpath(posixpath.join(posixpath.dirname(owner),target)) if not target.startswith('/') else target[1:]

before=hashlib.sha256(SRC.read_bytes()).hexdigest()
base=zipfile.ZipFile(SRC); additions=zipfile.ZipFile(ADD)
unpacked=ROOT/'local/merged-package-v2'
if unpacked.exists(): raise RuntimeError('Build directory already exists. Use a fresh build directory.')
base.extractall(unpacked)
helper=Path('C:/Users/dovis/.agents/skills/pptx/scripts/add_slide.py')
after='slide4.xml'
for _ in range(3):
    result=subprocess.run([sys.executable,str(helper),str(unpacked),'slide4.xml','--after',after],capture_output=True,text=True,encoding='utf-8',check=True)
    names=re.findall(r'slide\d+\.xml',result.stdout)
    after=names[0] if names else ''
    if not after: raise RuntimeError(result.stdout)
    print(result.stdout.strip())

mapping={}
for name in additions.namelist():
    if not name.startswith('ppt/') or name in ['ppt/presentation.xml','ppt/_rels/presentation.xml.rels','ppt/presProps.xml','ppt/tableStyles.xml','ppt/theme/theme1.xml']: continue
    if name.startswith('ppt/notesMasters/'):
        if name=='ppt/notesMasters/notesMaster1.xml':mapping[name]=name
        continue
    parent,leaf=posixpath.split(name)
    match=re.fullmatch(r'slide([123])\.xml(\.rels)?',leaf)
    if parent in ['ppt/slides','ppt/slides/_rels'] and match:
        mapping[name]=parent+'/slide'+str(12+int(match[1]))+'.xml'+(match[2] or '')
    else: mapping[name]=parent+'/evo_'+leaf

for old,new in mapping.items():
    if old.startswith('ppt/notesMasters/'):continue
    content=additions.read(old)
    if old.endswith('.rels'):
        doc=parseString(content)
        owner=old.replace('/_rels/','/')[:-5]
        newowner=mapping.get(owner,owner)
        for rel in nodes(doc,PKG,'Relationship'):
            if rel.getAttribute('TargetMode')=='External': continue
            target=resolved(owner,rel.getAttribute('Target'))
            if target not in mapping: raise RuntimeError(f'Unmapped relationship: {old} -> {target}')
            rel.setAttribute('Target',posixpath.relpath(mapping[target],posixpath.dirname(newowner)))
        content=dump(doc)
    dest=unpacked/new;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(content)

ctpath=unpacked/'[Content_Types].xml';ct=parseString(ctpath.read_bytes())
existing={n.getAttribute('PartName') for n in nodes(ct,CT,'Override')}
defaults={n.getAttribute('Extension') for n in nodes(ct,CT,'Default')}
for n in list(parseString(additions.read('[Content_Types].xml')).documentElement.childNodes):
    if n.nodeType!=n.ELEMENT_NODE: continue
    if n.localName=='Override':
        old=n.getAttribute('PartName').lstrip('/')
        if old not in mapping: continue
        n.setAttribute('PartName','/'+mapping[old])
        if n.getAttribute('PartName') in existing: continue
    elif n.localName=='Default':
        if n.getAttribute('Extension') in defaults: continue
    ct.documentElement.appendChild(ct.importNode(n,True))
ctpath.write_bytes(dump(ct))

prespath=unpacked/'ppt/presentation.xml';pres=parseString(prespath.read_bytes())
relpath=unpacked/'ppt/_rels/presentation.xml.rels';rels=parseString(relpath.read_bytes())
used_ids=[]
for filename in base.namelist():
    if filename.endswith('.xml') and (filename=='ppt/presentation.xml' or filename.startswith('ppt/slideMasters/')):
        doc=parseString(base.read(filename))
        used_ids.extend(int(n.getAttribute('id')) for tag in ['sldMasterId','sldLayoutId'] for n in nodes(doc,P,tag))
new_master_id=max(used_ids)+1
imported_master=unpacked/mapping['ppt/slideMasters/slideMaster1.xml']
doc=parseString(imported_master.read_bytes())
for i,node in enumerate(nodes(doc,P,'sldLayoutId'),new_master_id+1):node.setAttribute('id',str(i))
imported_master.write_bytes(dump(doc))
for kind,lst,tag,idvalue in [('slideMaster','sldMasterIdLst','sldMasterId',str(new_master_id))]:
    rel=next(n for n in nodes(parseString(additions.read('ppt/_rels/presentation.xml.rels')),PKG,'Relationship') if n.getAttribute('Type').endswith('/'+kind))
    target=mapping[resolved('ppt/presentation.xml',rel.getAttribute('Target'))]
    rid='rIdEvolution'+kind
    nr=rels.createElementNS(PKG,'Relationship');nr.setAttribute('Id',rid);nr.setAttribute('Type',R+'/'+kind);nr.setAttribute('Target',posixpath.relpath(target,'ppt'));rels.documentElement.appendChild(nr)
    parent=nodes(pres,P,lst)[0]
    node=pres.createElementNS(P,'p:'+tag)
    if idvalue:node.setAttribute('id',idvalue)
    node.setAttributeNS(R,'r:id',rid);parent.appendChild(node)
prespath.write_bytes(dump(pres));relpath.write_bytes(dump(rels))

for i in range(5,13):
    f=unpacked/f'ppt/slides/slide{i}.xml';d=parseString(f.read_bytes());matches=[]
    for shape in nodes(d,P,'sp'):
        ts=nodes(shape,A,'t');offs=nodes(shape,A,'off')
        if len(ts)==1 and ts[0].firstChild and ts[0].firstChild.data==f'{i:02}' and offs and int(offs[0].getAttribute('x'))>10000000 and int(offs[0].getAttribute('y'))<800000:
            matches.append(ts[0])
    if len(matches)!=1: raise RuntimeError(f'Expected one page number on original slide {i}, got {len(matches)}')
    matches[0].firstChild.data=f'{i+3:02}';f.write_bytes(dump(d))

app=unpacked/'docProps/app.xml'
doc=parseString(app.read_bytes())
for n in doc.getElementsByTagName('Slides'):
    if n.firstChild:n.firstChild.data='15'
app.write_bytes(dump(doc))
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED) as z:
    for f in sorted(unpacked.rglob('*')):
        if f.is_file():z.write(f,f.relative_to(unpacked).as_posix())
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==before
print(json.dumps({'source_sha256':before,'candidate':str(OUT),'slides':15},ensure_ascii=False))
