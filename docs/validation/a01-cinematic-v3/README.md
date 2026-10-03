# A01 Cinematic V3｜交付与审图证据

2026-10-03。状态：**A01 High-Fidelity V3 Implementation Complete / Ready for Visual Review**。技术验收和以下视觉自检不等于用户批准或视觉冻结。

开发基线：`edd1708f4b97223884e47c8a416f033ba91431ae`，当时本地 HEAD 与远程 master 一致。最终 commit 由本目录的 Git 元数据确定：`git log -1 --format=%H -- docs/validation/a01-cinematic-v3/README.md`。完成 commit、push、fetch 和远程核实后，完整 SHA 写入本地 `delivery.json` 及回复；凭据不再提交，避免提交内容引用自身 SHA。

## 直接审图

- [真实页面 Before / After](before-after.jpg)
- [参考 B / 真实基线 / V3 三联](reference-current-v3.jpg)：参考 B 上半部分仅作艺术方向。
- [18 帧 Animation Contact Sheet](animation-contact-sheet.jpg)
- [四尺寸 Hero](responsive-contact-sheet.jpg)
- [逐项视觉 Pass](pass-contact-sheet.jpg)
- [最终 1440×900 Hero](08-responsive/hero-1440x900.png)
- [最终光扫：58 / 61 / 64 / 67 / 70%](03-light-reveal-final/)
- [最终地形与遮挡](05-environment-final/100-1440x900.png)

所有截图由 localhost 的实际页面渲染取得；合成展板只缩放、排列截图及添加审图标签，没有重绘建筑或替换页面内容。Camera pass 使用精确基线 line 模块隔离相机。Line / Lighting / 初版 Environment 等中间候选保留在各自目录，最终状态以 `07-animation`、`08-responsive`、最终光扫和最终环境为准。

## 实现范围

仅修改 A01 与共享预览的 A01 接口。真实 GLB、模型源、壁画 metadata / UV / 素材、A04 camera / route、A05—A08、模块 B 均无差异。固定低保真 Tag 解引用和归档分支仍指向 `48f272497e86e4549c5bcd0dee275ff347171a3f`。用户已有归档脚本、归档文档、测试修改和素材删除未纳入此次 commit。

Camera 从真实主殿檐部出发，以 centripetal Catmull–Rom 曲线横移、后撤、抬升；root 保持 identity，模型容器固定 .83，不以建筑缩小代替相机运动。0—18% 为局部，32—45% 首次形成整体，38—48% 汇入 Hero。候选 C 最终距离修正为 14。A01 FOV 32°，退出恢复 34°。

线条基于既有 1,056 个真实结构段与 6 个空间辅助段，Primary / Secondary / Tertiary 有不同亮度和出现窗口；材质和 geometry 预分配。58—70% 用同一世界坐标光扫逐步显现实体、收退线条并建立阴影，表面 opacity 为 1。不是全模型交叉淡入。

太阳 `(-16,22,16)`、暖色 `#ffd4a1`、强度 4.5，冷补光 .72；屋瓦、砖墙、石材保留原纹理与 UV。地形、树、石块与建筑共用太阳和阴影。近地坡面、非对称灌木、前景树和六片固定世界雾连接基础与谷地。近地景观 / 天空 / 谷地在 70—82% 分阶段建立；82—100% 建立标题，保留 1.2 屏阅读及 6.2—7.2 屏交接。

Post 沿用两遍 HDR、2 samples MSAA、12 点轻量深度 AO、克制调色和暗角；没有增加渲染器、RAF、Composer、Bloom 或 LUT。增强模块加载失败或其 shader 编译失败均可回退，正常建筑仍能进入 A02。

## Q1—Q10 逐项自检

|问题|结果|证据及判断边界|
|---|---|---|
|Q1：0—18% 仍看不到完整建筑？|YES|四尺寸采样的整体投影越出视口；实际近景截图只有局部檐、梁、廊。|
|Q2：18—45% 感到相机后撤而非模型缩小？|YES|真实 position / target 曲线，root 无变换；18/25/32/38/45% 实际截图可比较视角。|
|Q3：32—45% 首次认出整体？|YES，视觉判断|32—38% 空间轮廓展开，45% 完整线构；“认出”并非用户研究结论。|
|Q4：58—70% 不采用普通 opacity crossfade？|YES|世界坐标 surface / line / depth 共用阈值；61% 屋面先显现、64% 部分实体与线构并存。|
|Q5：建筑受光与右上夕阳一致？|YES，视觉判断|右后高位主光为建筑与景观共用光源；比对屋面、墙体、树影，未声称环境为物理 HDRI。|
|Q6：底部仍明显像独立模型台座？|NO，当前视觉判断|外侧土坡掩埋下缘，近端树和雾打断封闭轮廓；真实基础仍部分可见，并非完全隐藏。|
|Q7：存在真实地形、遮挡、雾和植物关系？|YES|3D 地形 / 实例树 / 石块 / 固定雾，共用 camera、深度和阴影；没有以贴图建筑代替 GLB。|
|Q8：前景 / 建筑 / 谷地 / 远山有空间层级？|YES，视觉判断|前景树与石、建筑、中景林、谷雾、远山和天空分层；远景仍为 2D 艺术 matte。|
|Q9：建筑本身有近 / 中 / 远空气层次？|YES|表面 shader 以实际 view 距离降低远端对比、融入空气色；近端瓦纹保留。|
|Q10：仍像“3D 模型放在 AI 山水图上”？|NO，当前视觉判断|物理近地连接、局部遮挡、共同阴影和建筑空气层次已建立；这不代表达到参考 B 的绘画复杂度，需用户审图。|

Q3 / Q5 / Q6 / Q8 / Q10 是对实际截图的设计自检，不能用技术断言代替观众感受。证据和限制保留，供用户作最终判断。

## 测试与运行验收

|检查|结果|
|---|---|
|Node：`node --test` 所有 module-a / shuilong-temple `.test.mjs`|65 / 65 通过；含新 surface/depth 同步、地形连续性、Post 编译失败回退测试。|
|Python：`architecture-style.test.py`|3 / 3 通过。|
|构建：`node shuilong-temple/build-model.mjs`|通过，GLB 83,360 triangles / 3,329,000 B，构建后无 GLB 内容差异；离线脚本与源一致。|
|四尺寸最终 A01|1440×900、1920×1080、1366×768、1024×768，各 18 帧，共 72 帧；无横向溢出、单 canvas、Hero 正文与建筑边界分离。|
|滚动 / 状态|逐点正反恢复、像素复核、暂停稳定、1.2 屏阅读、6.2—7.2 交接、中途刷新、往返 A02/A03/A04、连续 resize、快速跳滚通过；resize 后 geometry / texture 计数稳定。|
|减少动态效果|开场即完整 Hero；camera / copy position 固定，仍能进入 A02。|
|六类降级|reduced motion、环境模块、Post 模块、真实 Post 错误 GLSL、远景 WebP、Art 模块；全部可读 Hero 并进入 A02。|
|既有 A04|三幅真实自动路线、回撤、路线总结、replay / keyboard / hidden pause / reduced motion / 刷新和提前退出检查通过。|
|既有 A05—A07|第五→第一→第二、各幅右端→左端、快速反滚、resize、reduce、图片 / 模型失败降级通过；detail 请求 0。|
|既有 A08 / B 入口|四尺寸、反滚、刷新、主动进入 B、浏览器返回通过；B 内部实现无修改。|

正常路径未捕获 pageerror、shader 编译错误、WebGL context loss 或 framebuffer 错误。主动注入的错误 GLSL 由 Post 内部处理并记录在状态中；不是未处理运行异常。像素反滚允许至多 3 色阶、少量透明边缘舍入，数值状态严格一致。

归档 launcher 的用户现有测试曾在沙箱内因进程查询被拒绝失败；经允许在隔离临时工作目录单独重跑 1 / 1 通过，未修改用户脚本或归档机制。它不计入上面的 65 项模块测试。初版 Camera 提前跳整体、光扫 58—62% 停滞和近端台座亮边，均在真实截图检查后修正。

详细原始记录：[Node](09-regression/unit-tests.txt)、[浏览器](09-regression/browser-results.json)、[错误 GLSL](09-regression/post-shader-results.json)、[A04](09-regression/a04/results.json)、[三幅导读](09-regression/guides/results.json)、[A08](09-regression/a08/results.json)。

## Performance

使用同一 Chrome / GPU，以精确基线模块路由 V2，各 1440 / 1920 尺寸分别三次新 context；V2、V3 共 12 组。数据见 [performance.json](09-regression/performance.json)，[最终统计表](performance-summary.md)。新 context 不等于清空系统 / Chrome 磁盘缓存。

RAF 时间间隔为 headless 浏览器受本机调度影响的局部采样，不换算为保证 FPS，也不代表低端设备表现。目标缓冲估算只包含 Post，不包含全部 GPU 内存；JS heap 是当次页面快照。每次 A01 均只请求一个 GLB、两份本地字体、一个 matte URL；无 detail / 三幅导读 display 图片提前请求。资源常驻且复用，退出 A01 关闭增强，pagehide 释放新增资源。

## 文件和新增资产

代码：`module-a/a01/{app.mjs,ink-scene.mjs,styles.css}`；`shuilong-temple/{a01-camera.mjs,a01-lines.mjs,a01-material.mjs,a01-art-direction.mjs,a01-environment.mjs,a01-post.mjs,水龙祠-交互预览.html}`。

测试及证据工具：`shuilong-temple/{a01-lines.test.mjs,a01-cinematic.test.mjs}`；`module-a/a01/{v3-pass-check.cjs,v3-browser-check.cjs,v3-performance-check.cjs,v3-regression-check.cjs,v3-contact.cjs}`。

文档：`docs/{A01_CINEMATIC_V3.md,DESIGN_SPEC.md,CONTENT_MAP.md,HIFI_VISUAL_SPEC.md}`、`module-a/a01/README.md`、本目录的报告 / JSON / 运行日志 / 页面截图及五张审图展板。

新增资产：`shuilong-temple/environment-assets/a01-v3/{karst-valley.webp,README.md}`。WebP 1586×992，102,818 B；生成画面没有建筑，只服务艺术化远景。[Prompt、原始来源和 SHA256](../../../shuilong-temple/environment-assets/a01-v3/README.md)。运行保持本地资源，不依赖云端图片或 API。

## Known limitations

- 远山、谷地和天空仍为 2D matte，镜头为受控叙事；不能自由绕行并期待完整远山视差。近地与建筑为真实 3D。
- 雾为六片柔软世界平面，AO 为屏幕深度近似，均不等于物理体积云 / GI。
- 单像素 LineSegments 不是手绘墨迹；树冠为程序化叶片，未达到参考 B 的绘画精细度。仍可辨认真实建模特征，未把“参考效果完全一致”作为已完成事实。
- 真实石基保留局部可见；外围遮挡没有实测遮挡百分比。保护 GLB 比抹除全部基础更优先。
- 性能来自本机 GTX 1660 Ti / Chrome，未在低端 GPU、触屏实机或长期多小时会话做最终实测。
- 图像与景观是叙事艺术环境，不支持任何新的地理、建筑史、文化遗产或观看顺序历史结论。

本轮不覆盖用户未提交工作，不修改低保真归档，不宣称视觉获批。页面可在 `http://127.0.0.1:4173/module-a/a01/` 审阅。
