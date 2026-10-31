> 历史阶段（已被V3.5主线替代）：保留参数、测试数据与设计演变说明。部分截图/录像已按V2文件级清单精简；原已跟踪媒体可在pre-repository-cleanup-v2-2026-10-31恢复，重复媒体见清单中的保留副本。不得重跑旧入口检查作为当前正式验收。

> 2026-10-31清理注：被精简的历史媒体链接已改为清理前Tag或已核对的相同副本；下文原测试结果保持当时记录，不能作为最新运行结论。

# A03 标题层级验收 · 2026-10-03

用户确认：A01 保留原样；A03 将“出兵·入将”降为主题标识，主标题改为“从出行与归来，看壁画之间的联系”。删除原有重复导语，保留研究解释、观看意图、来源和不同释读提示。此标题属于项目观看引导，不新增历史判断。

开发基线：`a03edbc86fc7b514eabf8f1256d7880bd38272ee`。本轮字号 32–46px 为实际打样参数，不升级为冻结规范。

## 验收

- `node --test`：68/68 通过；修改文件语法检查及 `git diff --check` 通过。
- `node module-a/a03/browser-check.cjs`：1440×900、1440×1024、1366×768、1920×1080、1024×768 全部通过。标题两行，无水平溢出；阅读文字、核心标记和相机关系保留。
- 实际滚轮、反向恢复、刷新、窗口调整、减少动态效果、控制台和素材加载检查通过；详见 [results.json](results.json)。
- A01 往返截图五种尺寸均逐像素一致；A02 往返仍符合原有像素容差。没有修改 A01、模块 B、模型、路径或时序。
- 每种尺寸使用独立浏览器进程，避免跨尺寸 GPU 缓存影响截图比较；原有像素容差未放宽。
- 项目为原生 ES 模块，此局部文字/CSS 改动不需要重新生成模型；语法检查与 localhost 实际资源运行覆盖构建检查。

## 代表截图

[1440×900（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a03-reading-title/reading-1440x900.png)
[1024×768（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a03-reading-title/reading-1024x768.png)
[1920×1080（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a03-reading-title/reading-1920x1080.png)
[1366×768（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a03-reading-title/reading-1366x768.png)
