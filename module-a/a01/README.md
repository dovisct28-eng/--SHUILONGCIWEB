# 模块 A｜连续叙事入口与 A01 高保真开屏

双击仓库根目录的 `启动模块A原型.bat`，或运行 `node module-a/a01/server.mjs` 后打开 `http://127.0.0.1:4173/module-a/a01/`。

页面使用 5 个视口高度映射 A01 四阶段动画、1.2 个视口高度作为稳定阅读区间；其后 4 个视口高度完成 A02，其中包含原有的 1 个视口高度回中过渡。真实三维模型来自 `shuilong-temple/水龙祠-交互预览.html`，通过公开接口按滚动进度控制建筑显现、屋顶弱化和壁画标记。

最终 Hero 采用左文右图：建筑从中央向右移动，左侧文字淡入；阅读区间结束后，建筑连续回到中央。A02 依次建立建筑空间、五幅位置总览、第一幅/第二幅/第五幅共同强调，并保留稳定阅读区间；反向滚动可恢复全部状态。地址追加 `?debug` 可显示阶段与进度信息。

运行进度映射测试：`node --test module-a/a01/progress.test.mjs module-a/a02/progress.test.mjs`。浏览器验证脚本位于 `module-a/a02/browser-check.cjs`，结果与截图归档在 `docs/validation/a02/`。

2026-10-02：A01 实现「一线成祠」建筑线描生成，详见 [实现与验收](../../docs/A01_HIGH_FIDELITY.md)。线描来自原模型源几何，经离线简化后在现有 Three.js 场景中以 LineSegments 显示；四阶段、阅读距离及一次回中不变。字体与中性色仍为打样选择，不代表全项目冻结。

A02—A08 保留已完成的低保真叙事；A04 路线与三幅导读已实现，顶部导航尚未实现。壁画位置仍为模型示意位置，实际墙位待核实。A03 文案依据见 `docs/A03_PROTOTYPE.md`。

包括 A03 的测试：`node --test module-a/a01/progress.test.mjs module-a/a02/progress.test.mjs module-a/a03/progress.test.mjs`。浏览器检查见 `module-a/a03/browser-check.cjs`，截图与结果在 `docs/validation/a03/`。

A01 新验收：`node module-a/a01/line-browser-check.cjs`、`node module-a/a01/line-performance-check.cjs`（需要 NODE_PATH 可解析 Playwright/PNGJS）；`A01_VALIDATION_DIR` 可指定输出目录。构建仍为 `node shuilong-temple/build-model.mjs`，同时更新简化线条和离线副本。

2026-10-02 Visual Remaster：A01 专用镜头、材质与灯光由 `shuilong-temple/a01-art-direction.mjs` 管理，6.2—7.2 屏回中时恢复共享基准。生长阶段分开结构、实体、材料、光影和环境；壁画占位及边框到 A02 标记阶段才可见，避免半透明墙体透出占位。建筑几何、壁画位置与模块 B 未改。

本轮验收：`visual-remaster-browser-check.cjs`（四尺寸投影边界、11 状态、倒滚、阅读、交接与回退）、`visual-remaster-performance-check.cjs`（对照 `7e59a97`，同机各三次冷加载）、`visual-remaster-contact.cjs`（Sharp 联系表）。结果见 `docs/validation/a01-visual-remaster/`；完整记录追加于 [A01_HIGH_FIDELITY.md](../../docs/A01_HIGH_FIDELITY.md)。运行浏览器脚本须启动 4173/4175 两个本地端口，并使用 `A01_VALIDATION_DIR` / `MODEL_VALIDATION_DIR` 指定新输出目录，保留原验收记录。
