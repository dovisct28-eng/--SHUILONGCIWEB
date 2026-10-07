# B03 手势 v2 验收记录

日期：2026-10-07。开发基线：`af582f5c0cff152bb1e28f6d57940b33361ce1f3`。

**当前状态：软件验证通过；真实摄像头最终验收按用户最新安排延后。此前首轮 6/10、第一项修正后 10/10 正常但普通动作误触 2 次，均保留。当前两项修正后的物理成功率与误触率待复测，不宣称真实体感已达标。**

## 本轮实现

- `GestureController` 明确管理 IDLE / HOVER / ARMED / FIRED / LOCKED；以 `performance.now()` 计时。
- 镜像预览右侧中部 x 0.58–0.88、y 0.28–0.72 为逻辑激活区；未画矩形按钮，摄像头预览不改。
- 张手证据 60ms 后开始 HOVER；稳定 600ms（半径 0.06）进入 ARMED；短暂掉帧不贡献停留进度；ARMED 2000ms 超时取消。
- 200ms 无手容错；无手与缺失 `multiHandLandmarks` 由真实生产回调统一进入控制器。摄像头帧中断亦可由既有 WebGL RAF 取消准备，没有新增 RAF 或摄像头。
- 张手退出滞回 100ms。双手候选立即暂停 NEXT，持续 120ms 才取消单手意图；候选期间不记录新 swipe 点。原双手展开/收拢、阅读滚动判据和操作保持。
- 仅 ARMED 记录 350ms 轨迹：位移 ≥0.11 或路径 ≥0.16，净位移 ≥0.08；平均速度 ≥0.35、峰速 ≥0.55（归一化单位/秒），路径效率 ≥0.65；至少 4 点及 80ms。采样跳变 >0.24、速度 >3.5、采样间隔 ≥200ms 重新建立轨迹。参数为待物理复测的初始值，未降低 MediaPipe 0.6/0.6 confidence。
- FIRED 同步进入 LOCKED 并调用现有顺时针反馈和 `loadSeriesData(currentSeriesIndex + 1)`；按真实图像加载、人物/轨道阶段及 entryBusy 锁定，最少冷却 1000ms。动画完成后回到 IDLE，重新停留。
- 档案阅读、切换、后台页面、模式退出、图像错误均清除准备；阅读时不会 NEXT。鼠标上一组/下一组及左右键保持。
- 小圆环和“挥动 · 下一人物”复用现有底部提示安全区；仅 HOVER/ARMED 轻度增强现有轨道能量段，取消或超时恢复。Reduced motion 保留静态反馈。
- `?gestureDebug=1` 显示状态、帧间隔、拒绝采样原因及最近转换。默认页面隐藏，内存记录最多 16 条，无额外长期调试计时器。

## Synthetic gesture validation

`npm test`：43/43（包含新增生产回调测试与实体失败回归），B01 源码/语法检查通过。项目没有 bundler build 命令；相关 JS/ESM 使用 `node --check`，主页面模块由 B01 检查解析。

单元测试捕获实际 `initMediaPipe()` 注册的 `onResults()`，从有手、无手、缺失 landmarks 回调进入完整生产处理逻辑。覆盖普通移动、200ms 短停、2 秒超时、六方向 NEXT、一次长动作不重复、十次重新停留、帧率变化、短丢帧、持续离场、静止 10 秒/抖动/跳变/回折、张手滞回、双手与阅读、前进循环、手动回看、物理截图中短暂双手候选取消、持续举手超时/切换后不自动重新准备的回归。

实际 Chrome（真实 Three.js/GSAP、本地作者素材）检查：

- B01：四视口入口、图层、摄像头权限/启动失败与重试、反复模式切换、实际 A08→B01→浏览器返回 A08；零 pageerror。
- B02：四视口全景/热点/拖动缩放、资源懒加载、标注流程和失败恢复、30/50 节点压力、30 次进退；零 pageerror。
- B03 常规回归：四视口图鉴/体感/展开收拢、双手阅读、单手停留再 NEXT、键盘回看、资源取消与缓存回收；零 pageerror。
- B03 生产回调：四视口 IDLE/HOVER/ARMED/切换锁定、六方向、空/缺失结果、10 秒静止/抖动、双手读/关档案、连续 10 次切换、reduced motion、单模型/单摄像头。包含最终双手容错与退出激活区门控的完整复跑结果见 test-results.json。
- 舞台动效：15 秒录像、四视口运动/峰值/阅读收拢、顺时针脉冲、30 次完整切换、打断与延迟请求、资源有界、降级与退出。冻结 stage/layout/material 文件未修改。

运行过程中的合成帧生产器/截图时间窗口问题已修正；本地重试/失败 JSON 与截图保留在 `local/`。最终通过的报告与失败尝试分开，不把测试工具失败或物理失败隐藏掉。

## Physical camera validation

首轮来源：用户在本聊天的真实摄像头人工反馈（manual physical camera test），**成功 6 / 总计 10**。四速度分组、误触次数、双触发次数、连续使用结果、距离、光照及浏览器未提供，全部记为未知，未补为 0。

用户报告即时挥动和等待约 2 秒后挥动均出现退回默认提示。用户提供的截图最后明确显示 `ARMED → IDLE: two-hands`；据此确认该次取消由双手检测引发。无法从截图确认第二只手是真实入镜或 MediaPipe 检测波动。

第一项修正：120ms 双手确认，候选期间始终禁止 NEXT，短暂第二只手不立即抹掉已有单手意图。用户随后反馈 10/10 正常，再报告普通动作误触 2 次、没有连跳。用户确认误触发生在持续举手、提示自行重新出现后自然移动的情形。第二项修正：超时或 NEXT 后要求退出激活区，再重新停留，避免自动重复准备。用户安排“下个版本在测试”，因此当前版最终 20 次分组成功率、0 双触发、1–2 分钟误触、连续 8–10 次、距离和光照观察延后；未补写通过数据。2 秒后才开始挥动属于预定准备超时，应重新停留；不能把超时请求当作有效 swipe，也不能据此解释所有即时失败。

## 精选证据

精选仅包含必要 IDLE/HOVER/ARMED/切换过场/阅读帧及用户实际失败截图；其余四视口和回归在被忽略的 `local/` 保留。正式壁画、母版及既有历史证据未删除、迁移或取消跟踪。

| 文件 | 内容 | 边界 |
|---|---|---|
| selected/01-idle.webp | 1920×1080 默认人物舞台 | 合成摄像头边界 |
| selected/02-hover.webp | 1920×1080 停留确认 | 合成 landmarks |
| selected/03-armed.webp | 1920×1080 完成圆环与挥动提示 | 合成 landmarks |
| selected/04-fired.webp | 1920×1080 NEXT 后原切换过场 | FIRED 是同步瞬态；截图为后续 LOCKED |
| selected/05-reading.webp | 1440×900 档案阅读 | 合成手势；长文只作滚动夹具 |
| selected/06-physical-failure-debug.png | 用户提供的真实失败调试截图 | 只证明该次退出原因；保留未通过证据 |

## 发布边界

真实摄像头 ≥18/20 等最终指标仍未验证。按用户最新安排，本轮先交付通过软件验证的可复测版本，完成任务范围内 commit、push 与远程核实；物理复测延后且不标为通过。已有无关素材删除及低保真归档修改不纳入本次提交；归档引用、模块 A、B01/B02 核心、素材扫描、人物数据、预览布局及 orbit/figure/material 主算法不修改。

精选共 6 张，总计 5,138,488 B；5 张 WebP 均逐像素核对 RGBA 一致。失败调试 PNG 保留原文件。

## 修改文件清单

- `Mural-Exhibition/public/index.html`
- `Mural-Exhibition/public/b03.css`
- `Mural-Exhibition/public/next-gesture.mjs`
- `Mural-Exhibition/package.json`
- `Mural-Exhibition/b01-check.cjs`
- `Mural-Exhibition/b03-gesture-contract.cjs`
- `Mural-Exhibition/b03-motion.test.mjs`
- `Mural-Exhibition/b03-browser-check.cjs`
- `Mural-Exhibition/b03-motion-browser-check.cjs`
- `Mural-Exhibition/b03-gesture-harness.mjs`
- `Mural-Exhibition/next-gesture.test.mjs`
- `Mural-Exhibition/b03-gesture-browser-check.cjs`
- `docs/B03_CHARACTER_STUDY.md`
- 本目录 `README.md`、`gesture-state-tests.json`、`test-results.json`、`physical-camera-validation.json` 和表中 6 张精选图。

重复运行命令：在 `Mural-Exhibition` 内执行 `npm test`、`npm run test:b03-gesture-browser`、`npm run test:b03-motion-browser`；浏览器测试需要可解析的 Playwright 和 Chrome。全部重复截图与临时录像仅写入 `local/`，不会提交。
