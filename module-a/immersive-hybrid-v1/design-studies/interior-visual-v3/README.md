# 水龙祠 · 原境数字展厅 V3（独立候选）

2026-10-30；起始远程 HEAD `261ddeec62b97152fea0f935fe5aacdd6595ee86`，已 git fetch 核实。分支 feature/shuilongci-hybrid-gallery-v1，禁止合并 master。

运行：从仓库根运行 `$env:A01_PORT='4186'; node module-a/a01/server.mjs`，打开 http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/ ，或双击本目录启动视觉原型.bat。模块 B 另在 Mural-Exhibition 运行 node server.js。

本轮建立五铺模型候选参观轨道、原比例阅读和自由缩放；第一铺保留原显影、编辑阅读和三个观察点。第二/五铺候选淡入，第三/四铺使用用户本地真实现场照片，未冒充墙面配准完成。阅读后主动继续，允许回墙、回上铺。模型墙位仍须现场资料核对；其他铺语义观察点、新空间 AI、人体通行体积及用户最终视觉验收未完成。

正式 A01–A08 仅安全文案调整，旧空间路线暂留；“出庙/入庙”巨型构图保持。正式 v24 与 V2 运行实现均保留（V2 仅改品牌）。无新增框架、无构建打包步骤；node --check 和模块测试检查静态构建有效性。

测试：node --test module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/study.test.mjs；有 Playwright/sharp/Chrome 时运行本目录 browser-check.cjs。测试库沿用环境提供的 NODE_PATH，不增加正式运行依赖。验收见 docs/validation/interior-visual-v3/README.md。


## 2026-10-30 观众界面技术标注清理

基于远程最新 `c3c7ee5ac939b04fac334df7b39c93d0bab9cc59`。全幅页移除尺度/像素信息与技术说明段落，取消 `m.note` 向 `.reading-copy` 的绑定；底部改为简短导语与细读入口两列。第三/四铺不再弹出未校正/配准说明；墙面提示与参观路线弹窗不显示技术状态。`murals.json` 的 note、wallStatus、source、registration 及既有内部文档保持，不代表配准状态发生改变。预览诊断区继续可供开发检查。

本次未改模型、图像、路线数据、机位、动画、阅读/细读/返回控制。专项检查为 `label-cleanup-check.cjs`，结果与精选截图见 [技术标注清理验收](../../../../docs/validation/interior-visual-v3-label-cleanup/README.md)。
