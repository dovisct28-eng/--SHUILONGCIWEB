# B03 手势 V3 · 单人归属与交互仲裁

2026-10-07。软件验证完成；**物理多人摄像头验收：PENDING**。

基线：首先 `git fetch origin`，确认本地 HEAD 与执行时远程 master 均为 `3d8a33b992987712ab28ab05b06634d579a1d3cc`。保留任务前已有素材删除、归档启动脚本修改和未跟踪文件，本次不提交这些变更。

## 实现

修改文件：生产入口 `Mural-Exhibition/public/index.html`；新增 `public/interaction-config.mjs`、`operator-tracker.mjs`、`interaction-controller.mjs`、`pose-pipeline.mjs`、`pose-worker.js`。测试新增 `operator-tracker.test.mjs`、`interaction-controller.test.mjs`、`pose-pipeline.test.mjs`、`b03-gesture-fixtures.cjs`、`b03-pose-browser-check.cjs`；更新 NEXT 生产 harness、gesture browser、B01 源码保护、gesture contract、B03 functional / stage / hf / layout / surface / motion 的边界 fixture 以及 package scripts。文档为本目录和 `docs/B03_CHARACTER_STUDY.md`。模块 A、B02 热点、人物源图、舞台 CSS / 材质 / 动效算法与低保真归档机制不属于本次修改范围。

生产链路：Camera 同一份 320×240 Canvas 捕获 → 异步 Pose Worker → 临时空间人体 track → Active Visitor → hand/wrist 归属 → InteractionController → 原 GestureController / 阅读 UI。

- `public/operator-tracker.mjs`：中央区 x .25–.75、y .12–.90；中央、身体尺度、可见度与稳定性加权评分，中央权重最高。800ms 连续候选停留才锁定；缺失 Pose 帧不累计候选稳定时间。锁定后停止重选，不因更大身体或检测顺序改变抢权；1000ms 人体连续不可见或离开中央区才释放。身份是页面内的 `visitor-n`，不使用人脸、身份数据库或跨会话保存。
- 使用肩 / 髋定义 torso center，左右腕匹配 Hands landmark 0。匹配距离按肩宽和画面宽高比归一化；同一手只能绑定一个 wrist，一对手必须绑定同一操作者的不同 wrist。与旁观者腕或左右腕竞争、重复检测、异常跳跃均拒绝。200ms 归属保留仅用于容错，旧 landmarks 不推进动作、停留或阅读。
- `public/interaction-controller.mjs`：NAVIGATION → READING_ENTER → READING → READING_EXIT → POST_READING_LOCK → NAVIGATION。展开要求 neutral 保持 → 距离增长至少 .10 → 越过 .38 → 保持 400ms；静态张手不打开。收拢要求较大起点 → 距离减小 → 到 .16 → 保持 300ms，开关各调用一次。
- 关闭后所有手势暂禁，提示“放下双手 · 继续探索”。有效归属双手离开手势区 300ms、双手消失 300ms，或单手在 NEXT 激活区外稳定 500ms，才能释放；归属容错可能增加约 200ms 等待。无法确认 Pose 可用时不累计释放证据。释放后需要重新完成单手停留或双手 neutral → 展开。
- ARMED/HOVER 的 NEXT 暂时优先，同一操作者第二只手确认后取消意图，不能直接开简介。页面 loading / transition、归属、POST_READING_LOCK、阅读均在 NEXT 之前仲裁。NEXT 只收到已归属的有效单手，沿用原停留、轨迹、速度、冷却、releaseRequired 与循环前进逻辑。`next-gesture.mjs` 未修改。
- `setRevealed()` 收敛为 UI 更新。鼠标、I、Escape 和校准预览通过 `requestReading()` 接入同一阅读生命周期；主动操作保留既有可逆动画。摄像头 callback 有时间与会话校验，Hands 推理单路在途，旧会话结果不能进入新会话。
- 正式摄像头预览位置、尺寸和 CSS 均保持；技术 landmark 绘制仅在 `gestureDebug=1`。调试面板记录 PERSON、ID、候选 / 丢失时间、检测 / 归属手数、L/R、Pose age、模式、双手动作阶段和 post release 时间。

## 模型与性能

新增 `pose-pipeline.mjs` 与 `pose-worker.js`。Tasks Vision 固定 `0.10.21`，PoseLandmarker lite float16 v1，VIDEO、`numPoses:4`、CPU Worker、无 segmentation。Chrome 实测发现该版本 WASM loader 在 module Worker 内的 importScripts 不兼容；最终 classic Worker 动态导入官方 ESM 包，并已运行真实模型验证。

模型与 WASM 从 jsDelivr / Google 模型 CDN 下载；推理在浏览器本地执行，不上传摄像头画面。现有 Hands CDN 依赖保留，最大手数从 2 到 4 仅作为多手检测容量，实际控制由人体归属决定。官方配置与同步推理 / Worker 说明见 [PoseLandmarker Web 文档](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker/web_js)。未引入云识别 API、无关框架或整个模型本地化工程。

Pose 至多每 80ms 提交一次，且只允许一份在途推理；保留 capture timestamp，超过 220ms 或未来时间结果禁止进入手归属。Hands 每摄像头帧运行，保留 320×240。模型在退出后保留单实例但停止提交；重入重置 session，不累加 Worker / callback / RAF；pagehide 终止 Worker。

最终双模型运行数据记录于 `pose-runtime-results.json`：独立复测 5 秒采样内 Pose 9.96 次/秒、Hands callback 30.29 次/秒；累计 Pose 平均推理 55.52ms，包含冷启动的峰值 287.8ms。峰值超过 220ms 时效，结果会被归属层拒绝；不是扩大时效或按手大小回退。Headless RAF 平均间隔 5.92ms、最大 33.3ms，仅为软件采样，不当作实际显示 FPS。

Hands / Pose 各 1 个模型，活动 Camera ≤1，体感舞台 RAF 1；退出后 Camera / RAF 为 0，重入仍为单实例。退出不再提交推理，已在途的一帧允许完成并按旧 session 丢弃，实测重入记录 1 次旧 session 拒绝。CPU/GPU 占用与真实人体帧现场性能仍待实机验收。空白帧 smoke 只证明模型、WASM、生产回调和生命周期，不代表多人识别精度或真实展示刷新率。另一次冷启动 smoke 等待 25 秒超时，具体原因未定位；随后加入失败状态记录并重试通过，失败记录留在 local，不能以最后一次 PASS 隐去偶发启动风险。

## 自动与浏览器验证

`npm test`：63/63，通过。包括原 B02/B03、布局、材质、动效、NEXT 与新增 OperatorTracker、InteractionController、PosePipeline。`b01-check.cjs` 校验入口语法、原 shader、单摄像头 / Hands 构造、预览 debug 门控；Worker 单独语法检查通过。项目没有额外打包构建步骤。

| 验证 | 结果 | 范围 |
| --- | --- | --- |
| 三视口生产 callback | PASS | 1440×900、1920×1080、1366×768；实际 Camera.onFrame、Hands.onResults、Pose 消息链与舞台，模型输出合成 |
| NEXT | 36/36 | 无双触发、反向手势、未经停留的 NEXT |
| READING | 13/13 | 静态张手拒绝、完整展开 / 收拢、post lock 无误重开 |
| 旁观者干扰 | 8/8 被阻止 | A 锁定、B 更大、跨人物多手、B 双手；未出现错误 NEXT / READING |
| 完整使用十轮 | PASS | NEXT×2 → 阅读 → 关闭 → 分手 → release → NEXT → 人体离开 → 新候选停留 → 重锁 |
| 操作者交换 | 10/10 | 不同空间位置的新候选，不同 ID；无同帧抢权 |
| B03 visual / stage / layout / surface / motion | PASS | 原人物素材、预览布局、四视口舞台、材质 Alpha、30 次完成切换、纹理 / DOM / 动效有界 |
| 图鉴 / 鼠标 / 键盘 / 资料 | PASS | 原图鉴、媒体、可逆揭示、上一人物 / 下一人物、I / Escape 与退出资源释放 |
| 真实双模型烟测 | PASS | 实际 Pose + Hands 模型，空白输入、B03 WebGL 舞台与退出 / 重入 |
| 物理单人 / 双人摄像头 | PENDING | 见物理清单，不能用 synthetic PASS 替代 |

零误触结论仅适用于受断言检查的合成测试过程，不是现场误触率统计。Node harness 覆盖 A–M、近腕歧义、低置信度、过期时间、丢手容错、已 ARMED 第二手、旧摄像头回调以及缺帧候选。

提交的可读记录：`tests.txt`、`gesture-results.json`、`pose-runtime-results.json`、`regression-results.json`。前两份浏览器原始报告包含生产状态快照；轻量回归摘要记录源结果 SHA-256，完整数据留在 local。

浏览器调试过程曾发现：module Worker WASM 初始化失败、旧测试交换位置仍在同一空间 track 范围内、鼠标快速收放被过宽的手势 transition 门槛阻止。分别修正 Worker 类型、将合成交换测试置于不同空间且保持完整 release / acquire，以及恢复原鼠标可逆操作。失败 / 中间结果保留于 `local/`，最终通过结果另行摘要归档。

## 精选截图

仅提交以下五张 1440×900 实际运行截图；camera image 和 landmarks 均为明确标记的合成输入。普通截图证明正式状态与布局，调试截图证明状态机当前归属，不证明实际两个人体检测质量。

| 文件 | 状态 |
| --- | --- |
| `selected/01-operator-locked.png` | 主操作者已锁定，普通模式无开发诊断 |
| `selected/02-navigation-armed.png` | 单手 ARMED |
| `selected/03-reading.png` | 简介阅读（既有兼容人物舞台） |
| `selected/04-post-reading-lock.png` | 简介关闭后提示放下双手，手势锁定 |
| `selected/05-multi-person-lock.png` | debug：B 的双手检测到，但 A 保持锁定、归属手数为 0 |

完整截图、重复回归、原失败结果和动效录像留在忽略的 `local/`，不迁移或删除历史证据。精选截图大小清单见 `evidence-manifest.json`。

## 残余限制

1. 这是临时空间 tracking，不是身份识别。Pose 自身误检、两人完全重叠、同位置替换、肩髋不可见、手腕交叉及强遮挡均可能造成归属暂停或 track 误关联。程序拒绝可检测的歧义，不能证明所有真实画面的身份归属正确。
2. 800/1000ms、开合 / 匹配距离与 220ms 时效均是标定起点。慢设备或多人帧推理超过时效时，系统保守拒绝手势；实际有效率须按现场帧测量。不得用最大两只手回退。
3. CDN 网络与首次模型加载仍影响体感启动；失败保留错误 / 重试与图鉴路径。无实体双人测试，整体展厅验收未完成。
4. 视觉算法和源图均未改动；所用人物数据仍来自 B02，正式素材缺失的既有兼容状态继续显示，不创建新人物资料。

完整物理清单：[PHYSICAL_CAMERA_CHECKLIST.md](PHYSICAL_CAMERA_CHECKLIST.md)。
