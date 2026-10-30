# V3.3 节点 A：第三、第四铺照片裁切候选

## 第二版：按用户反馈调整（当前候选）

2026-10-30，用户提出第三铺改为正视、第四铺下沿切至附图位置。本轮只调整节点 A；未接入壁画网页、未修改模型/空间路线或配准状态。[当前审图页](index.html)；[第一版审图页](initial-review.html)保留。

- 第三铺：[正视候选 PNG](revision-2/mural-03-front-candidate.png)，1323×698。按两侧红带与上下边附近四个参考点作一次平面透视变换；保留整个第一版裁切范围，变换后空角透明，不作填充或修复。对应参考边趋于水平/竖直。输出尺寸来自变换后的包围框，不表示真实细节增加。实际墙面宽高比没有实测依据，是照片约束下的展示估计。原片、[未校正版](mural-03-crop-candidate.png)、[控制点/参数](revision-2/mural-03-front.json)与前后对照均保留。
- 第四铺：[本次裁切 PNG](revision-2/mural-04-crop-candidate.png)，1280×939。用户附图 528×389 已归档为[参考](revision-2/user-mural-04-crop-reference.png)，只用于定位，不作为壁画图源。对原图缩小后进行内容比对，附图下沿映射约 y=1134.55，向外取整至 y=1135；按“下面切到”的要求保留原上沿 y=196 与全宽。裁去下部浅色带是本轮用户指定的展示裁切，不是对浅色带文物属性的新鉴定。[参数](revision-2/mural-04-crop.json)。
- 第三铺涉及 BICUBIC 几何插值，不能再声称与原图逐像素相等；第四铺仅矩形裁切，继续逐像素相等。两者均保留原 ICC、未作改色/锐化/AI 处理。透明空角是来源范围之外，不是对残损图案打孔。
- [处理报告](revision-2/processing-report.json)记录正/逆矩阵、完整裁切框投影、输出哈希及附图内容比对结果。用 `python .../revise-candidates.py` 复现，需要 Pillow + NumPy；附图需先放入本目录 `revision-2/`。原 `process-candidates.py` 重跑时只更新第一版审图页，不覆盖当前第二版入口。
- 6 项本轮专项测试、5 项第一版保护检查、16 项既有模块测试通过；本轮浏览器检查覆盖三种尺寸 × 两种动态偏好，6 组通过。详见[验收记录](../../../../../../docs/validation/interior-visual-v3-3-stage-a/README.md)。

本轮开始 fetch 成功：远程功能分支仍为 `a2176ce`，本地有上轮尚未推送的 `990bcdf`，没有远程新提交需要合并。本轮提交继续使用同一功能分支，不操作 master。等待对第二版候选的审图反馈。

## 第一版处理记录（保留）

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
