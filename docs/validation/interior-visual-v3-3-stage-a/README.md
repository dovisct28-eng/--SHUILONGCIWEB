# V3.3 节点 A 验收记录

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
