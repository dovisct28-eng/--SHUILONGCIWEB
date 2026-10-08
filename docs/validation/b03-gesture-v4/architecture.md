# B03 V4 架构与责任边界

基线：`6a7b6f328e84a98a833178821586f1c669383332`，2026-10-08 fetch 后本地与远程 master 一致。

## 识别链

Camera.onFrame 捕获同一张 320×240 图像 → Hands / classic Pose Worker → OperatorTracker 双肩人体、候选与锁定 → wrist / 肩部范围归属 → GesturePointer 控制手选择、映射和滤波 → DwellController → 原 requestReading / setRevealed、loadSeriesData、顺时针推进反馈。

OperatorTracker 的人物匹配、800ms 获取、1000ms 离场释放、220ms Pose 时效、竞争人体、缺腕受限 fallback 和细化拒绝信息保持。没有降低归属阈值、没有跳过人体锁定。第一阶段先通过归属与指针测试，再实施驻留。

## 控制手与坐标

Hands landmark 0 / Pose landmarks 使用原始、未镜像坐标进行归属。归属完成后 OperatorTracker 只在 landmark 9 的 x 上执行一次 `1-x`。GesturePointer 不再镜像，使用镜像后的 palm x/y，将可配置输入范围 x/y `[.2,.8]` 线性映射为浏览器视口像素并限制在视口内。摄像头预览保持已有镜像、320×240 输入和原布局。原图内容没有镜像或改色。

归属手的身份键为 `visitor ID:left/right`，不依赖 Hands 检测数组顺序。已有手在目标中时继续控制；已有手在非交互区而另一只有效手明确选择目标时，允许切换，驻留重新开始。两只有效手竞争任何目标或阅读区域时暂停；人体歧义、同腕竞争和跳点保留原拒绝。非交互区的另一只手不会单独导致取消。

时间相关指数平滑默认 75ms，明显移动时 28ms；高速运动需重新稳定 140ms，大跳点拒绝，不直接跳到另一目标。短暂手丢失 / Pose 过期冻结并减弱指针，200ms 后清除。过期点不推动驻留，身份改变清除旧进度。所有参数在 interaction-config.mjs。

## 状态与互斥

主要状态：NO_OPERATOR → READY → TARGET_HOVER → DWELLING → TRIGGERED → WAIT_RELEASE → READY。

优先级阻断：BLOCKED / TRACKING_PAUSED / ACTION_TRANSITION。NAVIGATION 允许查看和 NEXT；READING 仅允许返回及阅读滚动；TRANSITION 禁止体感动作。动作锁由真实加载标志、人物阶段、环绕阶段、阅读 750ms 稳定窗口、页面隐藏和摄像头运行状态决定。

驻留默认 1000ms，目标可单独指定 dwellMs，进度按有效观测的真实时间累计。单步最多 120ms；超过 200ms 的观测间隔重新开始，不通过卡顿补帧一次完成。短暂丢失暂停累计，恢复第一帧不补算丢失时间；长期丢失、明确歧义、换手和禁用目标取消。

一次驻留只返回一个 OPEN / CLOSE / NEXT 事件。动作之后保留释放锁；只有当前控制手的新鲜、稳定坐标连续 250ms 位于所有可用动作目标之外才能解除。时间到了或手消失都不能自行解除。人物身份重获也不能继承原驻留。

OPEN/CLOSE 调用同一 requestReading / setRevealed。NEXT 仍调用 `loadSeriesData(currentSeriesIndex + 1)`，末尾循环，不增加体感 PREVIOUS。鼠标和键盘仍可上一人物、下一人物、I / Escape；两个新增目标也支持原生按钮操作。

## 阅读与反馈

#info-text 是唯一滚动对象；正文确实溢出时，DOM 正文矩形才成为阅读控制区。中央高度 16% 是静止区，向上/下偏离产生对应方向的速度，最大 420px/s，按真实 dt 积分；单步最多 200ms。返回目标、任何追踪/归属失效、隐藏或转场立即停止。阅读区提示位于正文外侧原留白，不压正文；短文不显示提示。

DOM/SVG 两目标默认中心位于视口 x=13% / 87%、y=61%，128×76px。命中区来自按钮实际 getBoundingClientRect；透明矩形包含图标和标签，是可触达范围。它们作为原 OrbitStage 的局部 forbidden 区域参与原自动避让，不修改人物适配、Alpha、纹理、材质、轨道算法或既有转场。

光环与真实进度绑定；动作后 450ms 完整光环和确认亮度，指针失效冻结/淡出。更新复用原 renderWebGL 调度及 Hands 回调，没有新增永久 RAF、renderer、循环计时器或纹理。gestureDebug=1 才显示 CAMERA / PERSON / HAND / INTERACTION 各阶段及细化归属原因，正式提示不显示错误代码。

## 工程边界

旧 next-gesture.mjs、interaction-controller.mjs 与旧轨迹/双手行为断言已删除，Git 历史可回溯；生产只运行一个 DwellController。b03-gesture-browser-check.cjs 指向 V4 浏览器验证。旧 VM harness 仅保留合成 body/hand 数据，新 production harness 读取实际 HTML 中的 onResults 与处理函数。

B01/B02 部分旧测试还等待 style.opacity=1，与基线 B02 已完成的 hidden/display 互斥修复冲突。本次仅迁移测试的等待条件至 image-wrapper.dataset.media；B01/B02 生产代码、图片互斥实现和素材不改。动效专项的旧挥手断言迁移为原生 NEXT，识别由独立 V4 生产回调专项验证，其余材质、布局、30次转场和回收测试保留。

模块 A、移动端、低保真归档、人物元数据和所有素材均不在本次提交范围。工作区既有作者素材、删除与归档编辑保留，不能用本次提交替作者同步它们。
