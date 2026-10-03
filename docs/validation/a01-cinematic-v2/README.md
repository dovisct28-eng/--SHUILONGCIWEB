# A01 Cinematic v2：实际页面验收 / 待审图

日期：2026-10-03。对照基线 `fab296b3a558a7037da99bb2f30c67cf3c5ecafd`。本轮环境为艺术化喀斯特山谷，不是实地测绘、遗产照片或历史资料。

## 审图入口

- [1440×900 最终 Hero](08-final-hero.png)
- [参考 / 基线 / 本轮](reference-baseline-final.jpg)：参考仅裁出原展板顶部画面；各图等比完整显示，黑边保留不同比例。
- [逐 Pass 演进](visual-evolution.jpg)：Camera C、Environment、Lighting、Material、Post、Composite 为各步真实页面截图。
- [相机 A / B / C](camera/candidates.png)
- [十个动画点](07-line-animation.jpg)：0 / 5 / 12 / 20 / 30 / 40 / 50 / 60 / 75 / 100%，源截图在 `animation/`。
- [四尺寸 Hero](four-size-heroes.jpg)：1440×900、1920×1080、1366×768、1024×768。
- [设计与实施说明](../../A01_CINEMATIC_V2.md)

编号 01—06 为基线至后期 Pass，07 为动画联系表，08 为最终 Hero。Pass 原图及 JSON 记录留在各自目录；最终技术验收在 `final/results.json`，包含四尺寸各 11 个 A01 状态、A02—A04 回归以及四类回退。动画是页面实际渲染，不是 AI 生成的动画截图。Git 保留十点四尺寸动画、最终四尺寸、Pass 图、回退图与技术 JSON；其余重复回归原图保留在本地，不重复纳入 Git。

## 已通过技术检查

| 项目 | 结果与证据 |
| --- | --- |
| Node 测试 | 63 / 63；[完整输出](unit-tests.txt)，包括材质隔离、相机、真实线段与坡面接地 |
| 建筑 Python 检查 | `architecture-style.test.py`，3 / 3；原结构与抹灰顶点色保留 |
| 构建 | `build-model.mjs` 成功；离线 inline 模块与源码一致 |
| 动画与倒滚 | [cinematic-results.json](cinematic-results.json)：四尺寸 40 张截图；纯数值状态严格一致；reload、阅读停留与退出 A04 后返回均通过 |
| 老线描回归 | [line-regression/results.json](line-regression/results.json)：36 状态、刷新、rapid scroll、resize、六类减弱/失败回退 |
| 构图与 A02/A03 | [final/results.json](final/results.json)：四尺寸建筑边界、回中、后续标记与回退可用 |
| A04 | [a04-regression/results.json](a04-regression/results.json)：三幅停靠、全景回撤、路线总结、跳过/重播/键盘/可见性/reduced-motion |
| 原模型/壁画 | [shared-model/model-structure/results.json](shared-model/model-structure/results.json)：A01—A04 共用模型、第一幅相机与直接预览 |
| A05—A07 | [guide-regression/results.json](guide-regression/results.json)：三幅导读、倒滚/resize、失败降级与懒加载；未请求 detail 母图 |
| A08 | [a08-regression/results.json](a08-regression/results.json)：四尺寸、主动入口、浏览器返回与刷新；需同时启动原模块 B 服务 |
| 字体 | [font-layout.json](font-layout.json)：四尺寸、字体延迟替换后布局稳定 |
| 文字对比 | [contrast.json](contrast.json)：采样最低比值 1920=7.32、1440=6.98、1366=5.47、1024=5.01；不外推至所有任意背景位置 |
| 新增模块回退 | environment/post/far-image 失败及 reduced-motion，均保留完整建筑/阅读入口，见 cinematic-results |

正反滚像素比较区分低幅合成舍入与稀疏线条抗锯齿差异，不要求逐像素一致。1440 / 1920 通道最大差 3；1366 最大差 1；1024 最大差 11，但该较大差异只集中于极少线边缘。各帧变化比例、均值及最大差均保存在 JSON。实测曾发现 iframe resize 延迟以及背景微缩放导致反滚重采样；已在原 RAF 同步实际尺寸、取消远景微缩放，仅保留平移视差。没有以放宽整体图片差异掩盖构图跳变。

A08 初次检查因未启动原模块 B 的 3000 服务而出现 connection refused；启动其原有 `node server.js` 后复核。没有修改模块 B 代码。

## 同机性能抽样

[performance.json](performance.json)：Chrome 154 系列、ANGLE / NVIDIA GeForce GTX 1660 Ti / D3D11；每个尺寸基线与 v2 各三次新 context，顺序运行。基线通过 Git 读取八个原文件并路由，GLB/字体/纹理相同。context 隔离不代表清除了操作系统文件缓存或浏览器全局 shader 缓存。

| 尺寸 / 版本 | 文本出现均值 ms | 模型 ready 均值 ms | 资源/字体 ready 均值 ms | RAF median 均值 ms | RAF P95 均值 ms |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1440 基线 | 644 | 1548 | 1674 | 8.27 | 9.80 |
| 1440 v2 | 455 | 1448 | 1503 | 4.20 | 9.70 |
| 1920 基线 | 617 | 1368 | 1500 | 8.30 | 12.53 |
| 1920 v2 | 458 | 1175 | 1220 | 4.20 | 7.03 |

**以上是 headless RAF 调度间隔，不是 GPU 计时或用户屏幕 FPS；不能解释为 v2 两倍性能。** 90 帧持续滚动，未模拟低端显卡、后台负载或长时间内存压力。shader 初次编译、系统缓存与 headless 调度会影响小样本结果。

Hero 的相同场景计数口径（不计 shadow traversal，v2 含后期屏幕两三角形）：基线约 71 / 72 draw calls、83,898 / 83,918 triangles、62 geometries、21 textures；v2 46 calls、172,798 triangles、53 geometries、22 textures。新增树/地形提高三角形数，instancing 减少绘制调用。实际阴影成本仍计入浏览器运行时间，不能把 renderer.info 的场景计数当作全部 GPU 工作量。

v2 1440 Hero 后期目标为 1210×756，缓冲估算 32,931,360 B（31.41 MiB）；1920 为 1500×907，48,978,000 B（46.71 MiB）。这是 iframe 实际尺寸下 DPR 受控的 HDR/depth/MSAA 目标，**不等于总 GPU 内存**。原 2048² 阴影贴图、建筑纹理、远景解码、DOM 合成、驱动开销另计；目前没有可靠的总 GPU 内存读数。

每次 GLB 请求 1、字体请求 2；v2 matte 请求 1（209,634 B），全部请求由 38 增至 42。首屏没有请求三幅导读展示图或母图。多次跨尺寸回到原尺寸后 geometries / textures 数量不增长；不能据此保证长时间无泄漏。

## 保护范围与状态

原 model-source、GLB、mural-locations、A01 progress、模块 B 没有差异。低保真 tag 解引用及归档分支仍为 `48f272497e86e4549c5bcd0dee275ff347171a3f`；tag 注释对象不应误认为基线 commit。没有改动归档机制。用户任务前已有的归档修正和其他未提交文件不纳入本轮提交。

最终 Hero、十节点、四尺寸、比较与演进联系表均读取实际截图审查。近树程序化感、原瓦纹重复、单像素线边缘和轻量深度 AO 精度仍低于参考插画。技术验收完成不等于用户审美批准。

**当前等待用户审图，未标记 A01 High Fidelity v2 Approved，未视觉冻结。**
