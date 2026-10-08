# B03 V3.1 物理摄像头验收

任务开始：2026-10-07；记录更新：2026-10-08。状态：**PENDING PHYSICAL ACCEPTANCE**。

本次 Codex 未进行真人摄像头测试。合成 landmark、实际 Chrome 生产回调及真实模型空白帧烟测均不能替代本表。尚无成功率、人物距离、光照或现场 FPS 结论。验收使用 `index.html?gestureDebug=1`，保持 320×240、Hands 原配置和既有手势阈值。

请记录设备、浏览器版本、灯光、摄像头、相对站位（近/中/稍远）、每次失败时截图/日志。成功率填写实测分子/分母，不提前填 PASS。

| 场景 | 次数与门槛 | 状态 | 实测结果 / 证据 |
| --- | --- | --- | --- |
| 普通预览手势示意 | 有手时骨架/关键点可见，放手清除；框位置/尺寸不变，普通模式无debug文字 | PENDING | 未测 |
| 正常半身，髋部完全出画 | 10 次进入，锁定 10/10；观察 UPPER、hips false、肩宽和 800ms 候选 | PENDING | 未测 |
| 近距离半身，双肩完整 | 10 次进入，仍能锁定，不要求退到髋部入镜 | PENDING | 未测 |
| 中/稍远半身 | 各 10 次进入和开合；记录肩宽、同 ID 与当前绝对距离阈值是否适用 | PENDING | 未测 |
| 向前/向后移动、髋部进出 | 10 轮；UPPER/FULL 切换不重锁，不被旁观者抢锁 | PENDING | 未测 |
| 双手展开 | 至少 10 次；分别记录 detected、assigned、L/R source、wrists、拒绝原因 | PENDING | 未测 |
| 打开简介 | 成功 ≥9/10；0 次打开后立即关闭 | PENDING | 未测 |
| 阅读、双手收拢 | 关闭成功 ≥9/10；0 次关闭后自动重开 | PENDING | 未测 |
| 完整阅读/关闭/放手/NEXT | 连续 10 轮；0 自动重开、0 连跳、0 PREVIOUS、0 人物重锁 | PENDING | 未测 |
| 单手准备+挥动 | 10 次；只 NEXT，一次最多切一个人物 | PENDING | 未测 |
| B 从左右、前后经过并挥手/开合 | 各方向记录；B 不控制 A；重叠/竞争时暂停 | PENDING | 未测 |
| A左+B右、A右+B左、A双+B单、A单+B双 | 各组合至少 10 次；不拼成跨人物双手 | PENDING | 未测 |
| Pose 单腕丢失100–200ms | 人物不立即释放；可观察 fallback 或暂停，不用 GRACE 旧点推进动作 | PENDING | 未测 |
| 肩部消失/离开中央区 | ≥1000ms 后释放，新人重新经过800ms acquire | PENDING | 未测 |
| 退出/重新进入体感 | 至少3轮；Hands=1、Pose=1、活动 Camera≤1、舞台 RAF=1，旧 callback 无效 | PENDING | 未测 |
| 现场性能与长时运行 | Hands callback FPS、Pose FPS、平均/最大推理ms、stale ratio、WebGL RAF、CPU/GPU | PENDING | 未测 |

判读：detected=2/assigned=1 优先检查归属层；detected=1 才属于 Hands 漏检。记录 `pose` / `fallback` / `grace` 与 `AMBIGUOUS_PERSON`、`AMBIGUOUS_SIDE`、`OUTSIDE_OPERATOR_ENVELOPE`、`HAND_JUMP`、`STALE`。`NO_POSE_WRIST`、`TOO_FAR` 是 fallback 触发原因，成功容错后不当作拒绝。

限制：这是短时空间追踪，不是身份识别；未被 Pose 检出的旁观者、完全遮挡或同位置替换无法得到可靠身份保证。可检测歧义应暂停；持续无法观察人体仍按1000ms丢失规则释放。不要用本轮软件结果宣称展厅实机验收通过。