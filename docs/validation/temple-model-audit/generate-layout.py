"""Editable SVG: historic plan traced approximately; current plan from source coordinates.
No source asset is modified. Historic un-dimensioned geometry is a schematic trace,
not a CAD measurement or a coordinate proposal for the next model version.
"""
from pathlib import Path
from html import escape

OUT = Path(__file__).resolve().parent
s = []
def add(t): s.append(t)
def text(x,y,t,size=20,fill='#374341',anchor='start',weight=400):
    add(f'<text x="{x:.2f}" y="{y:.2f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}">{escape(t)}</text>')
def rect(x,y,w,h,fill='none',stroke='#697774',sw=2,dash=''):
    add(f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
def line(x1,y1,x2,y2,stroke='#697774',sw=2,dash=''):
    add(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{stroke}" stroke-width="{sw}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>')
def col(x,y,dashed=False):
    add(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="4.8" fill="#fcfbf7" stroke="#697774" stroke-width="2"'+(' stroke-dasharray="3 2"' if dashed else '')+'/>')
def badge(x,y,n):
    add(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="13" fill="#eef3f1" stroke="#5b7874" stroke-width="1.4"/>')
    text(x,y+6,n,18,'#3d625e','middle',600)
def mural(x1,y1,x2,y2): line(x1,y1,x2,y2,'#507b76',7)
def dim(x,y,w,label):
    line(x,y,x+w,y,'#9aa19a',1);line(x,y-5,x,y+5,'#9aa19a',1);line(x+w,y-5,x+w,y+5,'#9aa19a',1);text(x+w/2,y-10,label,17,'#69746e','middle')

add('<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1320" viewBox="0 0 1800 1320" role="img" aria-labelledby="title desc">')
add('<title id="title">水龙祠空间布局对照 · 阶段一</title>')
add('<desc id="desc">左为2016文献图6的示意提炼，右为现有模型坐标。各自等比绘制并归一化主体纵长，不是共同米制比例。入口在下，主殿在上，右侧指从入口面向主殿。线条、标签、柱点和尺寸均为独立矢量对象。</desc>')
add('<g font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif">')
rect(0,0,1800,1320,'#f7f6f0','none')
text(64,70,'水龙祠：保留主体，局部校正',38,weight=600)
text(64,111,'历史测绘与现有模型的空间布局对照  /  阶段一审查 · 2026-10-28',21,'#6a7770')
line(64,143,1736,143,'#bbc2b9',1)
text(90,194,'2016 测绘图提炼',28,weight=600)
text(90,229,'来源：发现报告 PDF 第7页，图6；修复前状态',19,'#6a7770')
text(950,194,'现有程序化模型',28,weight=600)
text(950,229,'来源：model-source.js / GLB；基线 701b556',19,'#6a7770')
line(880,175,880,1140,'#d6d9cf',1)

# Historic plan: axis from back wall toward entry, approximate trace, source units metres.
add('<g id="historic-plan" aria-label="2016 plan schematic">')
k=800/48.18; cx=450; left=cx-17.75*k/2; right=cx+17.75*k/2; top=285
X=lambda x:left+x*k
Y=lambda d:top+d*k
rect(left,top,17.75*k,800,'#fcfbf7','none')
rect(left,top,17.75*k,11.56*k,'#e1e5dc','none')
rect(left,Y(11.56),3.2*k,(48.18-11.56)*k,'#ece6d9','none')
rect(X(14.35),Y(11.56),3.4*k,(48.18-11.56)*k,'#ece6d9','none')
# Historic damaged gallery outer side is intentionally dashed; never a reconstruction target.
line(left,top,right,top);line(right,top,right,Y(48.18));line(left,top,left,Y(11.56));line(left,Y(11.56),left,Y(30.2),dash='8 6');line(left,Y(30.2),left,Y(48.18))
line(X(3.2),Y(11.56),X(3.2),Y(30.2),dash='8 6');line(X(3.2),Y(30.2),X(3.2),Y(44.5))
line(X(14.35),Y(11.56),X(14.35),Y(44.5))
line(left,Y(11.56),right,Y(11.56))
# Three entry openings, with a larger middle opening; positions visually traced.
for a,b in [(0,2.46),(3.6,7.94),(9.6,13.69),(14.90,17.75)]:line(X(a),Y(48.18),X(b),Y(48.18))
for a,b in [(2.46,3.6),(7.94,9.6),(13.69,14.90)]:line(X(a),Y(48.18)+5,X(b),Y(48.18)+5,'#b1aaa0',2)
add('<g id="historic-columns">')
for x in [5.48,12.26]:
    for d in [2.01,4.42,9.17,11.56]:col(X(x),Y(d))
for d in [16.24,19.98,24.1,29.26,34.23,39.09,43.26,45.18]:
    col(X(3.2),Y(d),d<33);col(X(14.35),Y(d))
add('</g>')
# Main stage and its rear room, approximately traced; not surveyed stage dimensions.
stage=[(4.25,44.5),(13.5,44.5),(13.5,39.05),(12.1,39.05),(12.1,35.4),(5.65,35.4),(5.65,39.05),(4.25,39.05)]
add('<path id="historic-stage-with-rear-room" d="'+' '.join(('M' if i==0 else 'L')+f'{X(x):.2f},{Y(d):.2f}' for i,(x,d) in enumerate(stage))+' Z" fill="#d9c5ad" stroke="#827261" stroke-width="2"/>')
line(X(4.25),Y(40.6),X(13.5),Y(40.6),'#827261',1.5)
text(cx,Y(38.25),'戏台',20,anchor='middle');text(cx,Y(43.05),'后部空间',15,'#7b6d5d','middle')
text(cx,Y(7.1),'主殿',24,anchor='middle');text(cx,Y(25),'庭院',24,anchor='middle')
text(X(1.6),Y(29),'左廊',17,anchor='middle');text(X(16.05),Y(29),'右廊',17,anchor='middle')
text(cx,Y(48.18)+36,'入口 → 面向主殿',19,anchor='middle')
add('<g id="historic-murals">')
mural(left+5,Y(.315),left+5,Y(11.56));badge(left-22,Y(6),'⑤')
mural(right-5,Y(.315),right-5,Y(11.56));badge(right+22,Y(6),'②')
mural(X(6.5),top+5,X(11.25),top+5);badge(X(8.875),top-24,'④')
mural(X(13.25),top+5,X(15.95),top+5);badge(X(14.60),top-24,'③')
mural(right-5,Y(48.18-7.32-5.23),right-5,Y(48.18-7.32));badge(right+22,Y(38.245),'①')
add('</g>')
dim(left,Y(48.18)+73,17.75*k,'图6 横向总标注 17.750 m')
text(90,545,'历史残损',19,'#8c6c4e',weight=600)
text(90,577,'左廊中段以虚线表示',17)
text(90,605,'图6标为“已毁过廊”',17)
text(90,633,'修复后照片可见两廊',17)
text(90,661,'不建议照搬残损状态',17)
line(267,571,left,Y(20),'#9aab9c',1)
text(90,751,'戏台轮廓含后部空间',17,'#7e6a55')
text(90,779,'未标尺寸部分为示意提炼',16,'#7e6a55')
line(272,783,X(4.3),Y(40),'#b29a7c',1)
add('</g>')

# Current model: exact declared design coordinates; base margin shown separately.
add('<g id="current-plan" aria-label="Current model design coordinates">')
k=800/27.5; cx=1290; top=285
X=lambda x:cx+x*k
Y=lambda z:top+(z+15.5)*k
rect(X(-5.9),Y(-16.5),11.8*k,29.5*k,'none','#b7b6a8',1.5,'6 5')
rect(X(-5),Y(-15.5),10*k,27.5*k,'#fcfbf7')
rect(X(-4.875),Y(-15.35),9.75*k,7.2*k,'#e1e5dc','none')
for sign in [-1,1]:
    rect(X(sign*4.05-.875),Y(-8.85),1.75*k,19.4*k,'#ece6d9','#a99b85',1)
    for z in [-7.2,-2.4,2.4,7.2,9.5]:col(X(sign*3.25),Y(z))
line(X(-4.65),Y(-15.05),X(-4.65),Y(-8.45));line(X(4.65),Y(-15.05),X(4.65),Y(-8.45));line(X(-4.7),Y(-15),X(4.7),Y(-15))
for x in [-3.6,0,3.6]:col(X(x),Y(-8.35))
rect(X(-1.55),Y(7.075),3.1*k,2.65*k,'#d9c5ad','#827261',2)
for x in [-1.28,1.28]:
    for z in [7.4,9.35]:col(X(x),Y(z))
text(cx,Y(8.7),'戏台',17,anchor='middle')
text(cx,Y(-11.7),'主殿',24,anchor='middle');text(cx,Y(.3),'庭院',24,anchor='middle')
text(X(-4.05),Y(1),'左廊',17,anchor='middle');text(X(4.05),Y(1),'右廊',17,anchor='middle')
for a,b in [(-5.12,-3.87),(-2.63,-.76),(.76,2.63),(3.87,5.12)]:line(X(a),Y(11.93),X(b),Y(11.93),'#697774',5)
text(cx,Y(12)+36,'入口 → 面向主殿',19,anchor='middle')
add('<g id="current-murals">')
mural(X(-4.515),Y(-14.8),X(-4.515),Y(-8.7));badge(X(-4.515)-23,Y(-11.75),'⑤')
mural(X(4.515),Y(-14.8),X(4.515),Y(-8.7));badge(X(4.515)+23,Y(-11.75),'②')
mural(X(-3.925),Y(-14.865),X(-.575),Y(-14.865));badge(X(-2.25),Y(-14.865)-29,'④')
mural(X(.575),Y(-14.865),X(3.925),Y(-14.865));badge(X(2.25),Y(-14.865)-29,'③')
mural(X(4.865),Y(2.975),X(4.865),Y(6.625));badge(X(4.865)+24,Y(4.8),'①')
add('</g>')
dim(X(-5),1158,10*k,'围墙轴线间宽 10 设计单位')
text(1510,320,'后墙两铺等宽',18,'#8c6c4e',weight=600)
text(1510,350,'图6中③④明显不等长',16)
line(1500,328,X(3.9),Y(-14.865),'#b29a7c',1)
text(960,453,'主殿仅前沿三柱',18,'#8c6c4e',weight=600)
text(960,481,'测绘图为两列四排',16)
line(1135,463,X(-3.6),Y(-8.35),'#b29a7c',1)
text(1510,760,'①墙位方向一致',18,'#507b76',weight=600)
text(1510,790,'墙画尺寸不作米制换算',16)
line(1500,768,X(4.865),Y(4.8),'#90a39c',1)
text(960,935,'戏台约占轴线宽31%',18,'#8c6c4e',weight=600)
text(960,963,'测绘整体轮廓约占一半',16)
text(960,991,'两者含构件范围不同',16)
line(1147,940,X(-1.55),Y(8.4),'#b29a7c',1)
text(1510,1053,'外框虚线是模型基座',16,'#7d8377')
text(1510,1081,'11.8 × 29.5 设计单位',16,'#7d8377')
line(1500,1060,X(5.9),Y(12.5),'#b7b6a8',1)
add('</g>')
line(64,1198,1736,1198,'#bbc2b9',1)
rect(64,1221,21,16,'#e1e5dc','none');text(96,1236,'主殿',18)
rect(185,1221,21,16,'#ece6d9','none');text(217,1236,'过廊',18)
rect(308,1221,21,16,'#d9c5ad','none');text(340,1236,'戏台',18)
line(432,1229,458,1229,'#507b76',6);text(470,1236,'五铺壁画墙面',18)
text(750,1236,'两图各自等比，主体纵长归一；不是同一米制比例尺。',19,'#566b62',weight=600)
text(64,1276,'左右均指从入口面向主殿；编号为项目沿用编号，不表示历史观看顺序。修复后构件细节不由修复前测绘单独判定。',18,'#6a7770')
add('</g></svg>')
(OUT/'model-layout-comparison.svg').write_text('\n'.join(s)+'\n',encoding='utf-8')
print('Wrote editable vector comparison; historical geometry is a labeled schematic trace.')
