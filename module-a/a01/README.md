# 模块 A｜A01–A03 浏览器低保真原型

双击仓库根目录的 `启动模块A原型.bat`，或运行 `node module-a/a01/server.mjs` 后打开 `http://127.0.0.1:4173/module-a/a01/`。

页面使用 5 个视口高度映射 A01 四阶段动画、1.2 个视口高度作为稳定阅读区间；其后 4 个视口高度完成 A02，其中包含原有的 1 个视口高度回中过渡。真实三维模型来自 `shuilong-temple/水龙祠-交互预览.html`，通过公开接口按滚动进度控制建筑显现、屋顶弱化和壁画标记。

最终 Hero 采用左文右图：建筑从中央向右移动，左侧文字淡入；阅读区间结束后，建筑连续回到中央。A02 依次建立建筑空间、五幅位置总览、第一幅/第二幅/第五幅共同强调，并保留稳定阅读区间；反向滚动可恢复全部状态。地址追加 `?debug` 可显示阶段与进度信息。

运行进度映射测试：`node --test module-a/a01/progress.test.mjs module-a/a02/progress.test.mjs`。浏览器验证脚本位于 `module-a/a02/browser-check.cjs`，结果与截图归档在 `docs/validation/a02/`。

当前空间入口与 A02 文案仍为低保真设计内容。壁画位置采用项目模型节点，只表示模型示意位置，实际墙位仍待现场或权威资料核实。

A03 在 A02 完整区间之后新增3个视口高度，呈现“出兵·入将”研究视角、观看目的与 A04 出发站位提示。使用同一建筑，反向滚动恢复 A02；完整 A04 路线和顶部导航尚未实现。文案依据、分段与验证入口见 `docs/A03_PROTOTYPE.md`。

包括 A03 的测试：`node --test module-a/a01/progress.test.mjs module-a/a02/progress.test.mjs module-a/a03/progress.test.mjs`。浏览器检查见 `module-a/a03/browser-check.cjs`，截图与结果在 `docs/validation/a03/`。
