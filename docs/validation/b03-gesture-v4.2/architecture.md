# B03 V4.2 生产架构与安全边界

Camera → 单次320×240采集 → Hands / Pose → OperatorTracker → HandOwnership → GesturePointer → DwellController → 原查看/返回/NEXT/正文滚动。

## 生命周期唯一所有者

CameraLifecycle管理 IDLE、LOADING_RESOURCES、INITIALIZING_MODELS、REQUESTING_PERMISSION、STARTING_VIDEO、WARMING_UP、RUNNING、DEGRADED、ERROR、STOPPING。现有Camera工具仍是唯一视频采集调度器；现有renderWebGL调度器负责tick/显示，没有额外RAF或常驻推理定时器。

Hands显式初始化后才准备Pose；资源、模型、帧转换、Hands推理各有可取消15s截止。Pose初始化自身也是15s，真正的在途任务无返回5s判为运行错误，模型/Camera清理最多等待5s；清理不能确认完成时阻止新实例，明确要求刷新。权限弹窗等待不设该截止；浏览器没有取消其原生请求的通用方式，退出时取消后续操作并关闭轨道，直到旧Camera.start结算才能启动新会话。排队重试再次检查当前模式/隐藏状态。Camera.stop拒绝时仍清理轨道和模型，不产生未处理拒绝。

正常退出关闭Hands并安全复用已初始化健康Pose Worker；异常Worker、帧转换失败、真正卡死必须终止/重建，不只是清error。Worker、session、job的身份校验拒绝迟到消息；取消的bitmap在返回后关闭。隐藏会停止流与输入，恢复重新确认人物/手，已有动作移开锁保留；卸载完整dispose。

## 时间语义

| 字段 | 含义／时钟 |
|---|---|
| handsFrameAt / handsCapturedAt | 主线程performance.now采集图像时刻，原画布冻结至send与onResults均结算 |
| pose.latest.at / capturedAt | 同一主线程采集时刻，通过Worker消息原样传递 |
| pose.receivedAt | 主线程收到匹配当前job的Pose结果时刻 |
| inferenceMs | Worker内部performance.now之差，仅是耗时；不将Worker绝对时钟作为主线程时刻 |
| HandOwnership / Dwell now | 当前新鲜回调/调度器的主线程performance.now，不能用旧坐标补帧 |

Hands有效采集年龄独立上限160ms。Pose起始220ms；至少8个有效本Worker结果后，预算为max(220,采集至返回P95+返回间隔P95+35)，再min(360)。两个统计保留至多120个样本；健康Worker的近期耗时可保留用于重入预算，新Worker重新测量，最新Pose数据与返回间隔在新会话重置。诊断区分推理耗时与含转换/调度的采集至返回延迟。返回/提交FPS、输入与Hands窗口在新会话重置，权限与模型等待不混入当前FPS。

这是有界软件起始策略，不是实机标定承诺。过期观测不分配新手、不推进驻留；短暂波动可以安全暂停已有身份，长期失效依旧释放。人物获取800ms、丢失1000ms、手锁获取350ms、丢失650ms、长间断重稳250ms不放宽。恢复仍需新鲜观测；短间断指针重新稳定60ms，新的锁定/跳点使用原140ms稳定窗口。

## 控制手与动作分离

候选只来自当前人物的fresh归属手，并处于原gestureZone（x .08–.92/y .18–.80）。不使用屏幕按钮作为获取条件，也不增加新的未经实机验证的获取范围。单个候选需连续350ms；每帧跳变或相对候选起点漂移超限重置证据。候选使用同一DOM指针、valid=false；多人/手侧歧义立即隐藏，不能执行动作。正式身份为operatorId:side；检测数组顺序不改变身份。

未锁时两只合格候选争夺控制权必须暂停；已锁时第二只手进入既有目标不能接管。少量不可解释噪声、跨人物关联、重复语义手侧、跳变仍被上游拒绝，不用最大手或人脸识别补猜。指针使用原映射/时间滤波，palm x由OperatorTracker镜像一次；目标使用实际DOM矩形，四视口检查保持。

## 驻留、暂停、释放

动作仍要求人物可观察、正式手有效、指针稳定、处于目标、无加载/转场锁和累计1000ms有效时间。安全短间断≤200ms且同人物同手才保留已有进度；失联、恢复确认期间不计时，首次恢复帧也不把间隔补回。超过窗口、身份改变、明确移出、归属歧义、不稳定跳点与转场取消。

releaseRequired不因无手、换手、重新获取或隐藏自动解除，必须fresh稳定控制指针在全部可用动作区外250ms。OPEN/CLOSE互斥，阅读态隐藏/禁用NEXT；NEXT只向前并在末尾循环。正文只滚动原#info-text；候选、丢手、歧义和转场停止滚动。

## 诊断与隐私

gestureDebug=1显示阻断原因、视频状态、输入/Hands/Pose时序、原始/新鲜/有效归属手数量、人体与手锁、指针、驻留及错误来源。普通模式仅简洁中文反馈、原骨架和必要候选/正式指针。

调试导出按钮主动下载本地JSON。/api/b03-runtime返回实际git HEAD SHA和限定B03代码是否有工作区改动；没有git时SHA为null，不编造。导出只包含环境、指标、状态、错误和临时ID，不含图像、视频或人体关键点，不自动上传。新server.js路由需要重启旧Express进程；验收脚本不会终止未知占用端口的进程。

实际浏览器WebGL与页面保持，模型/视频合成输入均明确标注。真实双模型空白帧检查不是人体识别验收。真人结论见PHYSICAL_CAMERA_CHECKLIST.md，全部PENDING。
