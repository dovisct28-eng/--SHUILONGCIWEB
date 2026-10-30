# 第五铺至模块 B

实际入口从 `module-a/navigation/exploration.mjs` 导入 `EXPLORATION_URL`（http://localhost:3000/index.html），不猜测深层 URL。核对 `Mural-Exhibition/public/index.html`：B01 提供 btn-gallery-track（图鉴探索）、btn-cyber-track（体感交互），各自初始化沿原实现，返回选择由 returnToSplashFromPano 等既有逻辑承担。

第五铺全幅中的“继续探索入将图”由用户点击；先复用 explorationAvailable 连通性检查，不可达时留在第五铺并提示。成功跳转前写入同标签 sessionStorage 返回标记；浏览器后退若保留 bfcache 则保留第五铺状态，否则重新按安全路线减少动态遍历并恢复第五铺阅读。新标签页不共享此标记。B 内原有返回选择仍返回 B01；浏览器后退返回 V3。

本轮只修改 B 首页 title 与品牌；JS、图鉴、手势、热点、节点和原图加载逻辑均未改。未把第五铺解释为故事终章。
