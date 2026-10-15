# Skill 实际使用记录

2026-10-15。

## 主要制作 Skill

`pptx`，用户安装的 `anthropics/skills`，完整入口：

`C:/Users/dovis/.agents/skills/pptx/SKILL.md`

实际使用：PptxGenJS 创建 PPTX、预先设定 16:9 画布、宋体/黑体明确字体、文本零内边距、原生文字/形状/箭头、独立演讲者备注、逐页渲染检查、发现问题后修订、实际运行 `scripts/office/validate.py`。最终结果为 `All validations PASSED!`。没有只读取 Skill 而跳过它的工作流。

读取了 Skill 的完整说明及 `scripts/office/validate.py`、相关验证模块和 `scripts/thumbnail.py` 的依赖说明。缩略图脚本依赖本机不存在的 LibreOffice，因此总览改用实际 PPTX 渲染结果经 Sharp 合成，没有谎称运行该缩略图脚本。

## 补充质量工具

`presentations:Presentations`：

`C:/Users/dovis/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations/SKILL.md`

读取完整 Skill、`references/implementation.md`、`references/finalization.md`、`artifact_tool_docs/API_QUICK_START.md` 及相关 API 说明。主要 authoring 采用用户明确指出的 anthropics PPT Skill；这里实际使用 `@oai/artifact-tool` 的 PPTX 导入和 PNG 渲染，以及 `finalizePresentation` 的包完整性、布局、字体与可导入性检查。没有声称用 Artifact Tool 从头编写全部幻灯片。

`pdf:pdf`：

`C:/Users/dovis/.codex/plugins/cache/openai-primary-runtime/pdf/26.1013.11914/skills/pdf/SKILL.md`

读取完整 Skill，实际使用 ReportLab 组装静态 PDF、pypdf 清理元数据、PDFium 逐页回渲。Poppler / PowerPoint / LibreOffice 未使用，不冒充已经在这些工具中验收。

PPT 与 PDF 的 artifact-operation 标记脚本分别按各自格式在首次创建前执行一次。

## 环境与故障处理

- 经 `load_workspace_dependencies` 定位捆绑 Node、Python 和模块。
- PptxGenJS 4.0.1，Sharp 0.35.5，Artifact Tool 2.8.94。
- 本机字体 SimSun、Microsoft YaHei 均存在。候选色和字体用于本次 PPT，不反向冻结网页视觉规范。
- 官方 defusedxml 依赖置于本目录忽略的 local 内，未修改技能和共享运行时。
- 直接 PDF 导出报缺少 `#standard-fonts/Helvetica`，因此改用无损图像 PDF。该 PDF 为预览；PPTX 保留编辑性。
- 独立验证发现 PptxGenJS 多余的 master 内容类型声明，已在生成器加载时修正；最终复查为零结构与布局发现、零警告。
