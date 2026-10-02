# A01「一线成祠」实现与验收

2026-10-02；开发基线 `4dbc656668880ed3a7d4aeb235064b5aa8701f0a`（开始前 fetch 后核实与远程 master 一致）。仅作用于模块 A 的 A01 视觉、共享预览的受控开屏接口及相关构建/验收。模块 B、A02—A08 叙事、A04 58 秒时间线、建筑源、GLB、原始壁画和低保真归档机制均保持原样。用户原有归档脚本修改及素材增删不纳入本次提交。

## 实际视觉结构

空间辅助线 → 主殿/两廊/戏台/入口结构 → 屋脊、柱列与院落轮廓补全 → 线稿与半实体叠合 → 实体完全接管 → 建筑右移 → 左侧文案 → 稳定 Hero → A02 一次回中。

保留 0–20 / 20–65 / 65–82 / 82–100 四阶段、5 屏动画、1.2 屏独立阅读与原 1 屏回中。线层只细分原生长阶段内部映射：约 40.7% 完整结构线成立，约 51% 叠合，65% 前线描完全退出。停滚稳定、倒滚可恢复，不增加点击、自动开场、timer、锁滚轮或滚动距离。

开场名称沿用「水龙祠 · 壁画数字叙事」，地点仍为「湖南江永 · 勾蓝瑶」。最终建筑为一级，标题/简介为二级，地点/向下探索为三级。左文宽度与字级分别适配四尺寸；标题宋体 72–96px，正文黑体 17–18px，文字只作透明度与最多 12px 位移。不出现路线、壁画编号、人物线描或全局导航。

## 技术与真实性

采用 Three.js `LineSegments`，轮廓在构建时从现有 `model-source.js` 提取：大体块使用 `EdgesGeometry`，屋脊/檐口/门券取原 TubeGeometry 中心路径，柱列保留两条纵线，细梁简化为中心线。去掉瓦肋、砖纹、门扇细条、门券条带拼接边和壁画几何。最终 780 段建筑轮廓＋6 段轴线/定位短线；8 个建筑组＋2 个辅助组。

线层挂到现有模型 root，使用同一相机、renderer、变换和原 RAF；`drawRange` 与分组透明度派生自滚动，无逐帧 Geometry 重建。共享预览只在 `?controlled` 创建线层，独立预览仍沿用原开场。`build-model.mjs` 同步生成线条模块与 file 模式内嵌副本；模块/数据失败回退原旋转生长，部分初始化异常释放已建资源。退出 A01 隐藏，最终 pagehide 非 BFCache 离开时 dispose Geometry/Material。

线描是**基于资料约束设计模型生成的简化结构轮廓**，不是实测、扫描或数字孪生；没有重新设计建筑、镜像、添加屋顶或扩写文化事实。曲线降采样与梁线简化用于减少密度，不能据其推定真实构件尺寸。

## 字体、颜色与 reduced-motion

本轮打样选择炭灰 `#343833`、辅助色 `#62675F` 与既有纸色 `#F2EEE4`；没有使用候选朱红/灰绿 Accent。这些选择不升级为全项目冻结。纸面上的文字对比度分别约 10.30:1 / 5.00:1；环境在文字安全区保持低权重。

Noto Serif CJK SC Medium 2.003 与 Noto Sans CJK SC Regular 2.004 本地 WOFF2：35,304 / 25,148 B，合计 60,452 B，低于接入前记录的 64 KiB 预算。仅用于 A01，2 个请求、swap、无整字库预载，授权/来源/版本/hash/字符清单见 [fonts](../module-a/a01/fonts/README.md)。从公开字体母文件下载后本地子集化，文案未发送外部服务。缺字验证、字体阻断回退和真实延迟加载前后布局检查均有记录。

reduced-motion 将新增辅助线纵深位移归零，保留用户滚动驱动的线/实体生成、原旋转、章节内容和稳定 Hero；不宣称完全静态替代。删去原模型容器 opacity transition，新增线层不使用 CSS 动画或定时器。

真实延迟字体请求检查曾发现入口名称默认行高随字体变化 6–8px；改为固定行高与居中容器后，四尺寸的入口、标题、正文与提示外框在 fallback→WOFF2 换字前后数值相同。见 [font-layout.json](validation/a01-line/font-layout.json)；字体字形本身仍会替换，不将外框稳定等同于字形完全一致。

## 资源与性能

| 项目 | 本轮变化 |
| --- | --- |
| 建筑 GLB | 3,329,000 B / 83,360 三角面，增量 0 |
| Line Geometry / Material / LineSegments | 各新增 10；786 线段，不是三角网格 |
| 模块源码 | 数据 26,595 B＋控制器 3,904 B |
| 预览 HTML | 增加 32,488 B，含离线代码/数据副本 |
| 本地字体 | 新增 60,452 B；实际首屏 2 请求 |
| HTTP | 新增 2 个线层模块＋2 个字体；无新图片 |
| RAF / Canvas / 后处理 | 新增 0 / 0 / 0 |
| GLB / 环境资源 | 每页仍分别为 1 / 3 请求；A01 无 detail 或大壁画请求 |
| 稳定 Hero draw calls | 对照/新实现均 78；线层 0 |
| 完整线态 draw calls | 53 → 56；实体显现时序不同，不是只加线的控制实验 |
| 半实体叠合 draw calls | 68 → 83；含 10 组线与透明双面材质成本 |

Chrome 154.0.8037.93 headless，1440×900，原提交文件通过浏览器路由提供基线，每组 3 个独立 context 冷加载样本，顺序执行，运动阶段各采 90 帧。帧间隔中位数均约 4.2ms；P95 对照 4.3–4.5ms、新实现 4.4–12.5ms（其中一次尾部抖动）。模型就绪三样本中位数约 1,110 → 1,187ms，全部图片/字体就绪约 1,197 → 1,289ms；不把 modelReady 等同于图片解码完成。多轮倒滚/resize 后 GPU Geometry/Texture 计数不增长。数据见 [performance.json](validation/a01-line/performance.json)，仅本机抽样，不保证其他 GPU/设备，也不能据小样本断言性能无影响。

## 验证与截图

实际执行并通过：

```text
node shuilong-temple/build-model.mjs
node --test module-a/*/*.test.mjs module-a/*.test.mjs shuilong-temple/*.test.mjs
node --check module-a/a01/app.mjs
node --check shuilong-temple/a01-lines.mjs
node --check shuilong-temple/build-a01-lines.mjs
node module-a/a01/line-browser-check.cjs
node module-a/a01/line-performance-check.cjs
node module-a/a01/font-browser-check.cjs
node shuilong-temple/environment-browser-check.cjs
node shuilong-temple/model-browser-check.cjs
node shuilong-temple/texture-browser-check.cjs
node module-a/a04/browser-check.cjs
node module-a/a04/transition-check.cjs
git diff --check
```

55/55 Node 测试通过。构建后 GLB、模型元数据和内嵌副本一致；预览内联脚本也抽取执行 `node --check` 通过。既有 A04 首次复验暴露刷新初始化覆盖问题，修复后再次完整运行通过；新 A01 脚本也覆盖此刷新路径。

| CSS 视口 | A01 实际检查 |
| --- | --- |
| 1920×1080 | 9 状态、完整建筑、留白、文案/提示可见，无横向溢出，通过 |
| 1440×900 | 同上；与开发前 initial/growth/Hero/transition 四张对照，通过 |
| 1366×768 | 同上；低高度标题与底部安全区，通过 |
| 1024×768 | 同上；独立文字宽度和模型布局、字体失败回退，通过 |

正/反滚数值状态严格相等；截图允许少量 WebGL 透明阶段边缘抗锯齿误差，比较细节保留在 [results.json](validation/a01-line/results.json)，不宣称逐像素完全相同。停止 850ms、快速跨章、刷新中段、1920→1440→1024 resize、reduced-motion、线模块/数据/环境/字体/GLB 失败回退全部通过。A02 五幅定位可用，倒滚进 A01 清零；线层不在 A02 重新出现。A04 实际三次停靠、回撤、路线、跳过/重播、刷新/早离/后台暂停/键盘和 reduced-motion 通过；A04→A05 四尺寸交接、A05—A08 基本可达、建筑贴图及失败回退通过。

本地 `validation/a01-line/` 保存四尺寸 initial、travel、line-early、line-complete、overlap、solid、shift、hero、transition，共 36 状态截图，以及 6 组 reduced/failure Hero。`before/` 为实施前四张 1440×900。提交精选 Hero/线态/叠合、全尺寸联系表和文本记录，其余大图留本地；视觉人工检查了联系表、窄桌面全图、字体 fallback 与关键线/实体叠合。代表图见 [联系表](validation/a01-line/contact.jpg)。

## 仍需区分的事项

实现与本机验收已完成；字体/色值/线宽为当前打样选择，最终审美冻结仍需用户审核。低性能设备尚未覆盖；透明叠合存在额外 draw calls 与一次 P95 尾部抖动。真实墙位、背面细部等资料边界仍按原模型文档保留待核实，不以线稿生成效果替代史料证据。

## 修改文件索引

- A01 页面：`module-a/a01/app.mjs`、`styles.css`、`README.md`；`index.html` 和冻结进度文件没有改动。
- 线层/构建：`shuilong-temple/a01-lines.mjs`、`a01-lines-data.mjs`、`build-a01-lines.mjs`、`build-model.mjs`、`水龙祠-交互预览.html`。
- 字体：`module-a/a01/fonts/` 内两份 WOFF2、两份授权、manifest、README 与本地子集脚本。
- 测试：`shuilong-temple/a01-lines.test.mjs`；`module-a/a01/fonts.test.mjs`、`line-browser-check.cjs`、`line-performance-check.cjs`、`font-browser-check.cjs`。
- 文档：本页、`A01_ACCEPTANCE.md`、`DESIGN_SPEC.md`、`MODEL_HIGH_FIDELITY.md`；精选截图及结构化记录见 `validation/a01-line/`。`HIFI_VISUAL_SPEC.md` 原冻结规则未改动。
