"""Revise the actual V2 OOXML, preserving its images and editable artwork."""
from pathlib import Path
from copy import deepcopy
import hashlib, json, sys, zipfile
sys.path.insert(0, str(Path(__file__).resolve().parents[2]/'local/defusedxml-dependency'))
from defusedxml import minidom

BASE=Path(__file__).resolve().parents[1]
V2=BASE.parent/'revision-v2'
SOURCE=next((V2/'output').glob('*.pptx'))
for folder in ['local','output','preview/slides','content','qa']:
    (BASE/folder).mkdir(parents=True,exist_ok=True)

# Each change is keyed to the text in the actual, delivered V2, not an old generator.
COPY={
1:{
 '让壁画，\n从静态观看走向主动探索。':'一个可在电脑浏览器体验的\n壁画导读与人物探索作品。',
},
2:{
 '设计背景':'设计问题',
 '从文化遗产\n到数字体验':'壁画在哪里？\n画中有什么？',
 '让观众先理解壁画所处空间，\n再自主进入图像与人物细节。':'只看一张壁画，难以同时说明\n它在建筑中的位置与画中人物。',
 '空间认知':'空间：在哪面墙？',
 '图像理解':'图像：从哪看起？',
 '主动参与':'人物：如何细看？',
},
3:{
 '设计理念':'设计方案',
 '从静态观看，到主动探索':'先看懂空间，再自主探索人物',
 '01':'引导', '02':'探索', '03':'参与方式',
 '空间叙事':'建筑与壁画导读',
 '在建筑中理解壁画位置。':'滚动页面，认识位置与观看路线。',
 '数字图鉴':'鼠标浏览图鉴',
 '从完整图像，进入人物。':'放大壁画，点击热点查看人物。',
 '体感参与':'单手控制人物界面',
},
4:{
 '交互体验架构':'完整体验流程',
 '先建立观看语境':'第一步：跟随导读',
 '再交还探索权':'第二步：自主探索',
 '模块 A · 叙事引导':'模块 A · 滚动推进',
 '模块 B · 交互探索':'模块 B · 选择体验方式',
 '进入水龙祠 / 建筑空间认知 / 壁画位置':'看建筑布局，找到三幅壁画所在墙面',
 '主题与空间路线':'主题与观看路线',
 '出兵 · 入将 / 第五幅 → 第一幅 → 第二幅':'围绕出兵·入将，依次走近三幅壁画',
 '第五幅、第一幅、第二幅均完成独立导读':'第五幅 → 第一幅 → 第二幅，各自完成导读',
 '点击进入':'主动点击\n进入探索',
 '图鉴探索':'鼠标图鉴',
 '体感交互':'单手体感',
},
5:{
 '建筑空间叙事':'空间导读 · 解决“在哪里”',
 '让壁画回到\n建筑空间之中':'滚动页面，\n找到壁画的位置',
 '在院落、墙面与镜头之间，\n建立连续的空间关系。':'镜头从建筑整体走向壁面，\n让三幅壁画有空间参照。',
 '三维建筑':'先看整体',
 '建立院落与建筑关系':'辨认院落与建筑布局',
 '位置标注 / 滚动视角':'再看壁面位置',
},
6:{
 '壁画叙事设计':'图像导读 · 解决“从哪看起”',
 '沿着壁画，阅读出行与归来':'沿第五幅 → 第一幅 → 第二幅逐幅导读',
 '数字路线的起点，完成整体介绍与独立导读':'先看全幅，再从画面右端向左巡视',
 '沿空间路线转向与行进，保留独立完整观看':'镜头前行、转向；继续完成这一幅的导读',
 '导读结束后，由用户主动进入人物探索':'完成《入将图》导读，再点击进入人物探索',
 '三幅均由右端巡视至左端。图示为真实局部；':'以上为项目设计的数字观看路线；三幅均由右向左巡视。配图为真实壁画局部。',
},
7:{
 '数字图鉴探索':'鼠标图鉴 · 解决“如何细看”',
 '从全景，走进人物':'放大看全图，点击看人物',
 '人物档案':'选择后：查看人物档案',
 '缩放 / 拖动平移':'① 缩放、拖动\n找到图像细节',
 '热点选择\n人物索引\n详情阅读':'② 点击热点\n或人物索引\n③ 阅读人物简介',
},
8:{
 '多层图像对照':'图像对照 · 解决“看什么”',
 '看清同一人物的三个层次':'切换同一人物的原图、线稿与色稿',
 '保留现存图像信息':'看现存壁画的真实图像',
 '强调形态与线条结构':'辨认人物轮廓与线条',
 '数字表达':'看项目制作的数字表达',
},
9:{
 '体感交互设计':'单手体感 · 另一种参与方式',
 '停留，\n让选择被确认':'移动单手光标，\n停留约1秒确认',
 '单手光标':'① 移动手掌',
 '识别操作人与控制手，\n映射并平滑显示光标。':'摄像头获取手部位置，\n映射为界面光标。',
 '驻留确认':'② 停在目标上',
 '目标激活 → 进度反馈\n确认后移开释放':'等待进度环完成，\n确认后移开，再次选择。',
 '选择人物':'切换人物',
 '驻留“下一人物”目标。':'停留“下一人物”即可切换。',
 '查看简介':'展开 / 收起简介',
 '驻留查看 / 收起目标。':'停留对应目标，控制简介显示。',
},
10:{
 '交互技术与系统实现':'技术如何支撑体验',
 '输入如何成为反馈':'滚动控制镜头，手部输入触发操作',
 'A  空间叙事':'空间导读',
 'HTML / CSS / JavaScript\nThree.js + 滚动进度\n摄像机与视觉状态控制':'滚动进度驱动三维镜头，\n连接建筑、壁面与图像。\nHTML / JavaScript / Three.js',
 'B  图鉴数据':'人物图鉴',
 '大图坐标 / 缩放平移\n热点与人物数据关联\n原图 / 线稿 / 数字色稿':'热点关联人物资料，\n支持大图浏览与图像切换。\n大图坐标 / 人物元数据',
 'C  体感输入':'单手体感',
 '有效输入才累计驻留。\n失效、过期或归属不明\n即中止当前进度。':'先确认操作人与控制手，\n再累计有效驻留时间。\n输入失效即停止当前进度。',
 'NEXT / OPEN\nCLOSE':'切换人物\n展开 / 收起',
},
11:{
 '交互分镜与制作流程':'成果呈现 · 宣传视频',
 '把交互组织成\n一段完整体验':'用173秒视频\n展示完整体验',
 '真实网页采集\nChatCut 剪辑与混音\nRemotion 动态文字':'建筑与图鉴：网页画面\n体感片段：预设流程演示\nChatCut 剪辑与混音\nRemotion 动态文字',
 '体感流程展示':'体感流程演示',
},
12:{
 '创新价值 · 生态设计与可持续创新':'设计贡献 · 文化资源持续利用',
 '让传统壁画\n持续被看见':'把空间、图像与人物\n连成可探索的体验',
 '叙事':'连贯',
 '连接建筑空间与壁画观看':'从建筑位置到逐幅导读，\n建立完整观看线索',
 '交互':'自主',
 '以图鉴与体感提供不同观看方式':'用鼠标或单手光标，\n选择人物、阅读资料',
 '复用':'复用',
 '持续组织图像与人物，用于展示传播':'图像与人物资料共享，\n支持后续内容扩展',
}}

def elems(node, tag): return list(node.getElementsByTagName(tag))
def shape_text(shape):
    return '\n'.join(''.join(t.firstChild.data if t.firstChild else '' for t in elems(p,'a:t')) for p in elems(shape,'a:p')).strip()
def change_geometry(shape, x=None,y=None,w=None,h=None,size=None):
    xf=elems(shape,'a:xfrm')[0]
    for tag,attrs in [('a:off',{'x':x,'y':y}),('a:ext',{'cx':w,'cy':h})]:
        el=elems(xf,tag)[0]
        for k,v in attrs.items():
            if v is not None:el.setAttribute(k,str(round(v*914400)))
    if size:
        for rp in elems(shape,'a:rPr')+elems(shape,'a:endParaRPr'):rp.setAttribute('sz',str(round(size*100)))
def change_text(doc,shape,value):
    body=elems(shape,'p:txBody')[0]
    oldp=elems(body,'a:p')[0]
    ppr=elems(oldp,'a:pPr')
    rp=elems(oldp,'a:rPr')[0].cloneNode(True)
    for p in list(elems(body,'a:p')):body.removeChild(p)
    for line in value.split('\n'):
        p=doc.createElement('a:p')
        if ppr:p.appendChild(ppr[0].cloneNode(True))
        r=doc.createElement('a:r');r.appendChild(rp.cloneNode(True))
        t=doc.createElement('a:t');t.appendChild(doc.createTextNode(line));r.appendChild(t);p.appendChild(r)
        body.appendChild(p)
def add_text(doc,tree,prototype,value,x,y,w,h,size=15,color=None):
    shape=prototype.cloneNode(True)
    ids=[int(e.getAttribute('id')) for e in elems(tree,'p:cNvPr')]
    props=elems(shape,'p:cNvPr')[0];props.setAttribute('id',str(max(ids)+1));props.setAttribute('name','Read-alone annotation')
    change_text(doc,shape,value);change_geometry(shape,x,y,w,h,size)
    if color:
        for c in elems(shape,'a:srgbClr'):c.setAttribute('val',color)
    tree.appendChild(shape)
    return shape

change_log=[];geometry=[]
with zipfile.ZipFile(SOURCE) as z:
    parts={n:z.read(n) for n in z.namelist()}
    for page in range(1,13):
        name=f'ppt/slides/slide{page}.xml';doc=minidom.parseString(parts[name]);tree=elems(doc,'p:spTree')[0]
        shapes=elems(tree,'p:sp');bytext={shape_text(s):s for s in shapes if shape_text(s)}
        for old,new in COPY[page].items():
            assert old in bytext,(page,old)
            change_text(doc,bytext[old],new);change_log.append({'page':page,'before':old,'after':new})
        proto=bytext[next(iter(bytext))]
        def geom(old,**kw): change_geometry(bytext[old],**kw)
        def extra(value,x,y,w,h,size=15):return add_text(doc,tree,proto,value,x,y,w,h,size,'AFB4B1')
        if page==1:
            # Remove the duplicate page number carried by the V2 cover.
            nums=[s for s in shapes if shape_text(s)=='01']
            tree.removeChild(nums[-1])
            geom('让壁画，\n从静态观看走向主动探索。',size=23,h=.95)
            extra('让壁画，从静态观看走向主动探索。',.72,5.02,6.15,.36,16)
        if page==2:
            geom('让观众先理解壁画所处空间，\n再自主进入图像与人物细节。',size=21,h=.9)
            for old,x in [('空间认知',5.8),('图像理解',8.1),('主动参与',10.4)]:geom(old,x=x,w=2.25,size=14)
        if page==3:
            geom('从静态观看，到主动探索',size=36)
            geom('01',x=.65,y=4.75,w=3.6)
            geom('空间叙事',x=.65,y=5.17,w=4.25,size=25)
            geom('在建筑中理解壁画位置。',x=.65,y=5.88,w=4.25,size=16)
            geom('02',x=5.13,y=4.75,w=3.6)
            geom('数字图鉴',x=5.13,y=5.17,size=25)
            geom('从完整图像，进入人物。',x=5.13,y=5.88,w=3.8,size=16)
            geom('03',x=9.1,y=4.75,w=3.6,h=.3,size=13)
            geom('体感参与',x=9.1,y=5.17,w=3.6,h=.5,size=24)
            # Shrink the decorative isolated figure to make room for an explanation.
            pic=[p for p in elems(tree,'p:pic') if elems(p,'p:cNvPr')[0].getAttribute('descr')=='figure']
            if not pic:pic=elems(tree,'p:pic')[-1:]
            # Keep original image proportions when arranging the three scales.
            for p,(x,y,w,h) in zip(elems(tree,'p:pic'),[(.65,2.2,3.8,2.25),(5.13,2.2,3.8,2.25),(9.1,2.2,3.6,2.25)]):
                ext=elems(elems(p,'a:xfrm')[0],'a:ext')[0];pw=int(ext.getAttribute('cx'));ph=int(ext.getAttribute('cy'));factor=min(w/pw,h/ph)
                change_geometry(p,x=x+(w-pw*factor)/2,y=y+(h-ph*factor)/2,w=pw*factor,h=ph*factor)
            # The modes are alternatives, so remove the old sequential arrows.
            for s in list(elems(tree,'p:sp')):
                if not shape_text(s):tree.removeChild(s)
            extra('移动光标、停留确认，\n切换人物与查看简介。',9.1,5.88,3.6,.75,16)
            extra('导读结束后，鼠标图鉴与单手体感可按需选择。',5.13,6.68,7.5,.36,15)
        if page==4:
            geom('先建立观看语境',size=32)
            geom('再交还探索权',size=31)
            geom('点击进入',x=7.17,y=4.25,w=1.06,h=.7,size=12)
            extra('缩放、选热点、读资料',8.3,5.78,4.39,.3,14)
            geom('体感交互',y=6.25,size=19)
        if page==5:
            geom('让壁画回到\n建筑空间之中',size=36)
            geom('在院落、墙面与镜头之间，\n建立连续的空间关系。',size=19)
            extra('模型用于数字空间展示。',.7,6.7,3.65,.32,13)
        if page==6:
            geom('沿着壁画，阅读出行与归来',size=33,w=12.03)
            geom('三幅均由右端巡视至左端。图示为真实局部；',size=12.5,h=.35)
        if page==7:
            geom('从全景，走进人物',size=37,w=12)
            geom('人物档案',x=8.57,y=6.4,w=4.11,size=21)
            geom('缩放 / 拖动平移',x=8.57,y=2.18,w=4.11,h=.64,size=16)
            geom('热点选择\n人物索引\n详情阅读',x=8.57,y=2.95,w=4.11,h=.8,size=15)
        if page==8:
            geom('看清同一人物的三个层次',size=34)
            for old in ['原图','线稿','数字色稿']:geom(old,y=6.12)
            for old in ['保留现存图像信息','强调形态与线条结构','数字表达']:geom(old,y=6.67,size=14.5)
            extra('线稿与数字色稿用于辅助观看；数字色稿不等同于历史原色复原。',.65,7.12,12,.24,11.5)
        if page==9:
            geom('停留，\n让选择被确认',size=34,w=5.85)
            geom('单手光标',size=24)
            geom('驻留确认',size=23)
            geom('目标激活 → 进度反馈\n确认后移开释放',w=3.4,size=15.5)
            geom('驻留“下一人物”目标。',w=3.58,size=15)
            geom('驻留查看 / 收起目标。',w=3.58,size=15)
            extra('图中为预设流程演示；现场摄像头识别效果待实测。',.65,7.04,12,.3,12)
        if page==10:
            geom('输入如何成为反馈',size=34,w=12)
            for old in ['HTML / CSS / JavaScript\nThree.js + 滚动进度\n摄像机与视觉状态控制','大图坐标 / 缩放平移\n热点与人物数据关联\n原图 / 线稿 / 数字色稿','有效输入才累计驻留。\n失效、过期或归属不明\n即中止当前进度。']:geom(old,size=16.5,h=1.3)
            extra('下图为体感输入链：识别 → 归属 → 光标 → 驻留 → 界面操作。',.65,4.16,12,.32,13)
            extra('本地网页原型；体感部分组件与模型资源依赖网络。',.65,7.04,12,.3,12)
        if page==11:
            geom('把交互组织成\n一段完整体验',size=30,w=3.55)
            geom('真实网页采集\nChatCut 剪辑与混音\nRemotion 动态文字',y=4.7,h=1.6,size=15)
            extra('视频用于展示功能与流程；\n不替代现场摄像头测试。',.7,6.48,3.4,.67,14)
        if page==12:
            geom('让传统壁画\n持续被看见',w=7.05,size=35)
            for old in ['连接建筑空间与壁画观看','以图鉴与体感提供不同观看方式','持续组织图像与人物，用于展示传播']:geom(old,w=3.62,h=.74,size=16)
            extra('现有成果：本地网页交互原型 + 配套宣传视频。',.65,3.32,11.7,.4,19)
        for s in elems(tree,'p:sp'):
            if not shape_text(s):continue
            xf=elems(s,'a:xfrm')[0];off=elems(xf,'a:off')[0];ext=elems(xf,'a:ext')[0]
            geometry.append({'slide':page,'text':shape_text(s),'x':int(off.getAttribute('x'))/914400,'y':int(off.getAttribute('y'))/914400,'w':int(ext.getAttribute('cx'))/914400,'h':int(ext.getAttribute('cy'))/914400})
        parts[name]=doc.toxml(encoding='UTF-8')
    # No identity or paths are added to the anonymous file. Notes retain source boundaries.
    out=BASE/'local/candidate.pptx'
    with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
        for n,data in parts.items():z.writestr(n,data)
    media=[n for n in parts if n.startswith('ppt/media/')]
    with zipfile.ZipFile(SOURCE) as old:
        assert all(parts[n]==old.read(n) for n in media)

(BASE/'content/change-log.json').write_text(json.dumps(change_log,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(BASE/'local/geometry.json').write_text(json.dumps(geometry,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(BASE/'content/baseline.json').write_text(json.dumps({'source':str(SOURCE.relative_to(BASE.parents[2])).replace('\\','/'),'sha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'unchangedMediaParts':len(media),'slides':12},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(out)
