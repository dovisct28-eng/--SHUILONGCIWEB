# A05–A08 连续壁画观看廊：联合高保真候选

日期：2026-10-05。开发基线：`8d6517f5cb2303c3c875202fb13c45d91c4f6e63`。本轮用户联合任务替代旧A05–A08一般视觉描述；范围仅模块A的三幅整体导读及交接入口。字号、色值、88/86/82vh、文字分段窗口、4.5vw交接位移仍为**当前高保真候选 / 尚未视觉冻结**，技术验收不替代用户审图或用户体验研究。

## 本次实现

- A05：从A04实际第五幅四角投影连续展开。标题/副标题→原第1–2段→原第3–5段，正式巡视开始前全部文字和局部阅读遮罩退出。
- A06：统一组件、独立完整阅读及巡视；原谨慎文案未改，空间承托更弱。
- A07：标题/副标题→原第1–2段→第3段→第4–6段。取消暖反射，SCAN只保留弱章节和标尺；真实壁画为主体。
- A08：同一DOM图片、同一比例/尺寸/左端包围盒；右侧出现原交接文字、细线CTA及44px以上操作区域。保留主动进入现有模块B及浏览器返回。

总网页43个viewport、三章18–25/25–32/32–40屏均未延长。三个SCAN窗为21.2–24.4、28.2–31.4、35.2–39.4；各章最后0.6屏保持左端，三幅之间保留0.4屏短交叠并加轻微壁面位移。`horizontalPlacement()`保持右边缘起点、左边缘终点；位置直接随scroll position，无自动时钟、惯性、scroll snap或自动入B。

背景只在图片背后建立极弱上下照度及A05→A06→A07递减的暖反射；不加景观、实体展墙、灯具或效果图的AI图像。局部阅读遮罩按文字宽度计算，只向外增加必要渐隐区，SCAN为零。所有图片无滤镜、阴影和边框。章号13px、正文15–18px、宋体标题和黑体正文沿用本地字体。

## 原图和范围保护

[构建与散列证据](build-results.json)逐字节比对三幅真实display.webp与开发基线，SHA256相同；原图、母版、GLB、anchor、A01–A04源码、模块B与固定低保真Tag/分支未变。未使用detail.webp、AI壁画、修复、补画、调色或镜像。保留的是现有真实项目资源；本次不重新核定母版与display之间的历史裁切或现场墙位。

`visual-director/styles.css`只移除A05–A08旧覆盖，A01–A04样式规则不改。字体仅用原OFL素材补方向提示字与箭头，未加字族/文件；当前127,516 B，低于既有160 KiB预算。内容单元测试继续逐句核对原文、段落和显式换行。

## 验收与复现

启动A：项目根目录，`A01_PORT=4175 node module-a/a01/server.mjs`（PowerShell先设置环境变量）。启动B必须在`Mural-Exhibition`目录运行`node server.js`，现有相对public目录不接受从项目根目录启动。验收依赖使用现有捆绑Playwright/Sharp，经NODE_PATH设置访问，未安装新生产依赖。

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
node module-a/guide/boards.cjs
```

既有browser断言保留，仅同步本轮授权的SCAN采样窗，并修正A05测试中已过时的“第五幅”标题和A04跳过按钮名称。历史验收输出不覆盖；回归记录写入本目录`regression/`。全量测试在完整Windows权限下运行，107/107；受限环境最初因启动器Win32进程查询权限失败，未修改已有归档机制来规避断言。

[专项结果](gallery-results.json)覆盖1920×1080、1440×900、1366×768、1024×768的完整26个叙事采样点及hover/focus：正文分阶段可达且不溢出、SCAN无介绍/遮罩、右/中/左实际包围盒及标尺点、顺逆恢复、停滚稳定、A07→A08逐坐标相等、键盘入口、实际B页面与返回。另有六刷新点、十resize点、reduced-motion及阻断字体回退。resize允许不足一个整数scroll像素的归一化进度舍入，章节/阅读阶段保持，原尺寸恢复位置误差小于2px。A04投影专项仍按实际四角注册验证。

## 视觉审查 Q1–Q15

以下为设计实现和人工截图判断，不能当成用户研究结论；原尺寸及多阶段证据在`after/`，整屏缩略图只用于比较构图。

| 问题 | 判断与证据 |
| --- | --- |
| Q1 编号是否弱化 | 是。A05/A06/A07均13px，置于顶边负空间，非大数字。 |
| Q2 是否与壁画信息混淆 | 没有。使用A前缀及出庙/行进/归庙阶段，不作壁画项目编号。 |
| Q3 全部右→左 | 是。专项记录每幅右端right=viewport、左端left=0；标尺同向。 |
| Q4 没有镜像 | 是。正式显示仅正尺寸translate3d，原资源SHA256相同。 |
| Q5 A05长文分段 | 是。标题层加两正文层，所有五段保留。 |
| Q6 A07长文分段 | 是。标题层加三正文层，所有六段保留。 |
| Q7 无内部滚动条 | 是。正文层无overflow:auto，四桌面尺寸及字体回退均容纳。 |
| Q8 SCAN文字真正退出 | 是。介绍与遮罩computed opacity均为0，主标题不常驻。 |
| Q9 比80vh更有存在感 | 候选判断是。88/86vh与旧80/78vh实图并列；最终观感仍待用户审图。 |
| Q10 无悬浮卡片 | 是。图片阴影/边框及提示底板取消；大图直接嵌入连续暗场。 |
| Q11 同系统且权重递减 | 是。统一字体/尺度/标尺/阅读机制，暖反射/短线/提示在A06减弱、A07进一步退出。 |
| Q12 A07最安静 | 是。无暖反射或图片承托；巡视只留弱定位与方向，主体为原壁画。 |
| Q13 A08继承左端 | 是。A07终态、A08半态及稳定态DOM图片包围盒逐值相同。 |
| Q14 自主观看开始 | 是。标题/原交接文案/主动CTA，没有结束页或自动入B。 |
| Q15 原像素未改 | 是。三幅display字节SHA256与基线相同，素材目录diff为空。 |

## 性能与限制

[同机性能记录](performance.json)：1440×900、两个独立Chrome上下文，每组89个移动帧间隔；修改前中位数4.2ms/P95 8.2ms，修改后4.2ms/P95 8.3ms。渲染统计均66 geometries/24 textures/20 calls/37,202 triangles、单Canvas、post关闭。测量未直接计GPU耗时，不声明跨设备零成本；前版资源经route注入，传输字节不用于宣称下载速度提升。

生产代码未新增renderer、RAF、timer、WebGL pass、大纹理或外部依赖。A08不新增图片请求，三幅仍按接近章节请求；`detail.webp`为零。multi回归测得第一幅/第二幅跨模型与DOM两个资源上下文合计一次图像传输；第五幅沿用原投影与DOM缓存。新增内容只有少量DOM/CSS/状态计算和字体子集更新。

## 截图与展板

- [旧版四联](01-current-before.webp)
- [A05/A06/A07/A08四联](09-a05-a08-contact-sheet.webp)
- [四尺寸联合展板](10-responsive.webp)
- [分段阅读与巡视](11-reading-and-scan.webp)
- [交接与CTA焦点](12-entry-and-focus.webp)

展板取真实localhost整屏截图缩放排列，不裁改壁画、不修饰页面像素。独立的`before/`为修改前抓取，`after/`为本轮最终页面；`sample/`只保留迭代候选，不能代替最终验收图。既有回归产生的原始PNG保留在本地，仓库提交同名WebP及JSON/日志，避免重复加入114 MiB原始截图；运行上述检查可重建PNG。四尺寸专项分两批独立浏览器执行，合并结果保留两个原始报告及批次来源。后续Git提交与远程核实以该次交付的SHA及Git元数据为准。
