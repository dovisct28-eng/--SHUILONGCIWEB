# 水龙祠原境数字展厅 V2.1｜入口重构与验收

日期：2026-10-26。实施基线：`882237b83768160bd0d8754cdab8aed53453cb9c`。独立分支：`feature/shuilongci-hybrid-gallery-v1`。实施前已重新 fetch，远程功能分支仍为该提交；远程 master 为 `af7235cdd7df1a5e88085cc6528d6bc0ff09d8ad`。本轮不合并 master。

本轮范围为原建筑总览、绕至正门、门前减速、穿过中央门洞、门内停靠。V2.2 室内展示及匹配合成尚未实施。视觉与运动参数为本轮可审查候选，技术通过不替代用户审图。

## 运行与操作

在仓库根目录启动已有本地服务器：

```powershell
$env:A01_PORT='4186'
node module-a/a01/server.mjs
```

V2.1：<http://127.0.0.1:4186/module-a/immersive-hybrid-v1/>。

V1 后续室内独立验证：<http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v1.html>。

滚轮与方向键前进/返回；底部可直接定位五个停靠点。过渡期间的新输入直接消耗，不排队跳过下一节点。停靠后须有新的滚轮手势；系统及手动减少动态把过渡缩短至约 100 ms。调试面板提供完整约 10.8 秒连续镜头候选和交接参数导出。门内为本轮终点，不滚入 V1 图片。

## 源码与资源审查

原 A01 的真实运行实例位于 `shuilong-temple/水龙祠-交互预览.html?clean&controlled`。GLB 根节点、原程序地形、201 株植被、材质、主光、半球光、阴影、雾和 HDR/AO 后期共用一个 Scene/Renderer；远山由父页面的 `module-a/a01/ink-scene.mjs` 与原 A01 CSS 合成。完整视觉不只存在于 GLB 内。环境属于既有设计表达，不是现场测绘资料。

成熟 A01 基准为进度 5 屏、实体显现完成：FOV 32°、曝光 0.98、主光强度 4.5、半球光 0.72、主光坐标 `[-16,22,16]`。原后期保留两次渲染 Pass，使用同一个 WebGL 上下文；不能把两次 Pass 计作两个 Renderer。

原公开接口可以驱动章节、建筑显现与 A04 路线，但没有独立镜头租用/按需渲染入口。原每帧更新会覆盖相机，直接在外部更改相机无法稳定工作。因此选择任务书方案 A：**复用原运行实例，并增加仅专用 URL 启用的适配入口**。没有复制环境或重新编写 GLB 加载器。

V1 审查范围包括 main、model-view、camera-presets、transition-controller、parallax-scene、asset-loader、depth-layers 和 scene-manifest。V1 总览由单独创建的 Renderer、纯色背景和大平面承载；从 R01→R02→R03 推进后用透明度覆盖整张生成门图，后续视点变动也依赖整图淡出/淡入。其 R03→R04 相机是直接赋值，并不代表真实门洞穿越。foreground mask 与轻微视差不能弥补模型/生成图的轮廓差异。V1 图片、原件、蒙版、题录和历史证据全部保留。

## 实现与修改文件

| 文件 | 本轮用途 |
| --- | --- |
| `module-a/immersive-hybrid-v1/index.html` | 独立 V2.1 入口，单一受控 iframe 与轻量 UI |
| `module-a/immersive-hybrid-v1/v1.html` | 逐字保留原 V1 入口，继续调用未改动的原 main/model-view |
| `module-a/immersive-hybrid-v1/src/entry-main.mjs` | 五停靠点、单次过渡锁、滚轮消耗、正反向、重播、减少动态、失败恢复 |
| `module-a/immersive-hybrid-v1/src/entry-path.mjs` | 可编辑全局轨道、独立视线轨道、FOV 和停靠时间 |
| `module-a/immersive-hybrid-v1/src/entry.css` | 导入原 A01 样式以复用远山合成；局部定义克制的展厅 UI |
| `module-a/immersive-hybrid-v1/src/temple-runtime.mjs` | 原实例镜头适配、门板可逆索引、原有局部灯、按需渲染、遮挡/交接数据 |
| `shuilong-temple/水龙祠-交互预览.html` | 仅增加 `gallery-entry && controlled` 导入与帧入口分支；普通正式页面不启用 |
| `module-a/immersive-hybrid-v1/tests/entry.test.mjs` | 轨道连续导数、实际开口约束、反向确定性、并发输入及失败状态测试 |
| `module-a/immersive-hybrid-v1/scripts/entry-build-check.cjs` | 语法、母版/正式入口/数据/归档保护及共享页面改动隔离检查 |
| `module-a/immersive-hybrid-v1/scripts/entry-browser-check.cjs` | 三视口、交互、性能、恢复、V1 与 A01–A08 实际浏览器回归 |
| `module-a/immersive-hybrid-v1/scripts/entry-evidence.cjs` | 实际 WebGL 连续帧、真实播放录像、门板可逆检查和交接蒙版 |
| `module-a/immersive-hybrid-v1/scripts/entry-report.cjs` | 从实测报告生成摘要、核对精选清单体积与完成条件 |
| `module-a/immersive-hybrid-v1/scripts/entry-probe.cjs` | 可复用的五状态截图与碰撞排查工具，输出仅入 local |
| `module-a/immersive-hybrid-v1/scripts/browser-check.cjs` | 仅把原 V1 浏览器测试指向保留的 v1.html |
| `module-a/immersive-hybrid-v1/README.md` | 更新两个验证面的启动说明 |
| 本目录 | 验收报告、交接 JSON 与精选运行证据 |

共享页面改动的必要性：原循环会覆盖独立相机且持续渲染。构建检查移除新增 opt-in 代码后，源码与基线逐字一致（仅容忍 CRLF/LF）；另用真实正式页面的 A01–A08 对照截图验证普通路径。正式章节源码、文案、B、GLB、母版、五幅位置和归档引用均未修改。工作区既有 B、低保真启动器等未提交改动不纳入本次提交。

## 轨道与门洞

成熟 A01 总览位于建筑背侧，不能从该机位直接穿过屋面“进入前门”。新轨道先沿建筑外围绕至正面，随后降至入口眼位，中心对准中央开口。位置与观察目标各自使用非均匀三次 Hermite 曲线，控制点处一阶导数连续；所有按钮、直接定位及倒退都采样同一全局轨道，不重新创建相机或依赖整图切换。

| 停靠点 | 轨道 t | 位置 | 目标 | FOV |
| --- | --- | --- | --- | --- |
| overview | 0 | `[-23.332506,19.342754,-26.880314]` | `[0,-1.25,-1.75]` | 32° |
| approach | 0.52 | `[-0.35,2.2,24]` | `[0,1.32,11.8]` | 46° |
| gate-close | 0.78 | `[0,1.38,14.1]` | `[0,1.38,9.8]` | 48° |
| threshold | 0.92 | `[0,1.38,12.25]` | `[0.12,1.38,9.7]` | 48° |
| gate-interior | 1 | `[0.12,1.38,11.15]` | `[1.2,1.38,9.2]` | 48° |

以上全为设计模型坐标，没有米制/现场测绘含义。原中央门的门板宽约 1.52、下段高 1.68；原门楣下缘约 y=1.615。穿越眼位取 y=1.38 以通过实际开口，不把它称为实测人体尺度。门后戏台背板外表面约 z=9.555，终点在其前方，视线轻转右侧但本轮不绕过戏台。

门板/木条/门环共 320 个三角面在原实例中使用克隆索引可逆隐藏；砖券、拱内填充、门楣、门框、门槛和戏台保留。原几何和 GLB 不写回。门板恢复测试确认中央光线再次受到实体阻挡；门板打开后中心通行光线无碰撞，而门楣仍有实际碰撞。

全轨道以 1600 小段、五条偏移射线双向检查，覆盖相机中心和 ±0.065 的水平/垂直包络，三个视口均无建筑交叉。这是相机几何检查，不替代整个人体碰撞体。实际近景、连续帧和录像用于检查透视、门框进出画面、回程及遮挡关系。

光照继续使用原材质、主光、半球光和阴影；总览完全保持基准。仅在 t=0.65–0.92 渐进启用原已存在的 A02 廊道局部灯，将其运行时移至门后 `[0.7,2,11]`，强度到 8，用作门内柔和补光；不新建灯或调亮整张图片。回到总览时灯位和强度按同一参数确定性恢复。没有闪白、黑幕或曝光硬切。

## 验证结果与证据

机器可读结果：

- [构建与保护检查](build-results.json)
- [浏览器、资源、帧间隔与内存结果](browser-results.json)
- [几何轨道检查](geometry-results.json)
- [运行时门板恢复与门楣保留](door-reversibility.json)
- [运动证据、运行设备与测量说明](motion-evidence.json)

同机位对照在门板恢复状态下检验原材质、光照、环境和后期，1920×1080 RGB 像素差为 0。正式 A01–A08 的普通 URL 不出现 entry API；逐章滚动对照结果在 browser-results 中，不以同机位零差异推称所有章节截图逐像素一致。

性能指标记录实际 requestAnimationFrame 时间戳，按各区段给出样本数/P50/P95/最大值，不推算“稳定 60 FPS”。GLB 请求、Renderer/Canvas 数量、资源计数、五轮进出前后 JS heap 都有原始数据。停车期间验证无持续绘制。JS heap 会受 GC 影响，纹理/几何数恒定不等于完整显存泄漏审计；未做弱 GPU、跨设备和真实显示器观感验收。

正式页存在既有 `/favicon.ico` 404，单独记录于浏览器报告 resources，不算本轮场景错误。原正式场景的着色器还可能产生 D3D `X3595` 梯度编译警告，原基线与当前正式页的消息按 surface 分开保留；不改动原着色器来消除诊断。故障注入测试的 503 也单独记录为预期事件。正常 V2.1 没有场景脚本错误或 WebGL 警告。故障测试覆盖场景请求失败提示与点击重试，以及 GLB 请求失败时原运行器内嵌等价副本的回退。

逐章截图比对须在滚动后的新字体请求完成后捕获，测试显式等待父页面和 iframe 的 fonts.ready；较早只固定等待 450 ms 的比较会混入字体替换差异，其失败记录留在 local。该修正只调整验收脚本，没有改动正式字体、CSS 或章节逻辑。

精选清单（PNG 保留原捕获尺寸，重复回归均在忽略的 local 中）：

| 文件 | 覆盖内容 |
| --- | --- |
| `selected/01-original-overview.png` | 原 A01 运行实例同机位、隐藏外层 UI 的视觉基准 |
| `selected/02-reused-overview.png` | V2.1 正常打开门板后的总览与 UI |
| `selected/03-gate-approach.png` | 正面接近入口 |
| `selected/04-gate-close.png` | 门洞、砖框、门楣与内外光差 |
| `selected/05-threshold.png` | 门洞穿越阶段；须结合连续帧看门框退出过程 |
| `selected/06-gate-interior.png` | 戏台前停靠与右侧通道预留 |
| `selected/07-overview-comparison.webp` | 左原 A01 / 右复用实例；相同机位、门板恢复，用于比照环境和材质 |
| `selected/08-interior-depth-mask.png` | 门内距相机 2 单位以内的真实几何白色遮挡区域 |
| `selected/09-continuous-rail.webp` | 同一模型轨道的 12 个真实 WebGL 帧，非生成图 |
| `selected/10-gate-occlusion-mask.png` | t=0.84 门前近景的几何遮挡候选，阈值 2.2 |
| `selected/11-gate-occlusion-candidate.png` | 上一蒙版对应的实际彩色画面 |
| `selected/12-continuous-entry-and-return.webm` | 浏览器实时录制的完整正向镜头与同轨道返回；录制开销独立于性能测试 |

精选体积及本机实测摘要见 [测量摘要](measurement-summary.md)。

## V2.2 交接边界

[1920×1080](handoff-1920x1080.json)、[1440×900](handoff-1440x900.json)、[1366×768](handoff-1366x768.json) 记录门内停靠的相机位置、目标、四元数、FOV、Near/Far、宽高比、视野角度、门洞边界和关键构件的投影/可见性/射线遮挡，以及曝光、色彩空间、灯光、雾和后期配置。

[门框遮挡候选](handoff-occlusion-candidate.json) 另记录 t=0.84 的前方门楣/门框遮挡。门内终点处门框已在相机后方，不能把终点的门框当作前景蒙版。候选遮挡位置与最终停靠位置明确分开；蒙版来自原模型深度，不是 AI 分割。

当前不存在匹配室内素材，两套数据均标记 `readyForFinalComposite:false`。V2.2 应在这些机位约束下准备匹配素材，检查视野与色光后再决定合成窗口；本轮不自动进入或宣称完成室内 2.5D。剩余视觉限制：原近景木纹/砖材贴图的细节分辨率、远山为既有二维设计背景、模型并非实测复原。本轮不新增高分辨率替代材质或虚构建筑构件。

## 复验命令

```powershell
$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node --test module-a/immersive-hybrid-v1/tests/entry.test.mjs module-a/immersive-hybrid-v1/tests/logic.test.mjs shuilong-temple/shared-world.test.mjs shuilong-temple/a01-cinematic.test.mjs shuilong-temple/source-equivalence.test.mjs
node module-a/immersive-hybrid-v1/scripts/entry-build-check.cjs
node module-a/immersive-hybrid-v1/scripts/entry-browser-check.cjs
node module-a/immersive-hybrid-v1/scripts/entry-evidence.cjs
node module-a/immersive-hybrid-v1/scripts/entry-report.cjs
```

浏览器依赖只用于本机验收；页面运行不依赖新 npm 安装、在线 CDN 或外部 API。entry-build-check 对比固定实施基线，不运行会重建 GLB 的构建命令。
