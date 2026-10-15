# 《出兵 · 入将》E 类参赛 PPT

2026-10-15。独立 PPT 制作任务，采用完整 12 页，16:9。基准 `1374d3c25be6d62c44abbbf63bb4f8618d614503` 在制作开始及交付前均通过远程 `master` 查询核实。本目录之外的业务、素材、视频和用户未提交改动没有纳入本次修改。

## 成品

- `output/chubing-rujiang-e-category.pptx`：12 页，标题、说明及流程图是原生可编辑元素，截图与壁画为可替换图片。
- `output/chubing-rujiang-e-category.pdf`：12 页静态图像预览，与逐页 PNG 完全一致，文字不可选择。
- `preview/slides/slide-01.png` 至 `slide-12.png`：1920×1080 逐页预览。
- `preview/contact-sheet.png`：12 页总览。
- `source/`：制作、采集、渲染、PDF 组装及验收脚本。
- `content/`：逐页内容、文案与素材清单。
- `qa/`：Skill、内容、视觉及文件验证记录。

最终 PPTX、PDF、完整逐页图和派生素材本地保留并忽略，不作为普通 Git 的重复二进制归档。Git 只保存源文件、文案、来源、报告、总览与 P01/P05/P09 三张精选。同步结果及本次提交 SHA 以本次交付消息和 `local/git-delivery.json` 为准。不要将内部制作记录作为匿名参赛正文提交。

## 验证范围

PPTX 已运行 `anthropics/skills` 的 Office XML 验证器、额外包完整性与布局验证器，并将最终 PPTX 实际导入独立渲染器检查全部 12 页。未在 Microsoft PowerPoint 或 LibreOffice 中打开；不能据此宣称完成 PowerPoint 原生应用验收。字体为本机存在的 SimSun 与 Microsoft YaHei，未向 PPTX 嵌入字体，其他机器应安装对应字体或使用 PDF。

PDF 采用最终 PPTX 渲染图无损组装。直接 PDF 导出器缺少内部 Helvetica 依赖，未掩盖该失败；替代 PDF 的 12 页均经 PDFium 回渲，与对应 PNG 逐像素一致。

素材参赛使用许可仍待核实。体感页明确注明预设流程动画，物理摄像头验收待完成。没有以数字色稿代替文物原色，或以模型代替测绘认证。

## 本机复现

在仓库根目录执行。Node/Python 为 Codex 捆绑运行时，不修改它的依赖。也可设置 `PPT_NODE_MODULES`、`PPT_PYTHON`、`PRESENTATIONS_SKILL` 指向等价的已安装位置。需要原始项目素材及本机现存的最终 V4 视频，当前网页采集使用已安装 Chrome，不需要摄像头。

```powershell
$pptNode='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$pptPython='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
& $pptNode promo-video/ppt/source/capture.cjs
& $pptNode promo-video/ppt/source/prepare-assets.cjs
& $pptNode promo-video/ppt/source/build.cjs
```

正式制作前曾先执行 `build.cjs --benchmarks`，单独检查 P01/P05/P09，再制作全稿。下列修订输出应使用新的文件名，最终器拒绝覆盖已有成品。

```powershell
& $pptNode promo-video/ppt/source/finalize.mjs promo-video/ppt/output/review-r2.pptx
& $pptNode promo-video/ppt/source/render.mjs promo-video/ppt/output/review-r2.pptx promo-video/ppt/preview/slides
& $pptPython promo-video/ppt/source/pdf-preview.py promo-video/ppt/output/review-r2.pdf
& $pptNode promo-video/ppt/source/contact.cjs
```

初次默认输出文件名为 `chubing-rujiang-e-category.pptx/.pdf`，不带修订参数即可。生成器保留原始素材，只对用于嵌入的副本等比降采样，并采用 JPEG 97 / 4:4:4 或透明 PNG；不放大、镜像、调色或修复。图像裁切/尺寸记录保存在 `content/asset-manifest.*` 和本机 `local/geometry.json`。

```powershell
$env:PYTHONUTF8='1'
& $pptPython promo-video/ppt/source/package.test.py
$env:PYTHONPATH=(Resolve-Path promo-video/ppt/local/defusedxml-dependency).Path
& $pptPython C:/Users/dovis/.agents/skills/pptx/scripts/office/validate.py promo-video/ppt/output/chubing-rujiang-e-category.pptx
```

`package.test.py` 针对本次默认交付文件核验 9 项验收。Skill 验证器需要 `defusedxml`：本机因 PyPI TLS 失败，从官方 `tiran/defusedxml` 取得依赖置于忽略的 `local/defusedxml-dependency/`。UTF-8 模式避免 Windows 默认 GBK 误读中文 XML。验证器、原始 PPT Skill 和捆绑依赖均未修改。

`source/reproduce-check.py` 已验证源码重新生成包与正式成品的全部幻灯片和媒体部件逐字节一致，唯一差异为构建时间。文件整体SHA可因时间戳变化，不应把此类差异误当页面变化。

PptxGenJS 4.0.1 的内容类型生成器多声明了未创建的 slideMaster2–12；`runtime.cjs` 只在内存修正该生成逻辑，未手工修补成品 ZIP，也未改写共享库。该问题经独立包检查发现并修正后，最终包的完整性与布局检查均为零发现、零警告。
