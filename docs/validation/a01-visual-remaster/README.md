> 历史阶段（已被V3.5主线替代）：保留参数、测试数据与设计演变说明。部分截图/录像已按V2文件级清单精简；原已跟踪媒体可在pre-repository-cleanup-v2-2026-10-31恢复，重复媒体见清单中的保留副本。不得重跑旧入口检查作为当前正式验收。

> 2026-10-31清理注：被精简的历史媒体链接已改为清理前Tag或已核对的相同副本；下文原测试结果保持当时记录，不能作为最新运行结论。

# A01 Visual Remaster 验收

2026-10-02；基线 `7e59a973b0caa487b325b6c95a11b704b216385f`。完整说明见 [A01_HIGH_FIDELITY.md](../../A01_HIGH_FIDELITY.md)。环境与材质只作设计表达，原几何/壁画资料边界不变。

- [Before / After（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a01-visual-remaster/contact/before-after.jpg)：1440×900，开发前实际截图与最终实现。
- [四尺寸 Hero（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a01-visual-remaster/contact/heroes.jpg)：1920×1080、1440×900、1366×768、1024×768。
- [生长及交接（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a01-visual-remaster/contact/growth-and-handoff.jpg)：1440 的 11 个指定状态。
- [四尺寸全部状态（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/a01-visual-remaster/contact/all-states.jpg)：44 帧联系表；单帧 PNG 保留本地 `after/`。
- [浏览器结果](results.json)：实际顶点投影、各帧状态、资源、可逆恢复与交接取样。
- [性能对照](performance.json)：同机每版本三个冷加载样本；HTTP 路由拦截口径相同。
- [线层回归](line-regression/results.json)：36 状态、像素比较、停滚/刷新/快速跳转/resize、六种减少动态或失败模式；新增 mural group 隐藏/恢复断言。
- [字体换字](font-layout.json)：真实延迟 WOFF2，四尺寸布局外框一致。

可复现脚本：`module-a/a01/visual-remaster-browser-check.cjs`、`visual-remaster-performance-check.cjs`、`visual-remaster-contact.cjs`；另复验既有 line-browser、font-browser、environment-browser、model-browser、texture-browser、A04 browser/transition。浏览器脚本需 Playwright/PNGJS，联系表需 Sharp。先启动 `module-a/a01/server.mjs` 的 4173 与 4175 实例；使用 `A01_VALIDATION_DIR` / `MODEL_VALIDATION_DIR` 分开输出，避免覆盖历史记录。

视觉检查包含全尺寸 Hero、半实体、65% 高潮和回中交接，截图未见壁画占位透到外墙。自动测试验证边界和状态，不能单独证明审美质量。低性能/不同 GPU 未覆盖；透明叠合截图有少量边缘误差，相关数据和阈值保留在回归脚本和报告中。

实际执行并通过（输出目录使用上文环境变量分开）：

```powershell
node shuilong-temple/build-model.mjs
node --test module-a/*/*.test.mjs module-a/*.test.mjs shuilong-temple/*.test.mjs
python shuilong-temple/architecture-style.test.py
node module-a/a01/visual-remaster-browser-check.cjs
node module-a/a01/visual-remaster-performance-check.cjs
node module-a/a01/visual-remaster-contact.cjs
node module-a/a01/line-browser-check.cjs
node module-a/a01/line-performance-check.cjs
node module-a/a01/font-browser-check.cjs
node shuilong-temple/environment-browser-check.cjs
node shuilong-temple/model-browser-check.cjs
node shuilong-temple/texture-browser-check.cjs
node module-a/a04/browser-check.cjs
node module-a/a04/transition-check.cjs
git diff --check
```

Node 57/57、Python 3/3 通过；浏览器及构建检查均通过。原 line-performance 对照更早基线，仅作既有脚本回归；本轮增量判断以 performance.json 的 7e59a97 对照为准。
