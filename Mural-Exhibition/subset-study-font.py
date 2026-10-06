"""Build the B03 title font from the licensed Noto Serif CJK SC Medium OTF.
Usage: python subset-study-font.py <source.otf>. Original font stays outside public.
"""
from pathlib import Path
import sys,re,json,hashlib
from fontTools.ttLib import TTFont
from fontTools import subset
root=Path(__file__).resolve().parent
content=(root/'public/index.html').read_text(encoding='utf-8')
for folder in (root/'public/assets').iterdir():
    if not folder.is_dir(): continue
    for name in ('meta.json','info.txt','info.md'):
        file=folder/name
        if file.is_file(): content+=file.read_text(encoding='utf-8')
chars=''.join(sorted(set(re.findall(r'[\u3000-\u9fff]',content)+list('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz，。·：；！？（）《》—→← /%.-…“”'))))
source=Path(sys.argv[1]);font=TTFont(source);cmap=font.getBestCmap()
assert all(ord(c) in cmap for c in chars if not c.isspace())
version=font['name'].getDebugName(5)
options=subset.Options();options.flavor='woff2';sub=subset.Subsetter(options=options);sub.populate(text=chars);sub.subset(font);font.flavor='woff2'
dest=root/'public/b03/narrative-serif.woff2';font.save(dest)
assert all(ord(c) in TTFont(dest).getBestCmap() for c in chars if not c.isspace())
manifest={'family':'Noto Serif CJK SC Medium','version':version,'source':'https://github.com/notofonts/noto-cjk','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'file':dest.name,'bytes':dest.stat().st_size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'text':chars}
(dest.parent/'font-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('B03 title font:',dest.stat().st_size,'bytes;',len(chars),'characters')
