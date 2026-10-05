# A01 / A02 / A05–A07 纯文案更新验收

日期：2026-10-05。基线：`master` / `origin/master` 在开始时 fetch 后均为 `e2ecdd6f39d6f0043549497db491012a6ca12770`。

## 修改与边界

- 逐字采用用户提供的地点、章节标识、标题、副标题、正文、巡视标记和末端提示。A06/A07 中显式换行保留；正文空行保留为段落。
- A01 更新正文和滚动提示；A02 更新标题、两段正文、初始/五幅/三幅状态、末端提示及三级说明。初始阶段不额外显示旧的滚动提示。
- A05–A07 原来源说明不再上屏，其位置用于副标题；章节标识和巡视标记直接使用定稿字段。旧研究记录仍留在内容地图的历史/内部资料层，没有改写史料。
- 三幅介绍使用同一行宽和最小文字区高度，保留原来的 `top:50%`、左侧位置及居中方式，避免段落长短令标题跳动。窄屏仅调整文字宽度、字号、行高、段距；A02 两段文字使用独立行和小段距，避免挤到模型标签。
- 为新字补齐原 Noto 字体子集，沿用字族、字重、授权、注册时机和 fallback。A01 两个文件合计 50,208 B（原 60,452 B）；A02–A08 两个文件合计 128,948 B（原 132,164 B），均在原预算内。共享字体更新只是字符覆盖，未改 A03/A04/A08 的文案或视觉规则。
- `shuilong-temple/`、模型/anchor/材质/镜头、真实壁画、A03/A04/A08、模块 B、进度函数、图像加载/巡视机制和低保真归档引用未改。
- 本轮是用户定稿的实现，不是新的史料核实。A06 没有新增人物、仪仗、具体神灵行为或事件解释。

## 自动检查

1. `node --test module-a/copy.test.mjs module-a/a01/progress.test.mjs module-a/a01/fonts.test.mjs module-a/a01/visual-integration.test.mjs module-a/a02/progress.test.mjs module-a/a02/spatial.test.mjs module-a/guide/progress.test.mjs module-a/visual-director/fonts.test.mjs module-a/a04/state.test.mjs module-a/a08/progress.test.mjs`：33/33 通过。
2. `node module-a/copy-browser-check.cjs`：七尺寸全部通过；逐页检查 A01→A02→A05→A06→A07。正文和标点逐字比对，文字实际行框均在容器/视口内，无横向溢出。三幅文字区起点、行宽一致；右端→左端、停止/反向、固定图像尺度、A07→A08 继承、resize、刷新、reduced-motion 通过。[结构化结果](results.json)。
3. `node module-a/guide/multi-guide-check.cjs`：快速跨章/反向/resize、单幅图片失败、模型纹理失败、reduced-motion 和缓存复用通过，`detail.webp` 请求为零。[本轮回归结果副本](guide-regression-results.json)。
4. 扫描态标记实际可见，三幅末端提示实际可见且未溢出。[标记结果](marker-results.json)。
5. 静态原生 HTML/CSS/ES module 项目没有独立打包步骤；执行修改相关七个 JS 文件的语法检查并在 localhost 实际加载。模型构建器没有运行，保护目录的 Git diff 为空；归档 Tag/分支均仍为固定 `48f272497e86e4549c5bcd0dee275ff347171a3f`。[构建与保护检查](build-results.json)。
6. 两组 manifest/预算/散列检查及四个实际字体 cmap 检查通过。[实际字形覆盖](font-results.json)。

浏览器为本机 Chrome headless，使用现有 `http://127.0.0.1:4175/module-a/a01/`。应用 `pageerror`、console error、4xx/5xx 检查通过；验收脚本对既有服务器缺失的 favicon 返回空响应，避免将浏览器图标的既有 404 混入应用错误。这个处理只在测试中，不改产品页面。

## 截图与人工复核

联系表每行从左至右均为 A01、A02 核心三幅状态、A05、A06、A07。原尺寸 PNG 留在本地同目录，Git 提交联系表、提示截图与 JSON，避免重复大图。

| 尺寸 | 五页联系表 |
| --- | --- |
| 1920×1080 | [查看](review-1920x1080.webp) |
| 1440×900 | [查看](review-1440x900.webp) |
| 1366×768 | [查看](review-1366x768.webp) |
| 1024×768 | [查看](review-1024x768.webp) |
| 760×900 | [查看](review-760x900.webp) |
| 390×844 | [查看](review-390x844.webp) |
| 390×667 | [查看](review-390x667.webp) |

末端提示：[A05](a05-handoff-1440x900.webp)、[A06](a06-handoff-1440x900.webp)、[A07](a07-handoff-1440x900.webp)。

人工复核确认标题和正文完整，A02 文字未新增明显遮挡，三幅保持同组排版；介绍态沿用原阅读遮罩，巡视态正文及遮罩完全退出。本轮不调整窄屏模型原有裁切/镜头，也不宣称模块 A 已成为完整移动端设计。未做其他浏览器/实体设备验证。

工作区原有归档启动脚本、归档说明、归档测试及两个插画删除等用户改动均未纳入本次提交。提交 SHA 和远程同步结果以 Git 元数据和交付回复为准。
