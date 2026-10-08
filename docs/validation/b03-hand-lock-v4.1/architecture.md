# V4.1 架构与状态边界

Camera → MediaPipe Hands + PosePipeline → OperatorTracker → HandOwnership → GesturePointer → DwellController → OPEN / CLOSE / NEXT / SCROLL。

- OperatorTracker：800ms 中央人物获取、1000ms 人物丢失释放、手腕/肩部归属、语义左右手、新鲜度与歧义拒绝。本次不修改。
- HandOwnership：唯一的控制手身份源。WAIT_HAND → HAND_CANDIDATE → HAND_LOCKED；无效观测进入 HAND_PAUSED，650ms 后 HAND_RELEASED，下个合法输入重新候选。人物锁消失即撤销输入；正式释放/替换清空手锁。没有身份 fallback。
- GesturePointer：只消费与 lockedHandKey 完全匹配的 selectedHand，验证 fresh 与 operatorId；不选择数组首手、不候补另一侧。沿用输入范围、指数平滑、速度/跳变拒绝和140ms稳定窗口。恢复时重新建立平滑历史。
- DwellController：按钮互斥、1000ms有效驻留、动画/阅读锁和动作后的 WAIT_RELEASE。无效输入取消累计，控制手更换也清空。releaseRequired 只由新鲜稳定的控制手在动作区域外满足250ms解除。WAIT_HAND不等同WAIT_RELEASE。

首次锁手与每次恢复都从零开始驻留。已有动作后的释放锁独立于手锁寿命：新手被锁定时，也必须移出动作目标后才能继续。失联不能替代释放。

HAND_LOCKED 下非控制手只出现在诊断 ignoredHands/NON_CONTROL_HAND_IGNORED 中；不会成为有效 pointer，也不会以“正常第二只手出现”为由阻断原手。但上游 AMBIGUOUS_PERSON、AMBIGUOUS_SIDE、HAND_JUMP、Pose过期和人物不可观测仍整体暂停。

加载/转场继续运行现有识别链以维持人物和手身份，但禁止动作。loadSeriesData 只调用驻留动作锁，未新增手锁 reset。隐藏、stopMediaPipe、退出和pagehide清空手锁；复用原 renderWebGL 的 tick 在没有新回调时使旧输入失效，未增加推理或渲染循环。tick不创造新鲜手观测，不延长 lastSeenAt。

诊断由 ?gestureDebug=1 门控，包含人物状态/身份、手锁状态/候选/持续时间/失联时间、检测与归属数量、被忽略手、指针有效性/稳定性、目标/进度/释放约束以及上游拒绝原因。摄像头预览 DOM、尺寸、镜像、绘制风格和启停实现保持原样。
