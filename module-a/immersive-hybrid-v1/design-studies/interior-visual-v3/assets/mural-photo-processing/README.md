# V3.3 节点 A：第三、第四铺照片裁切候选

2026-10-30；仅图像预览，等待用户确认。所属模块 A 独立 V3 原型。没有修改 `murals.json`、V3.2、第一/第二/第五铺、Combined B、模块 B 或正式展厅；未创建 V3.3 运行入口。

先 `git fetch origin` 核实本地与远程 `feature/shuilongci-hybrid-gallery-v1` 同为 `a2176cece5beefdee39ab7b6be04c0549d8fef86`，以此为处理基线。未操作 master。已有用户修改、删除及未跟踪文件均保留。

## 审图

直接打开本目录 [index.html](index.html)，每铺按原始照片、裁切框、裁切候选三列比较；点击任一图片可检查原尺寸。也可从仓库根启动 `python -m http.server 4188 --bind 127.0.0.1`，访问：

`http://127.0.0.1:4188/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/mural-photo-processing/`

两张原图预览是来源 JPEG 的逐字节副本。边界预览只在独立副本上暗化框外区域并画绿线；坐标标签位于框外，不覆盖保留的壁画。裁切候选为无损 PNG，不含绿线、暗化、文字或遮罩。

## 裁切记录

以解码图像左上角为 `(0,0)`；右、下为不含端点。坐标基于实际看图及上下边界局部检查确定，不由原图比例推算。

| 壁画 | 原尺寸 | 裁切框 left, top, right, bottom | 候选尺寸 | 宽/高 |
| --- | --- | --- | --- | --- |
| 第三铺 | 1280×960 | 0, 96, 1280, 760 | 1280×664 | 1.9277 |
| 第四铺 | 1280×1707 | 0, 196, 1280, 1568 | 1280×1372 | 0.9329 |

- 两图均无 EXIF Orientation 标签，解码后方向正确，未额外旋转。来源 JPEG 含 ICC 配置，候选 PNG 保留相同 ICC 字节。未执行色彩变换、锐化、滤镜、AI 生成、补绘、填充或重采样。
- 第三铺：上方梁架主体、底部裸砖主体移除；保留完整左右红带、灰皮残损、污迹及浅色余边。灰皮上沿略倾斜、下沿不规则，矩形框内保留少量檐下暗部和裸砖，避免贴着笔画或破损边缘切割。
- 第四铺：上方梁架及粗灰墙主体、底部裸砖主体移除；完整保留左右边带。**下方约 y=1145 之后的大面积浅色区，无法仅凭照片确认为非壁画建筑区域，当前全部保留。** 这使候选接近方形竖幅，不能预设仍为原照片的 3:4 比例。
- 两图边带/墙皮有轻微倾斜；未获得可靠的同平面四角或测绘比例。当前不作透视拉伸或旋转，故没有制造“校正后”对照。原图及未校正候选均保留；若后续确认需要校正，另行生成候选，不能覆盖本轮版本。
- 上下边界范围是人工目视判断，非文物边界鉴定。主体之外的极窄下延墙皮/墙柱不据此推定属于壁画；照片外是否存在更多内容无法验证。用户审图可据实际资料调整。

详细观察与处理参数见 [第三铺 JSON](mural-03-crop.json)、[第四铺 JSON](mural-04-crop.json)。墙面状态继续是 `photo-unrectified`，不表示现场配准已完成。

## 原件查找与可复查性

检查 `水龙祠壁画素材/` 全目录和包括 Git 忽略内容的 `水龙祠实地照片/`。完整图片尺寸清单见 [source-inventory.json](source-inventory.json)。其中超大母版只读文件头，不解码或修改。两铺原件和现有 `assets/mural-03-source.jpg` / `mural-04-source.jpg` 尺寸、文件字节及 SHA-256 完全相同；上述目录未发现同一照片的更高分辨率版本。此结论不覆盖用户其他磁盘或未提供原件。

处理可用 Python 3 + Pillow 复现，无新增网页运行依赖：

```powershell
python module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/mural-photo-processing/process-candidates.py
python module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/mural-photo-processing/test-candidates.py
```

本机使用已安装的 Codex runtime Python/Pillow 13.0.0；命令中的 `python` 应替换为可用解释器路径。处理程序只写本目录和本阶段 `selected/` 中的两张对照展板，不写来源照片或网页数据。坐标 JSON 是唯一裁切参数来源。实际输出哈希、像素相等检查和工具版本见 [processing-report.json](processing-report.json)。

验证结果与精选清单见 [节点 A 验收记录](../../../../../../docs/validation/interior-visual-v3-3-stage-a/README.md)。

## 后续门槛

任务书明确要求“在用户确认裁切结果前，不得直接替换网页中的第三、第四铺图像”。因此本轮交付后等待审图，节点 B/C 的空间、AI 融合、显影、阅读适配及连续录屏尚未实施，不作为本轮完成项。
