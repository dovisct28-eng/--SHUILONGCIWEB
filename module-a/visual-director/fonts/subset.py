from pathlib import Path
import sys,re,json,hashlib
from fontTools.ttLib import TTFont
from fontTools import subset
root=Path(__file__).resolve().parent
repo=root.parents[1]
files=[repo/'a01/index.html',repo/'a01/app.mjs']
files+=list((repo/'a03').glob('*.mjs'))+list((repo/'a04').glob('*.mjs'))
for chapter in ['a05','a06','a07','a08','guide']:
    files+=list((repo/chapter).glob('*.mjs'))
content=''.join(f.read_text(encoding='utf-8') for f in files if not f.name.endswith('.test.mjs'))
chars=''.join(sorted(set(re.findall(r'[\u3000-\u9fff]',content)+list('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz，。·：；！？（）《》—→⑤①② /%.-…“”'))))
titles='出庙 · 入庙出兵入将壁画，在建筑的何处从出行与归来，看壁画之间的联系从第五幅出发正在准备空间模型回望完整建筑观看路线第五幅观察站位前行至第一幅返回第二幅《入将图》从主殿出发从第五幅开始三铺之间三铺，一条观看路径第五铺前往第一铺返回第二铺从第五铺开始①②⑤ / →0123456789'
serifchars=''.join(sorted(set(titles+'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz，。·：；！？（）《》— /%.-…“”')))
manifest={'budgetBytes':160*1024,'firstScreenAddedFontBytes':0,'text':chars,'titleText':serifchars,'fonts':[]}
for source,name,weight in zip(sys.argv[1:],['narrative-serif','narrative-sans'],[500,400]):
    text=serifchars if name.endswith('serif') else chars
    font=TTFont(source);cmap=font.getBestCmap()
    missing=[c for c in text if not c.isspace() and ord(c) not in cmap];assert not missing,missing
    version=font['name'].getDebugName(5);options=subset.Options();options.flavor='woff2'
    sub=subset.Subsetter(options=options);sub.populate(text=text);sub.subset(font);font.flavor='woff2'
    dest=root/(name+'.woff2');font.save(dest);check=TTFont(dest)
    assert all(ord(c) in check.getBestCmap() for c in text if not c.isspace())
    manifest['fonts'].append({'file':dest.name,'weight':weight,'version':version,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'sourceSHA256':hashlib.sha256(Path(source).read_bytes()).hexdigest()})
assert sum(f['bytes'] for f in manifest['fonts'])<=manifest['budgetBytes']
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False))
