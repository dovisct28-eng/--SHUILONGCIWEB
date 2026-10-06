# A05–A08 二次重制：上方编辑带与完整壁画

日期：2026-10-06。目标分支 `master`。开发前重新 fetch，HEAD 与远程 master 均为 `ccd1481f134a3235af40dae467e498731811b1d5`。

本轮仅模块 A 的 A05–A08。任务开始时存在八个相关未提交文件；已先备份并在其原文/阅读分拍基础上继续完成。另有归档启动器、归档文档、素材删除和大量历史未跟踪文件，未修改、未纳入本次提交。`before/` 是任务开始时本地工作区的真实截图，性能对照中的 before 则是上述远程 commit 注入的代码，二者不能混同。

## 本轮授权与边界

1. A05–A08 低权重复用 A01 已有背景语言及资产，A01 不改。
2. INTRO 使用上方左标题/右说明的双列编辑带，无面板。
3. 阅读 veil 永久退出，不再裁掉左侧图像腾出文字区。
4. INTRO 使用完整真实壁画；先看整幅，再扩大进入巡视。
5. 正文退出后扩大并对齐右端，随后右端→中部→左端；反向按同一进度恢复。
6. 统一 chapter/headline/subtitle/lead/body/caption token，取消所有逐章字号覆盖。
7. A08 移除右侧渐变与裁切 aperture，文字在原图之外。
8. A08 允许固定左端和垂直中心缩小原图，覆盖旧“同尺度”视觉要求；同一个 DOM 图片、同 URL、同原比例，不重新请求。

这些是本轮明确授权；下述尺寸、时间窗、颜色与背景权重仍是高保真候选，不是永久冻结。真实壁画的母版、display、detail、GLB、anchor、模块 B、A01–A04 生产与测试源码均未改。历史文化文案逐字保留，不新增史料判断。

## 实现文件

- `module-a/guide/controller.mjs`：统一双列 header、完整图像 canvas、底部细标尺；说明分拍和标题透明度；投影目标与图片状态接管。
- `module-a/guide/progress.mjs`：INTRO/SCAN 两套 geometry、文字退出与放大窗口、左锚点 A08 重排、连续背景权重；继续用实际渲染宽度计算 horizontalPlacement。
- `module-a/guide/styles.css`：共享 tokens、无遮罩版式、细线标尺、四尺寸与短屏安全区。
- `module-a/guide/ambient.mjs`：唯一 shared ambient DOM，A05 在现有 render 中更新；无新 RAF/timer/renderer。
- `module-a/a05/content.mjs`、`a06/content.mjs`、`a07/content.mjs`：原文索引化分拍，保留现有本地分组与 A07 较长 INTRO；调整 A05 断行，不改字词。
- `module-a/a08/controller.mjs`、`progress.mjs`、`styles.css`：透明入口层，图像收束后文字淡入，保留 localhost:3000 主动入口、44px 点击区及键盘焦点。
- 相关单元/浏览器/构建/性能脚本、HIFI/DESIGN/CONTENT_MAP 与四章文档同步。

## 状态与阅读节奏

总网页仍 43 个 viewport；章节仍 A05 18–25、A06 25–32、A07 32–40、A08 40–42.1。无自动时间线、滚动锁、scroll snap、内层正文滚动或惯性库。

| 章节 | Opening 后的原文分拍 | 文字退出 | 全幅扩大 | 右→左 SCAN |
| --- | --- | --- | --- | --- |
| A05 | [2,2,1]：所谓出兵入将＋过程／第五幅开端＋队伍／从这里开始 | 20.65–20.8 | 20.8–21.2 | 21.2–24.4 |
| A06 | [1,1,1]：队伍向前／中间叙事位置／继续走向归程 | 27.65–27.8 | 27.8–28.2 | 28.2–31.4 |
| A07 | [2,1,1,1,1]：归庙与入将／队伍返回／出兵入将相连／一边出发一边归来／两侧壁画收束 | 35.65–35.8 | 35.8–36.2 | 36.2–39.4 |

A07 保留任务开始时已有的 4.2 屏 INTRO，以单独 Lead 强调核心视觉句，同时容纳最后完整原文；未把后三段挤在一个长文层。每章有稳定 Opening，右列为空；后续标题 opacity=.46，副标题=.40，chapter=.72，字号不变。阅读层交叉淡化，位移不超过10px；reduced-motion 取消文字位移。

扩大过程中所有说明已退出；SCAN 保持桌面88vh、≤1100宽86vh、reduced-motion82vh。原生滚动停止时位置固定。A05→A06 与 A06→A07 沿用0.4屏短交叠。

### 真实素材比例与 INTRO geometry

编辑带顶部48px（≤800高32px，≤700高26px），桌面高216px，左右5vw；列宽40vw＋余量、间距9vw，≤1100宽改43vw与5vw间距。图像区在编辑带以下24px到视口底部84px之间，原图居中，以视口宽度减两侧40–52px为首选，并以60vh及实际可用高度为上限。

1440×900 实测宽度均1344px：第五幅约362.2px高、第一幅462px高、第二幅304px高。参考图的画幅比例不能覆盖真实原图；60vh是上限，不能靠拉伸或裁切强制达到。三幅完整内容可见，左右距相等。

### 统一 Typography Token

| 角色 | CSS 候选 | 1440px 实际值 |
| --- | --- | --- |
| chapter | 13px / 1.5，字距.12em | 13px |
| headline | clamp(42px,3.4vw,56px) / 1.16，字距.035em | 48.96px |
| subtitle | clamp(16px,1.25vw,18px) / 1.6 | 18px |
| lead | clamp(20px,1.65vw,24px) / 1.6 | 23.76px |
| body | clamp(15px,1.08vw,17px) / 1.8 | 15.552px |
| caption | 13px / 1.5 | 13px |
| CTA | 18px，最小44px操作高度 | 18px |

标题继续本地 Narrative Serif 500，正文/Lead/功能信息为本地 Narrative Sans 400；现有宋体子集未覆盖全篇正文，因此 Lead 不强行切成宋体而触发逐字fallback。未新增字体/字重/文件。1024三章同字号；≤760的可达降级使用同一组统一小屏token，不改变单章字号。

### 背景

只创建一个 `.gallery-ambient`；复用 A01 的 `.ink-landscape`、`.ink-sky`、`.ink-valley` CSS 语言及同一个 `shuilong-temple/environment-assets/a01-v3/karst-valley.webp` URL。两个 sky/valley DOM 使用同一缓存资源，不是四章四套图片。固定位置，无 parallax reset、云雾运动或新 WebGL 环境。A01 代码和资产均不修改。

背景 field opacity 为 `.24 × weight`；weight 在25–25.4由1到.8，在32–32.4由.8到.65，A08保持.65，即候选 .24/.192/.156/.156。只表示合成参数，不冒充可测的视觉权重比例。复用的暗部、天空/山谷明度位于真实壁画后方，图片本身 filter:none、border:0、box-shadow:none，无覆盖渐变。

### A04 接管与 A08 留白

A04 原路线/相机/45秒自动播放/剖切不改。17.4–18沿原第五幅四角投影过渡，`muralTransfer()`改接 INTRO 的居中完整矩形；18屏与后续 INTRO 的 x/y/width/height 一致。旧数字形式目标仍兼容，新的 geometry 目标由单元测试和浏览器投影检查约束。逆向恢复实际四角及原模型壁画材质。

A07 至39.4到达左端，保持至40；40–40.65固定 left=0、centerY=height/2，将同一图像的宽度收至70vw。40.65–41文字淡入，避免缩小中的原图穿过文字；41后稳定。CTA hover/active/focus-visible保持，隐藏/淡入早段不可聚焦。

**这是明显的尺度收束，不是轻微缩小。** 第二幅6000×1357，在1440×900中70vw=1008px，对应高228px≈25.3vh；相对SCAN的792px高约为28.8%。要同时保持74vh和完整70vw会破坏原比例。本轮采用任务书允许的68–74vw方案，形成约30vw真实背景，既不裁切也不遮图。技术实现满足原图保护与留白，但最终构图偏好仍待用户审图。

## 验收与证据

主视觉截图：`after/*-1440x900.webp`。包含A05 Opening/三说明拍/right/center/left，A06 Opening/三说明拍/right/center/left，A07 Opening/五说明拍/right/center/left，以及各章扩大半程、A08收束50%、40.5屏、文字半态、稳定、hover、focus。

- `before/`：本地任务开始前9张截图。
- `after/`：1440×900核心关键帧。
- `responsive/`：1920×1080、1366×768、1024×768，以及短屏650高、reduced-motion、字体失败。
- `comparison/before-after.webp`：同一视口前后并列。
- `comparison/editorial-and-scan.webp`：阅读→巡视→交接总览。
- `gallery-results.json`：完整DOM几何、字号、阅读层、正反恢复、7刷新点、10 resize点、原生滚轮及实际B返回。
- `regression/`：既有八组回归；PNG为本地原始证据，提交同名WebP与结果/日志，防止重复大型截图。
- `build-results.json`：语法检查、保护目录diff、真实display字节SHA256、固定归档引用。
- `performance.json`：同机远程基线/本轮的两独立上下文采样，不是跨设备性能保证。

运行：先按原方式启动A（4175）和B（从Mural-Exhibition目录启动3000）。Playwright/Sharp来自Codex已有运行时NODE_PATH，不增加生产依赖。

```text
node --test
node module-a/guide/build-check.cjs
node module-a/guide/regression.cjs a05
node module-a/guide/regression.cjs a06
node module-a/guide/regression.cjs a07
node module-a/guide/regression.cjs a08
node module-a/guide/regression.cjs multi
node module-a/guide/regression.cjs resilience
node module-a/guide/regression.cjs transfer
node module-a/guide/regression.cjs director
node module-a/guide/gallery-check.cjs
node module-a/guide/performance-check.cjs
```

## 人工视觉审查

本表是代码/截图审查判断，不等于用户研究或最终视觉冻结。

| 维度 | 审查结论与依据 |
| --- | --- |
| Typography | 三章chapter、headline、subtitle、body、lead共用token；A07未缩小标题。Opening与说明拍仅透明度变更。 |
| Composition | 双列文字全部在上，真实壁画在下；没有左侧纵栏、黑矩形或卡片；宽高比形成的留白保留。 |
| Background | 同一弱A01环境延续，静态且退后，无新生成云纹/山水，不恢复建筑Hero；原图亮度与细节明显高于背景。 |
| Mural | INTRO左右内容完整，SCAN扩大后逐端可达；图像原色/残损保留，不镜像、不滤镜、无遮罩。 |
| A08 | 左锚点连续，真实右侧背景，图像收束之后才出现文字，CTA以文字/细线承载；原图很宽，完整留白方案的图像高度较低，已明确记录。 |
| 短屏 | 压缩上边距与段距，正文未缩到15px以下；标尺不裁切，文字不进入图像区，无内部滚动条。 |
| reduced-motion | 取消阅读层位移，沿用82vh巡视；所有原文、完整三幅、两端、A08入口可达，仍为用户滚动驱动。 |

具体执行结果在下方验收汇总补记；没有结果文件的检查不视为完成。最终Git SHA、push与远程核实以交付回复及Git元数据为准。

## 最终执行结果

- 完整 `node --test`：109 / 109通过，0失败；原有归档启动器测试需要本机进程查询权限，已在完整权限环境执行通过。
- native build / syntax检查通过；项目没有bundler，不以空构建代替语法及原生模块浏览器运行检查。A01–A04、模块B、模型与原始壁画资产diff为空；三幅display的SHA256与基线完全一致；两个低保真归档引用仍指向固定48f2724。
- 八组原有浏览器回归全部通过：a05、a06、a07、a08、multi、resilience、transfer、director。A04实际路线依次第五幅→第一幅→第二幅，回撤/完整路线/交接及反向恢复通过。
- 新编辑带浏览器验收：1440×900、1920×1080、1366×768、1024×768各32场景，以及1440×650短屏、字体加载失败、reduced-motion全部通过。另测正反向逐点、停止滚动、7个reload点、10个resize点、原生滚轮、CTA hover/focus、真实B进入与浏览器返回。
- 同机Chrome headless、1440×900、两独立上下文、各89个滚动帧间隔：远程基线median 4.2ms / P95 8.4ms；本轮median 4.2ms / P95 4.3ms。一次采样只说明该运行未出现明显回退，不据此宣称跨设备提升，也不是GPU耗时。
- GPU比较先等待建筑材质克隆完成，再在测量结束后回到同一可见A04完成总览：前后都是66 geometry、22 texture、56 draw call、83578 triangle；单canvas、后处理关闭。初次直接读取被HTML遮挡iframe中的计数存在初始化/绘制时机差异，已保留诊断日志并修正为同状态比较，未删除相等断言。
- 背景资源encoded 102818字节、transfer 103118字节，仅一次实际下载；三章不请求detail；A08为同一DOM图片，第二幅resource entry仍1，首屏叙事字体transfer为0。
- 自动化结果与人工已看截图一致。A08完整原图较扁、尺度收束明显，是保持6000×1357比例与约30vw真实留白的结果，仍作为用户审图候选。

本次提交只含上列模块A实现/相关测试、七份章节/规范文档及本轮验证目录中WebP/JSON/Markdown/文本证据；原始PNG保留在本地。任务开始前无关修改不暂存、不提交。
