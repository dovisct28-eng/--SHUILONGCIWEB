# V3 独立阅读评审版

2026-10-16。针对没有现场宣讲、评委自行阅读的场景，直接修改用户本机实际 V2 PPTX 的原生文字与少量位置。保留 12 页、深色视觉和全部原始媒体；不覆盖 V1/V2，不修改网站、壁画母版或视频。不是对网页视觉的重新打样。

## 交付

- `output/出兵·入将-独立阅读评审版V3.pptx`：可编辑主稿。
- `output/出兵·入将-独立阅读评审版V3.pdf`：静态阅读预览，文字不可选。
- `preview/contact-sheet.png`：12 页总览；逐页 1920×1080 PNG 在 `preview/slides/`。
- `content/slide-copy.md`：从实际 V3 提取的正文；`change-log.json`：逐条修改；`baseline.json`：实际 V2 的路径与哈希。
- `qa/`：结构、版面、PDF 和内容检查；精选截图见仓库 `docs/validation/ppt-self-reading-v3/selected/`。

成品 PPTX/PDF 和整批 PNG 延续既有本地交付规则，不进 Git；源文件、正文、总览、精选与验收记录进 Git。完整历史版本保留。

## 阅读主线

| 页 | 读者应获得的信息 |
| --- | --- |
| 01 | 这是电脑浏览器中的壁画导读与人物探索作品 |
| 02 | 本项目回应位置、观看起点、人物细看三项设计问题 |
| 03 | 先导读，再按需选择鼠标图鉴或单手体感 |
| 04 | 完整流程：建筑、路线、逐幅导读，主动点击进入探索 |
| 05 | 滚动如何把建筑与壁画位置连接起来 |
| 06 | 第五幅→第一幅→第二幅，各自导读，第二幅结束后进入探索 |
| 07 | 缩放拖动→点击热点或索引→阅读人物简介 |
| 08 | 三种图像各看什么，色稿属于数字表达 |
| 09 | 移手控制光标、停留约1秒确认、移开后再次操作 |
| 10 | 技术与实际体验之间的对应关系 |
| 11 | 173秒配套视频的内容、制作及演示边界 |
| 12 | 连贯观看、自主选择、资料复用；现有成果是网页原型与视频 |

文字以补齐必要解释为先，不以机械减少总字数为目标。删改泛泛理念和重复术语，将标题改为明确结论，功能说明尽量采用“操作→结果”。未加入用户研究数据、传播提升、识别精度或历史新结论。第二页是设计问题定义，不是实测用户痛点。

## 制作与验证

实际使用 `C:/Users/dovis/.agents/skills/pptx/SKILL.md` 的既有文件编辑流程：安全 DOM 修改 OOXML → 保留原生文字与图形 → 检查 → 实际导入渲染 → 修正 → 复核。`source/edit.py` 匹配实际 V2 文本，匹配失败即停止；媒体字节完整保留。没有从过时的 V2 生成文案重建整个文件。

```powershell
$pptPython='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
$pptNode='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$env:PYTHONUTF8='1'
& $pptPython promo-video/ppt/revision-v3/source/edit.py
& $pptNode promo-video/ppt/revision-v3/source/finalize.mjs
& $pptNode promo-video/ppt/revision-v3/source/render.mjs 'promo-video/ppt/revision-v3/output/出兵·入将-独立阅读评审版V3.pptx'
& $pptNode promo-video/ppt/revision-v3/source/contact.cjs
& $pptPython promo-video/ppt/revision-v3/source/pdf-preview.py
& $pptPython promo-video/ppt/revision-v3/source/acceptance.py
```

正式 finalizer 和 PDF 脚本拒绝覆盖已发布成品；后续修订使用新目录或新文件名。运行时、原生字体及媒体来源继承已有工程。字体策略包含原文件中的宋体、微软雅黑、等线及英文别名，并不代表测试了 PowerPoint 原生字体渲染。

## 限制

完成机器结构/版面检查、实际渲染逐页复核和 PDF 回渲；未进行原生 PowerPoint 应用打开检查。PDF 为已检查渲染图无损组装。体感图仍是预设流程演示，现场摄像头识别效果待实测；文化素材权限不因本轮文字编辑自动得到认证。可读性改进属于本轮编辑判断，尚无评委阅读试验或用户最终接受。
