# 设计演进增补版 V4

2026-10-19。在用户现有的 V3 手工编辑稿上新增 3 页，总计 15 页。新增内容放在“完整体验流程”之后，原功能展示继续排列在后。

| 页码 | 内容 | 展示目的 |
|---|---|---|
| 05 | Figma 草稿规划 | 建筑构图、空间路线讨论、探索交接的早期方案 |
| 06 | 低保真验证 | 用可运行原型验证滚动节奏、阅读区间和壁画位置认知 |
| 07 | 当前界面 | 对照已实现的建筑开场与真实壁画导读，说明视觉完善 |

## 交付

- `output/出兵·入将-设计演进增补版V4.pptx`：可编辑 PPT。新增标题、说明、页码为独立文字对象，配图可单独替换。
- `output/出兵·入将-设计演进增补版V4-预览.pdf`：15 页静态图像预览，供浏览核对；编辑使用 PPTX。
- `source/`：增补页生成、合并、验证与预览脚本。
- `assets/`：原 Figma 导出及项目阶段截图，来源另见 `qa/asset-provenance.json`。
- `qa/`：自动检查和交付清单。
- 精选三页截图见 `docs/validation/ppt-design-evolution-v4/selected/`。完整 15 页渲染和排错产物保存在本目录忽略的 `local/`。

遵循现有 `promo-video/.gitignore` 与 `promo-video/ppt/.gitignore`：PPT/PDF 成品、过程素材保留本地；Git 提交生成源、来源清单、验收记录和精选截图，不将大型成品与素材副本重复上传。

## 原稿与资料边界

本次输入是用户现有文件 `revision-v3/output/出兵·入将-独立阅读评审版V3.pptx`，SHA256 为 `eface3ee8eddefc46ab3a6ae683b9727cd70a9fbdd39e033a4c8eecf15fabdc6`，没有覆盖或从旧生成脚本重建。原 12 页正文、图片、图片关系保持，只有原第 5–12 页的页码加 3。

原始 Figma 文件：[早期草稿与后续分镜](https://www.figma.com/design/1oSGGtdcJY92KlzOdhLEpJ/Untitled)。本次直接取回画板 `14:7`、`25:7`、`14:38`，没有重新绘制假草稿。早期“自动旋转”、章节分配等方案与当前实现有变化，新增页已明确说明演进；不把旧注释当作当前规格或已证实史实。

低保真页使用当时真实验收截图，不声称截图逐像素等同最后冻结基线。最终低保真归档仍为 `48f272497e86e4549c5bcd0dee275ff347171a3f`，其 Tag、分支和工作区未改动。当前界面页采用项目已有实现阶段截图，不构成摄像头实测或未决功能的最终验收。

## 制作与验证说明

使用已安装 `pptx`、`Presentations`、`pdf` 技能。增补页由 Artifact Tool 生成，PPTX 技能 `add_slide.py` 完成插页注册，再合并独立媒体、母版和备注。保留现有 PowerPoint 内容，避免整体导入导出造成手工编辑丢失。

运行依赖由 Codex `load_workspace_dependencies` 提供；本次所用 Node/Python 和包路径记录在 `qa/presentation-validation.json`。本地 `local/node_modules` 指向该运行库；缺失的 `defusedxml` 仅放在 `local/pydeps`，没有改动运行库或站点依赖。Office 校验需设置 `PYTHONUTF8=1`、`PYTHONPATH=local/pydeps`。制作入口依次为 `build-additions.mjs`、`merge-deck.py`、`finalize.mjs`；完整渲染由 `render-deck.mjs` 完成，PDF 图像预览由 `make-preview.py` 生成。

本轮只编辑 PPT 及其支持文件，没有修改模块 A/B 代码、壁画母版或历史验收资料。没有在原生 PowerPoint 中打开检查，不能以程序导入/渲染代替原生软件验收。
