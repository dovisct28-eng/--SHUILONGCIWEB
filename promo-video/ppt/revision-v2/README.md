# 视觉修订稿 V2

2026-10-15。在保留12页内容框架的基础上，重排图像、文字与说明的关系。旧版完整保留，本轮不覆盖旧成品，不改网页业务、模型、壁画母版、视频或体感代码。视觉修订是否达到参赛期待，仍由用户结合实际投影与阅读判断；文件检查通过不等于设计已获用户接受。

## 本机交付

- `output/chubing-rujiang-e-category-v2.pptx`：12页可编辑主稿。
- `output/chubing-rujiang-e-category-v2.pdf`：12页静态图像预览，文字不可选择。
- `preview/slides/`：1920×1080逐页预览。
- `preview/contact-sheet.png`：12页总览。
- `preview/comparison.png`：左V1、右V2，比较封面、建筑页、体感页。
- `source/`：生成、真实模型导出、渲染、PDF及验收脚本。
- `content/`：从最终PPTX提取的原生文字和素材哈希。
- `qa/`：文件检查、PDF回渲与精选证据。

完整PPTX、PDF、派生素材和12页PNG在本地保留并忽略。Git只保存源代码、文案、记录、总览、对照图及3张精选。不要把含内部路径的制作记录作为匿名参赛正文提交。

## 视觉组织

以“逐步走近壁画”为全稿组织线索：建筑空间→壁面长卷→人物图像→交互反馈。每页使用与内容相符的图像尺度；标题说明本页要表达的判断，配文承担解释和边界。背景、字体、页面标识与基准边距保持统一，图像不机械套用同一矩形模板。

| 页 | 主要视觉任务 |
|---|---|
| 01 | 用真实壁画局部与全幅的尺度关系形成封面 |
| 02 | 壁画与建筑说明“从文化对象到设计问题” |
| 03 | 建筑、壁面、人物递进，展示观看尺度变化 |
| 04 | 三组前导旅程进入两种自主探索入口 |
| 05 | 将真实模型从环境画面中独立出来，原生标注壁面位置 |
| 06 | 三幅壁画按数字路线逐行推进，第二幅占更大画幅 |
| 07 | 全景为主体，人物档案作为关联展开 |
| 08 | 同一人物、同一裁切、相同尺度对照三种图像层次 |
| 09 | 人物成为中心，真实驻留目标与简介界面解释操作 |
| 10 | 将六步输入链展开，强调驻留确认环节 |
| 11 | 时长与六段真实分镜形成制作证据 |
| 12 | 用完整壁画收束，以三条短句回答价值 |

线条用于表达关系与指向。没有新增生成壁画、人物修复、镜像、原色变化、装饰性光效或虚构数据。模型仍来自项目当前Three.js场景；只在浏览器导出帧中隐藏外围环境及地面。P05壁面位置采用项目坐标投影，部分被屋顶遮挡，页面已说明。

## 制作与复现

主要工作流继续使用用户安装的 `anthropics/skills` 的 `pptx`：`C:/Users/dovis/.agents/skills/pptx/SKILL.md`。采用PptxGenJS原生文字和形状，逐页实际导入渲染，发现问题后修订，再运行该Skill的Office验证脚本。补充工具及依赖处理沿用上一级`qa/skill-usage.md`，本轮未更改共享依赖。

先执行上一级`source/prepare-assets.cjs`准备已有真实素材；网页B02实际采集与模型原文件沿用已存在项目。V2依赖上一级运行时与素材目录，不是脱离工程独立运行的模板。

```powershell
$pptNode='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$pptPython='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
& $pptNode promo-video/ppt/revision-v2/source/capture-model.cjs
& $pptNode promo-video/ppt/revision-v2/source/build.cjs
& $pptNode promo-video/ppt/revision-v2/source/finalize.mjs
& $pptNode promo-video/ppt/revision-v2/source/render.mjs promo-video/ppt/revision-v2/output/chubing-rujiang-e-category-v2.pptx
& $pptPython promo-video/ppt/revision-v2/source/pdf-preview.py
& $pptNode promo-video/ppt/revision-v2/source/contact.cjs
& $pptNode promo-video/ppt/revision-v2/source/comparison.cjs
& $pptPython promo-video/ppt/revision-v2/source/documentation.py
$env:PYTHONUTF8='1'
& $pptPython promo-video/ppt/revision-v2/source/package.test.py
$env:PYTHONPATH=(Resolve-Path promo-video/ppt/local/defusedxml-dependency).Path
& $pptPython C:/Users/dovis/.agents/skills/pptx/scripts/office/validate.py promo-video/ppt/revision-v2/output/chubing-rujiang-e-category-v2.pptx
```

成品和finalizer验收凭证拒绝覆盖；再次正式生成应使用新目录或新文件名保留旧稿。`build.cjs --benchmarks`先生成P01/P05/P09局部验证稿。渲染器可用第4参数限定变化页。

## 验证边界

最终原生文件经过两套结构检查、匿名与可编辑性检查及全部12页独立渲染。字体使用SimSun、Microsoft YaHei，未嵌入字体。当前无PowerPoint/LibreOffice可执行程序，因此没有原生应用打开验收。PDF为最终PPTX渲染图无损组装，经PDFium回渲核对。体感截图仍为既有预设流程动画，不证明现场摄像头识别效果；素材参赛使用许可仍待权利人核实。

Git基准为V1交付提交`d546ef3e4685e3db551dec73a5c65022ce46ce47`。本轮源文件提交及远程同步结果以交付消息和本机`local/git-delivery.json`为准。
