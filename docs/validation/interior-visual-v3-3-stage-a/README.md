# V3.3 节点 A 验收记录

## 第二版：第三铺正视与第四铺用户裁切

2026-10-30，根据用户反馈在本地 `990bcdf8e416a2050ea75446d3c3f7d9514bdcf1` 上调整；fetch 成功复核远程功能分支仍为 `a2176ce`，上轮提交尚未推送，没有远程新差异。本次保持指定功能分支，master 不操作。

第三铺新增 1323×698 正视候选，参考红带四角作单次平面几何变换；全部原裁切框映射在输出内，空角透明，未补绘、未改色。四个控制点对应输出参考边水平/竖直；这验证变换参数，不证明真实壁画为该物理长宽比。原片与第一版未校正候选哈希不变。第四铺依据附图内容比对，保持 top=196、全宽1280，下沿 bottom=1135，输出1280×939；JPEG解码对应区域与PNG逐像素相等。来源 ICC 均保留；第三铺存在明确记录的 BICUBIC 几何插值，不声称像素相等。

验证：`test-revision-2.py` 6 项、`test-candidates.py` 5 项、既有 `study.test.mjs`/`route-v3.2.test.mjs` 16 项通过，共27项。覆盖原片和前版保护、附图下沿内容对应、完整裁切范围保留、平面控制点关系、透明空角、预期几何变换及报告真实性。Python脚本语法与更新的Node脚本语法检查通过，无打包步骤、无模型重建。

Chrome/Playwright 当前审图页六组通过：1920×1080、1440×900、1366×768，各含正常/减少动态。六张图解码尺寸正确、contain、无横向溢出或外部资源；候选原尺寸链接、返回和键盘链接可用。[第二版浏览器结果](browser-results-revision-2.json)。沿用第一版的原生图片页 favicon 单独记录策略。目视检查两张第二版展板、第三铺校正图与1366审图页；并非V3.3空间/细读功能验收。

新增精选：`selected/mural-03-front-comparison.jpg`（未校正/控制点/正视候选），`selected/mural-04-revised-comparison.jpg`（用户附图/原图裁切框/新裁切），均1660×1010，作为审图展板，不冒充浏览器截图。第一版精选及候选保留；六组第二版浏览器截图仅保留 `local/`。新增参考/PNG/参数在 `assets/mural-photo-processing/revision-2/`，来源照片保持原路径不动。

当前审图页已更新；未将第二版图像接入展厅，未启动节点 B/C。后续在用户确认后执行。

## 第一版记录（保留）

日期：2026-10-30。分支 `feature/shuilongci-hybrid-gallery-v1`；fetch 后基线 `a2176cece5beefdee39ab7b6be04c0549d8fef86`，本地/远程一致。仅完成第三、第四铺裁切预览候选，等待用户审图；未接入网页，未推进节点 B/C，未修改 master。

## 结果与限制

素材与参数位于 [mural-photo-processing](../../../module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/mural-photo-processing/README.md)，[打开审图页](../../../module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/mural-photo-processing/index.html)。

第三铺裁切至 1280×664，第四铺裁切至 1280×1372。保留全宽、不放大，PNG 与来源 JPEG 解码后对应区域逐像素相等；ICC 配置逐字节相等。来源照片与预览副本哈希相等。两铺无 EXIF Orientation，未作旋转/透视/修复/改色或 AI 处理。细节见参数和处理报告。

目视检查完整原图、上/下边界局部与两张对照展板。第三铺保留不规则灰皮及少量砖基/暗部；第四铺下部浅色带性质无法确认，完整保留。左右边带均未二次裁掉。轻微倾斜没有可靠四角支持校正，暂不拉正。边界仍须用户确认，不声称文物范围或现场墙位已验证；未找到更高分辨率同图仅限已记录素材目录。

## 自动检查

- `test-candidates.py`：5 项测试通过，覆盖来源/原图副本保护、裁切像素及 ICC、独立目视边界锚点、处理报告与忽略目录清单、9 个 V3.2 既有控制/数据文件与基线内容一致。
- `node --test .../study.test.mjs .../route-v3.2.test.mjs`：16 项既有测试通过。
- Python 两个脚本内存语法编译及 `node --check .../browser-check.cjs` 通过；本轮没有打包构建或 GLB 重建。localhost 静态页面与图片实际加载正常。
- `browser-check.cjs`：Chrome / Playwright，1920×1080、1440×900、1366×768，各含正常/减少动态，6 组通过。6 张图片自然尺寸正确、`contain`、无横向溢出、无外部资源，原尺寸候选链接、返回和键盘链接可用。结果见 [browser-results.json](browser-results.json)。Chrome 原生 PNG 浏览页会额外请求不存在的 `/favicon.ico`；该请求与原生页控制台提示单独排除，不作为审图页面资源错误。审图页自带空 favicon。

审图页为静态、无动效；上述浏览器结果只验证本轮候选展示，**不是 V3.3 全幅、细读、前进/返回、空间路线、AI 投影或录屏验收**。这些依赖裁切确认后实施。未做跨 GPU 或文物现场验证。

## 精选资料

| 文件 | 用途 | 尺寸 | 说明 |
| --- | --- | --- | --- |
| `selected/mural-03-comparison.jpg` | 第三铺原图/裁切框/裁切结果 | 1660×1010 | 审图展板，非实机交互截图 |
| `selected/mural-04-comparison.jpg` | 第四铺原图/裁切框/裁切结果 | 1660×1010 | 明确保留下部浅色带，非实机交互截图 |

两张展板合计 958259 字节（约 0.91 MiB）。原尺寸裁切 PNG、边界预览与原图副本属本轮正式候选素材，存 `assets/mural-photo-processing/`，不能用有损展板替代；本轮全部新增文件约 7.7 MiB。六组浏览器完整截图保留本阶段 `local/`，由既有 `.gitignore` 排除，不重复提交。

用户确认裁切前保持候选状态。后续修改坐标需重新生成并核对 PNG 像素及来源；不得将本轮“裁切完成”改写为“透视校正/墙面测绘确认”。
