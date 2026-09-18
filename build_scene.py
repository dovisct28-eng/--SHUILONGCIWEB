# -*- coding: utf-8 -*-
"""
水龙祠 2.5D 扁平矢量插画生成器（斜俯视等距风格）
格局（北=上）：
  正殿（北）→ 庭院 → 戏台（面向正殿）→ 带瓦走廊（连接左右壁）→ 大门（南，三拱门洞）
左右两侧为纵向廊屋（左壁/右壁）。
输出：水龙祠2.5D插画.svg
"""
import math

W, H = 2048, 2048
parts = []
def add(s): parts.append(s)

# ---------- 调色板（低饱和暖色） ----------
SKY_TOP    = "#C4D9E6"   # 浅蓝
SKY_BOT    = "#F5F2E8"   # 米白
MOUNTAINS  = ["#A8BFAF", "#8FAE9B", "#75917E", "#5F7D6B"]  # 远山 由近及远(后画覆盖)
FIELD_A    = "#A9C49B"   # 农田浅
FIELD_B    = "#97B687"   # 农田中
FIELD_C    = "#84A775"   # 农田深
FIELD_LINE = "#7C9C6E"   # 田埂线
PLAZA      = "#DCD7CA"   # 庭院青砖
PLAZA_LINE = "#C9C2B2"
GROUND     = "#EFEDE3"   # 外场地
WALL       = "#B0715D"   # 红砖墙
WALL_DARK  = "#9C5F4D"
WALL_LINE  = "#8E5443"
ROOF       = "#7E7871"   # 深灰瓦(前坡)
ROOF_DARK  = "#6E6861"   # 深灰瓦(后坡/背光)
RIDGE      = "#554F49"   # 屋脊
EAVE       = "#8B857D"   # 檐口亮
WOOD       = "#6E4A3A"   # 木柱/木构
WOOD_DARK  = "#57392C"
GATE_DARK  = "#43362E"   # 门洞
GATE_IN    = "#2E251F"
PLINTH     = "#C9C3B4"   # 台基
PLINTH_D   = "#B7B0A0"
TREE_A     = "#7FA472"
TREE_B     = "#6E9663"
TREE_C     = "#5C8555"
SHADOW     = "rgba(90,105,80,0.18)"

# ---------- 工具 ----------
def esc(s): return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def poly(pts, fill, stroke=None, sw=0, op=1.0):
    d = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    s = f'<polygon points="{d}" fill="{fill}"'
    if stroke: s += f' stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"'
    if op < 1.0: s += f' opacity="{op}"'
    s += '/>'
    add(s)

def rect(x, y, w, h, fill, rx=0, stroke=None, sw=0, op=1.0):
    s = f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}"'
    if rx: s += f' rx="{rx}"'
    if stroke: s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op < 1.0: s += f' opacity="{op}"'
    s += '/>'
    add(s)

def line(x1, y1, x2, y2, stroke, sw=1, dash=None):
    s = f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{stroke}" stroke-width="{sw}"'
    if dash: s += f' stroke-dasharray="{dash}"'
    s += '/>'
    add(s)

def path(d, fill="none", stroke=None, sw=1, dash=None):
    s = f'<path d="{d}" fill="{fill}"'
    if stroke: s += f' stroke="{stroke}" stroke-width="{sw}"'
    if dash: s += f' stroke-dasharray="{dash}"'
    s += '/>'
    add(s)

def circle(cx, cy, r, fill, stroke=None, sw=0, op=1.0):
    s = f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{fill}"'
    if stroke: s += f' stroke="{stroke}" stroke-width="{sw}"'
    if op < 1.0: s += f' opacity="{op}"'
    s += '/>'
    add(s)

def ellipse(cx, cy, rx, ry, fill, op=1.0):
    s = f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{fill}"'
    if op < 1.0: s += f' opacity="{op}"'
    s += '/>'
    add(s)

def grad_defs():
    g = ['<defs>',
         f'<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SKY_TOP}"/><stop offset="1" stop-color="{SKY_BOT}"/></linearGradient>',
         f'<linearGradient id="fieldG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{FIELD_A}"/><stop offset="1" stop-color="{FIELD_C}"/></linearGradient>']
    for i, c in enumerate(MOUNTAINS):
        g.append(f'<linearGradient id="m{i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{c}"/><stop offset="1" stop-color="{c}"/></linearGradient>')
    g.append('</defs>')
    add("\n".join(g))

# ---------- 背景 ----------
def draw_bg():
    rect(0, 0, W, H, "url(#sky)")
    # 远山：从 y=0 到 y≈560，多层
    def ridge(cx, base_y, amp, spread, color):
        pts = [(cx - spread, base_y)]
        steps = 24
        for i in range(1, steps + 1):
            t = i / steps
            x = cx - spread + 2 * spread * t
            y = base_y - amp * math.sin(math.pi * t) - (amp * 0.25) * math.sin(math.pi * t * 3)
            pts.append((x, y))
        pts.append((cx + spread, base_y + 40))
        pts.append((cx - spread, base_y + 40))
        poly(pts, color)
    # 底层（最远、最浅）
    ridge(700, 420, 120, 1150, MOUNTAINS[0])
    ridge(1900, 380, 100, 1300, MOUNTAINS[1])
    # 中层
    ridge(1050, 470, 110, 1250, MOUNTAINS[2])
    # 近层（略深，画面右后）
    ridge(1750, 520, 90, 900, MOUNTAINS[3])

# ---------- 地面与农田 ----------
def draw_ground():
    # 建筑外围地面
    rect(0, 380, W, H - 380, GROUND)
    # 左侧留白区（标题区）农田大块
    field_poly = [(0, 480), (640, 480), (600, 1050), (0, 1050)]
    poly(field_poly, FIELD_A)
    # 田埂网格（左侧）
    for i in range(1, 6):
        line(0, 480 + i * 95, 600 - i * 14, 480 + i * 95, FIELD_LINE, 2)
    for i in range(1, 5):
        x = i * 130
        line(x, 480, x - 30, 1050, FIELD_LINE, 2)
    # 右下农田块
    rect(1650, 560, 398, 340, FIELD_B)
    rect(1560, 900, 488, 330, FIELD_C)
    # 建筑外围西侧农田
    rect(0, 1180, 250, 420, FIELD_B)
    # 底部农田带
    rect(0, 1560, W, 488, FIELD_C)
    # 底部田埂
    for i in range(1, 5):
        line(0, 1560 + i * 100, W, 1560 + i * 100, FIELD_LINE, 2)
    # 东南角田块
    rect(1560, 1500, 488, 300, FIELD_A)
    # 门前通道（青石板路）从大门向南延伸
    path("M 950 1400 L 1090 1400 L 1120 2050 L 920 2050 Z", "#D6D0C0")
    for i in range(8):
        y = 1420 + i * 78
        line(955, y, 1085, y + 12, "#C2BBA9", 2)

# ---------- 庭院 ----------
def draw_plaza():
    # 庭院（正殿台基南沿到戏台北沿之间）
    pts = [(700, 810), (1340, 810), (1340, 1060), (700, 1060)]
    poly(pts, PLAZA)
    # 砖缝
    for i in range(1, 8):
        y = 810 + i * 36
        line(700, y, 1340, y, PLAZA_LINE, 1)
    for i in range(1, 10):
        x = 700 + i * 64
        line(x, 810, x, 1060, PLAZA_LINE, 1)
    # 庭院西侧小树影/细节（东侧广场更开阔）

# ---------- 建筑构件 ----------
def platform_front(cx, y_front, W, D, S=20, fill=PLINTH, fill_d=PLINTH_D):
    """台基：顶面矩形（后沿高）+ 正面。y_front=台基前沿地面线。"""
    top_y = y_front - S - D
    rect(cx - W / 2 - 8, top_y, W + 16, D, fill)          # 顶面
    rect(cx - W / 2 - 8, y_front - S, W + 16, S, fill_d)  # 正面

def wall_front(cx, y_top, W, H, fill=WALL, line_c=WALL_LINE, arches=None, door=None):
    """南立面墙体。y_top=墙顶（被屋檐盖住的线），H=墙高。arches: [(cx, w, h)]"""
    rect(cx - W / 2, y_top, W, H, fill)
    # 砖缝（水平线）
    for i in range(1, int(H / 26) + 1):
        y = y_top + i * 26
        if y < y_top + H - 6:
            line(cx - W / 2, y, cx + W / 2, y, line_c, 1, "4,6")
    # 竖缝（交错，简化）
    for i in range(0, int(W / 44) + 1):
        x = cx - W / 2 + i * 44
        line(x, y_top + 8, x, y_top + H - 6, line_c, 1, "4,6")
    # 拱门（半圆拱 + 内凹门洞 + 门框）
    if arches:
        for (acx, aw, ah) in arches:
            ax0 = acx - aw / 2
            leg = ah - aw / 2          # 门腿高
            d = f'M {ax0:.1f} {y_top + H:.1f} L {ax0:.1f} {y_top + H - leg:.1f} ' \
                f'A {aw / 2:.1f} {aw / 2:.1f} 0 0 1 {ax0 + aw:.1f} {y_top + H - leg:.1f} ' \
                f'L {ax0 + aw:.1f} {y_top + H:.1f} Z'
            path(d, GATE_DARK)                                   # 门洞
            path(d, "none", GATE_IN, 3)                          # 门洞内阴影
            # 门框（拱外缘亮边）
            leg2 = ah - aw / 2 + 7
            d2 = f'M {ax0 - 7:.1f} {y_top + H:.1f} L {ax0 - 7:.1f} {y_top + H - leg2:.1f} ' \
                 f'A {aw / 2 + 7:.1f} {aw / 2 + 7:.1f} 0 0 1 {ax0 + aw + 7:.1f} {y_top + H - leg2:.1f} ' \
                 f'L {ax0 + aw + 7:.1f} {y_top + H:.1f} Z'
            path(d2, "none", "#C9A79A", 4)
    if door:
        (dcx, dw, dh) = door
        rect(dcx - dw / 2, y_top + H - dh, dw, dh, GATE_DARK, stroke=GATE_IN, sw=3)

def roof_box(cx, y_top, W, depth, dx=26, jiao=True, ridge_line=True):
    """斜俯视屋顶：后檐线(y_top)与前檐线(y_top+depth)为水平边，左右边斜向偏移dx。
    jiao=True 时四角加翘角。"""
    x0 = cx - W / 2
    x1 = cx + W / 2
    y_front = y_top + depth
    # 坡面分色：北坡(后)深、南坡(前)浅
    # 顶面整体
    poly([(x0, y_top), (x1, y_top), (x1 + dx, y_front), (x0 + dx, y_front)], ROOF)
    # 南坡亮部（前檐一带）
    poly([(x0 + dx, y_front - 22), (x1 + dx, y_front - 22), (x1 + dx, y_front), (x0 + dx, y_front)], EAVE)
    # 北坡暗部（后檐一带）
    poly([(x0, y_top), (x1, y_top), (x1 + dx * 0.45, y_top + 26), (x0 + dx * 0.45, y_top + 26)], ROOF_DARK)
    # 屋脊（东西向水平，位于中部）
    if ridge_line:
        y_r = y_top + depth * 0.52
        line(x0 + 14, y_r, x1 + dx - 14, y_r - 2, RIDGE, 5)
        # 屋脊两端翘起
        line(x0 + 8, y_r, x0 - 6, y_r - 8, RIDGE, 5)
        line(x1 + dx - 8, y_r - 2, x1 + dx + 6, y_r - 10, RIDGE, 5)
    # 瓦楞（横向斜线，模拟瓦垄）
    for i in range(1, 6):
        t = i / 6
        yy = y_top + depth * t
        off = dx * t
        line(x0 + 10, yy + 2, x1 - 10, yy + 2 - dx * 0.06, "#6B655E", 1, "3,7")
    # 四角翘角
    if jiao:
        L = 26
        # 左上
        poly([(x0, y_top), (x0 - 14, y_top - 16), (x0 - 2, y_top + 4)], ROOF_DARK)
        # 右上
        poly([(x1, y_top), (x1 + 14, y_top - 16), (x1 + 2, y_top + 4)], ROOF_DARK)
        # 左下（前檐）
        poly([(x0 + dx, y_front), (x0 + dx - 16, y_front + 10), (x0 + dx + 2, y_front + 2)], ROOF_DARK)
        # 右下
        poly([(x1 + dx, y_front), (x1 + dx + 16, y_front + 10), (x1 + dx - 2, y_front + 2)], ROOF_DARK)

def pillars(x0, x1, y_top, y_bot, n=5, color=WOOD):
    for i in range(n):
        t = i / (n - 1)
        x = x0 + (x1 - x0) * t
        rect(x - 4, y_top, 8, y_bot - y_top, color)

# ---------- 建筑 ----------
def build_main_hall(cx, y_front):
    """正殿（北端）"""
    W, D, H = 660, 250, 195
    S = 22
    platform_front(cx, y_front, W, D, S)
    wall_front(cx, y_front - S - H, W, H,
               arches=[(cx - 210, 112, 140), (cx, 112, 140), (cx + 210, 112, 140)])
    roof_box(cx, y_front - S - H - 44, W + 70, 152, dx=34, jiao=True)

def build_stage(cx, y_front):
    """戏台（面向正殿，南端内）"""
    W, D, H = 400, 230, 155
    S = 32
    platform_front(cx, y_front, W, D, S)
    # 戏台南立面（背面，实墙小门）
    wall_front(cx, y_front - S - H, W, H, arches=[(cx, 92, 108)])
    roof_box(cx, y_front - S - H - 40, W + 62, 142, dx=30, jiao=True)

def build_gate(cx, y_front):
    """大门（南端，三拱门洞）"""
    W, D, H = 640, 150, 135
    S = 20
    platform_front(cx, y_front, W, D, S)
    # 三拱门洞
    arches = [(cx - 200, 118, 118), (cx, 118, 118), (cx + 200, 118, 118)]
    wall_front(cx, y_front - S - H, W, H, arches=arches)
    roof_box(cx, y_front - S - H - 36, W + 56, 130, dx=28, jiao=True)

def build_passage(cx, y_front, span_w):
    """带瓦走廊：横向长条，连接左右廊，低矮，柱列通透。y_front=北沿(后檐)"""
    depth = 104
    x0 = cx - span_w / 2
    x1 = cx + span_w / 2
    y_top = y_front
    y_ground = y_front + depth + 96   # 走廊地面投影
    # 走廊地坪（浅色通道，被屋顶覆盖，两侧露出）
    rect(x0 - 10, y_front + depth - 6, span_w + 30, y_ground - y_front - depth + 6, "#D8D3C3")
    # 瓦顶：后坡(深) + 前坡(亮)
    poly([(x0, y_top), (x1, y_top), (x1 + 24, y_top + depth), (x0 + 24, y_top + depth)], ROOF_DARK)
    poly([(x0 + 2, y_top + 22), (x1 + 2, y_top + 22), (x1 + 24, y_top + depth), (x0 + 24, y_top + depth)], ROOF)
    poly([(x0 + 24, y_top + depth - 24), (x1 + 24, y_top + depth - 24),
          (x1 + 24, y_top + depth), (x0 + 24, y_top + depth)], EAVE)
    # 屋脊（东西向）
    line(x0 + 20, y_top + depth * 0.5, x1 + 20, y_top + depth * 0.5, RIDGE, 6)
    # 瓦楞
    for i in range(1, 5):
        t = i / 5
        yy = y_top + depth * t
        off = 24 * t
        line(x0 + 12, yy + 3, x1 + 6, yy + 3 - 2, "#66605A", 1, "3,9")
    # 柱列（前檐到地面，通透，柱距大）
    ncol = 11
    for i in range(ncol):
        x = x0 + 46 + i * ((span_w - 92) / (ncol - 1))
        rect(x - 7, y_top + depth - 14, 14, y_ground - y_top - depth + 14, WOOD)
        rect(x - 7, y_top + depth - 14, 14, 18, WOOD_DARK)   # 柱头
        # 柱础
        ellipse(x, y_ground, 12, 5, PLINTH_D)
    # 两端与左右廊衔接的坡（色带过渡）
    poly([(x0 - 30, y_top), (x0 - 6, y_top), (x0 - 6, y_top + depth), (x0 - 30, y_top + depth + 12)], ROOF_DARK)
    poly([(x1 + 6, y_top), (x1 + 30, y_top), (x1 + 30, y_top + depth + 12), (x1 + 6, y_top + depth)], ROOF_DARK)

def build_corridor(cx, y_front_top, y_front_bot, W, side=-1):
    """左右纵向廊屋：台基 + 红墙 + 瓦顶 + 柱列。side=-1 左(西)廊, +1 右(东)廊"""
    x0 = cx - W / 2
    x1 = cx + W / 2
    L = y_front_bot - y_front_top
    # 台基
    rect(x0 - 10, y_front_top + 16, W + 20, L - 20, PLINTH)
    rect(x0 - 10, y_front_bot - 8, W + 20, 8, PLINTH_D)   # 台基南端正面
    # 红墙（外立面方向：西廊看西侧，东廊看东侧）
    if side < 0:
        wall_x0 = x0 - 2
        wall_w = W - 6
    else:
        wall_x0 = x0 + 8
        wall_w = W - 6
    rect(wall_x0, y_front_top + 12, wall_w, L - 16, WALL)
    for i in range(1, 7):
        y = y_front_top + 12 + i * ((L - 16) / 7)
        line(wall_x0, y, wall_x0 + wall_w, y, WALL_LINE, 1, "5,7")
    # 屋顶（长条瓦顶 + 屋脊南北向）
    r_x0 = x0 - 18
    r_w = W + 36
    poly([(r_x0, y_front_top), (r_x0 + r_w, y_front_top),
          (r_x0 + r_w + 10, y_front_bot), (r_x0 + 10, y_front_bot)], ROOF_DARK)
    # 屋面坡向（外侧深、内侧亮：用亮条靠内）
    poly([(r_x0 + 26, y_front_top + 6), (r_x0 + r_w - 10, y_front_top + 6),
          (r_x0 + r_w - 4, y_front_bot - 6), (r_x0 + 30, y_front_bot - 6)], ROOF)
    # 屋脊（南北向）
    line(r_x0 + 10, y_front_top + 8, r_x0 + 20, y_front_bot - 8, RIDGE, 4)
    # 柱列（沿廊道内侧）
    for i in range(0, 9):
        y = y_front_top + 46 + i * ((L - 92) / 8)
        px = x0 + (W - 10 if side < 0 else 10)
        rect(px - 5, y, 10, 34, WOOD)
    # 瓦楞横线
    for i in range(1, 5):
        t = i / 5
        y = y_front_top + 14 + t * (L - 20)
        line(r_x0 + 8, y, r_x0 + r_w + 8, y + 6, "#66605A", 1, "3,9")

# ---------- 树 ----------
def draw_tree(cx, cy, r, shade=1.0):
    ellipse(cx + r * 0.18, cy + r * 0.5, r * 1.08, r * 0.34, SHADOW)
    circle(cx, cy + r * 0.12, r * 0.96, TREE_C)
    circle(cx, cy, r * 0.9, TREE_A)
    circle(cx - r * 0.35, cy - r * 0.22, r * 0.6, TREE_B)
    circle(cx + r * 0.4, cy - r * 0.28, r * 0.55, TREE_B)
    circle(cx + r * 0.02, cy - r * 0.48, r * 0.42, TREE_C)
    # 高光点
    circle(cx - r * 0.18, cy - r * 0.4, r * 0.16, "#C7DCB4", op=0.85)

# ---------- 组装 ----------
grad_defs()
draw_bg()
draw_ground()
draw_plaza()

CX = 1020  # 建筑群中心 x（偏右，左侧留白放标题）

# 遮挡顺序：北（远）→ 南（近）
build_main_hall(CX, 800)          # 正殿
build_corridor(CX - 750, 560, 1210, 150, -1)   # 西廊（右壁）
build_corridor(CX + 750, 560, 1210, 150, +1)   # 东廊（左壁）
build_stage(CX, 1080)             # 戏台
build_passage(CX, 1125, 1500)     # 带瓦走廊（连接左右廊）
build_gate(CX, 1310)              # 大门

# 树
draw_tree(560, 860, 70)
draw_tree(430, 985, 56)
draw_tree(1870, 700, 74)
draw_tree(1730, 880, 52)
draw_tree(290, 1480, 62)
draw_tree(1830, 1290, 64)
draw_tree(660, 1580, 58)
draw_tree(460, 1720, 72)
draw_tree(1520, 1740, 64)
draw_tree(190, 700, 52)
draw_tree(320, 560, 46)

# 门前小石墩
circle(930, 1360, 14, PLINTH_D)
circle(1110, 1360, 14, PLINTH_D)

# 天空飞鸟点缀（简）
path("M 420 260 q 14 -12 28 0 q 14 -12 28 0", "none", "#7A8CA0", 3)

svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" '
       'width="%d" height="%d">\n' % (W, H, W, H)) + "\n".join(parts) + "\n</svg>"
with open("水龙祠2.5D插画.svg", "w", encoding="utf-8") as f:
    f.write(svg)
print("SVG written:", len(svg), "chars")
