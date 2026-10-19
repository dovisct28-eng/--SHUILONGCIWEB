# PPT 设计演进增补 V4 验收

2026-10-19。范围仅为 PPT 的 3 页增补与配套交付，不改 Web 业务代码。

## 结果

- 15 页，新增第 5–7 页：Figma 草稿规划、低保真验证、当前界面。
- 9 项交付测试通过，包含源文件 SHA256、原 12 页除页码以外内容一致、原图片/图片关系字节一致、顺序与尺寸、独立可编辑对象、引用、关系完整性、XML/CRC 和母版约束。
- PPTX 技能 Office 校验最终输出 `All validations PASSED!`。制作中修正了新增母版/布局编号冲突、多个备注母版和未引用主题问题；最终文件不含这些新增错误。
- Artifact Tool 对最终包的结构、字体、页数和实际导入检查通过。12 项连接线层级警告均对应原有页面，新第 5–7 页无此警告；原页面按用户手工稿保留。自动警告不是新增布局问题的证据。
- 全部 15 页渲染已逐页检查；新增三页重点核对来源、文字层级、完整配图、页码、边界和衔接。初版过长标题已精简。
- 修正包结构后重新渲染新三页，PNG 的 SHA256 与先前完整渲染对应页一致，说明结构修正没有改变页面视觉。PDF 对应同一组 15 页。
- PDF 为 15 页图像预览；Poppler 重新渲染第 5–7 页检查。PPTX 保留可编辑内容。未在原生 PowerPoint 打开，未进行现场摄像头或用户研究验证。

## 精选截图

| 文件 | 内容 | 尺寸 |
|---|---|---|
| `selected/slide-05.webp` | 原 Figma 草稿及演进说明 | 1920 × 1080 |
| `selected/slide-06.webp` | 真实低保真阶段截图 | 1920 × 1080 |
| `selected/slide-07.webp` | 已实现界面阶段截图 | 1920 × 1080 |

共 3 张，1,009,016 字节，采用无损 WebP。全部 15 页和原稿对照、首次失败记录、修正后截图、PDF 渲染保存在 `promo-video/ppt/revision-v4/local/`，不提交重复图像。

## 文件与记录

- 交付目录：`promo-video/ppt/revision-v4/output/`。
- 校验记录：`promo-video/ppt/revision-v4/qa/acceptance.txt`、`office-validation.txt`、`presentation-validation.json`。
- 输出/截图哈希与大小：`qa/delivery-manifest.json`。
- 素材来源：`qa/asset-provenance.json`。Figma 导出日期为本次日期，低保真和当前界面配图均为已有阶段留档，不冒充本次 Web 重测。

原 V3 SHA256 仍为 `eface3ee8eddefc46ab3a6ae683b9727cd70a9fbdd39e033a4c8eecf15fabdc6`。归档 Tag、归档分支、壁画母版和用户已有未提交工作未改动。
