# A01–A03 视觉整合验收

基线：27fec089b8508c3f670feaf4970a1c8b13014d62。
实现与首次截图：2026-09-26；续跑验收：2026-09-28。

截图保留在本目录的本地 PNG/JPG，未将临时截图加入 Git。

- initial / generated / composition / transition / space / five / core / reading / end / handoff：每种 1920×1080、1440×900、1366×768、1024×768，各 10 张。
- contact-*：四种尺寸的人工检查联系表。
- a04-fifth / a04-first / a04-second-1440x900：实际自动播放停靠。
- a04-overview-*：路线总览。
- results.json：A04 专项回归结果，errors 为空。
- environment-results.json：环境层级、倒滚、失败回退、A05–A08 可达性。
- performance.json：本轮环境启用/禁用的同机抽样。

复现时启动 A01_PORT=4175 的 module-a/a01/server.mjs，设置 MODEL_VALIDATION_DIR 为截图目录，并确保 Node 可解析 Playwright。执行任务书列出的构建、全部单元测试及六个浏览器/性能脚本，另执行 shuilong-temple/visual-integration-browser-check.cjs。

人工视觉检查：无 depth 框、标题底板或 iframe 色块，土地无规则田块/道路外边，四尺寸文字与建筑分离；环境淡化，建筑保留最高对比。A04 三次停靠与路线总览保留既有构图。视觉方向为轻量实时模型的淡彩整合，不是参考插画的逐像素复制。

最终结果：构建通过；45/45 单元测试通过；任务书要求的全部六个浏览器/性能脚本和新增截图脚本通过。2026-09-28 续跑四尺寸 A04 transition 及 texture-browser-check 均退出 0。
