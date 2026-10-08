# B03 V3.1 · 半身操作者与双手归属容错

任务开始于2026-10-07；2026-10-08追加恢复预览手势示意。基线：`11cb02238a87aba9d6c5bfaf18b26e758dab9f76`；执行前 fetch 和远程 master 只读核实一致。仅修改 B03 机器视觉、调试、测试与文档。任务前已有的人物10素材删除、模块A归档脚本修改和未跟踪作者素材保持，不提交到本次修复。

**Physical camera acceptance: PENDING**。本记录区分 Node 合成测试、Chrome 生产回调合成测试、真实双模型空白帧烟测及真人摄像头。前三者不能证明实际半身识别成功率。

## 根因与修复

V3 的 `body()` 同时要求双肩/双髋，且以四点平均作为人物中心。髋部出画会拒绝人体；如果只对缺髋分支换成肩中心、完整时仍用四点平均，又会引入anchor跳变。Hands 只按 Pose wrist 匹配，某只腕缺失/漂移就可能 detected=2、assigned=1；收拢时剩余一只 Pose wrist 还可能吸收两只 Hands 候选。

- 双肩达到现有 `.55` 置信度、肩宽≥`.08` 即建立人体。中央准入仍要求双肩在画面内，肩中心位于原 primaryZone；不会用单肩、降低置信度或扩大中央区准入。
- `center` 始终为肩中心，身份匹配、中央评分、移动距离都使用它。双髋是可选增强证据；`bodyMode` 为 upper/full，髋部缺失不按零分加入 confidence。腕缺失不影响人物成立。人体返回肩、腕、可选髋、torsoCenter 和 completeness。
- 800ms 连续候选、1000ms 丢失释放、原尺度比例与匹配半径保留。近/中/稍远肩宽与逐步前后移动经自动测试；突然跳变不因此获得抢锁机会。持续无法辨认人体仍可按丢失规则安全释放，不承诺遮挡中永久锁定。

## 手归属与仲裁

1. `matchHandToPoseWrist()`：线性扫描所有观测人体的左右 Pose wrists，优先取明确的近腕；旁观者更合理、人物/左右腕竞争则拒绝。未匹配到稳定 ID 的观测人体也参加竞争，避免漏掉追踪歧义中的旁观者。
2. `matchHandToOperatorEnvelope()`：只在当前操作者可观察且已锁定时容错。围绕肩中心按肩宽构造受限范围；横向±1.35肩宽，纵向按宽高比换算后上1.1、下1.6肩宽。比较手到肩的归一化距离、与人体的空间关系、带标签肩部的左右位置、上次side与连续轨迹、其他人的肩部/腕部竞争。此范围是标定起点，须按物理清单实测。
3. `resolveHandSide()` 使用未镜像的 Pose/Hands 坐标和带标签肩部；仅NEXT沿用镜像预览x。中心/交叉/轨迹与空间证据冲突时拒绝。缺失侧有连续轨迹且明显比剩余Pose腕合理时，该手进入fallback；不能把两手塞给一个腕。可靠双腕仍优先为pose。
4. 200ms grace 只保留 side/ownership，`source:'grace'`、`fresh:false`；旧点不推进开合、阅读或NEXT。多人/左右歧义及异常跳跃清空当前动作证据并暂停，保留人物锁；人体本身不可观察时也暂停post-reading释放计时，避免把“不明确”当成“已放手”。

原 V3 NAVIGATION/READING/POST_READING_LOCK 和原NEXT数学保持；双手neutral→展开→保持、收拢→保持、关闭后放手再准备均保留。手势仍只有NEXT，无PREVIOUS。归属计算为O(people×hands)，无新模型、像素扫描、RAF或高频DOM查询。

## 调试与模型加载

`?gestureDebug=1` 增加UPPER/FULL、肩宽、hips、Pose people/age、左右腕可见度、检测/归属手数、每侧pose/fallback/grace以及归属拒绝原因。`NO_POSE_WRIST`/`TOO_FAR`记录为成功fallback的触发原因；最终拒绝包括AMBIGUOUS_PERSON、AMBIGUOUS_SIDE、OUTSIDE_OPERATOR_ENVELOPE、HAND_JUMP、OTHER_PERSON、INVALID_HAND；过期帧为STALE。正式提示与摄像头预览CSS不改。按2026-10-08用户追加要求，恢复普通模式预览的金色手部连线与白色关键点；只取消绘制层的debug门控，调试文字仍只在debug显示。示意显示检测到的手，不代表该手已经获得操作权。

真实双模型初测三次冷启动超时；记录保留在local。相同固定资源预热HTTP缓存后真实推理通过；下载诊断显示WASM约9.6MB/10.9s、模型约5.8MB/13.3s，原15s总等待容易提前结束。延长等待的诊断复测仍失败，未保留这项参数变化；生产初始化等待保持15s。补充了超时后旧ready消息失效的保护与清理/重试测试。220ms帧时效、80ms提交节奏、800ms acquire或开合阈值均未放宽。模型冷启动网络稳定性仍依赖环境，失败尝试如实留档。独立Chrome禁用HTTP/2的冷启动诊断已通过实际双模型；这是验收运行参数，生产网络设置未修改，也不能据此确认所有网络环境正常。

摄像头320×240、Hands maxNumHands=4/modelComplexity=1/confidence=.6、Pose模型/人数/推理设置保持。开合距离继续采用画面归一化值（.25/.38/.16/.10），没有未经实测替换为肩宽距离；近远动作有效率仍待现场验证。

## 文件范围

生产：`Mural-Exhibition/public/operator-tracker.mjs`、`interaction-config.mjs`、`interaction-controller.mjs`、`pose-pipeline.mjs`、`index.html`（预览手势绘制恢复、调试字段和过期Pose统计）。

测试：`b01-check.cjs`（仅更新B03预览绘制保护断言）、`operator-tracker.test.mjs`、`interaction-controller.test.mjs`、`pose-pipeline.test.mjs`、`b03-gesture-harness.mjs`、`b03-gesture-fixtures.cjs`、`b03-gesture-browser-check.cjs`、`b03-pose-browser-check.cjs`。Fixture肩部标签修正为面向相机的未镜像左右；不修改人物或摄像头实际素材。Pose browser可选`B03_POSE_PREWARM=1`明确标记缓存预热诊断，默认仍测冷启动。

文档：`docs/B03_CHARACTER_STUDY.md`及本目录。未修改模块A/B01/B02、样式、材质、shader、人物数据、母版或正式素材、固定低保真归档。

## 验证结果

最终汇总在`regression-results.json`；`tests.txt`为全量测试输出；`gesture-results.json`为生产回调报告；`pose-runtime-results.json`为实际模型报告。所有失败尝试和完整回归截图在忽略的local中保留。Browser首次850ms单手hold只有约500ms有效hover；原220ms neutral在异步Pose加grace后不足，测试改为1200ms hold、420ms neutral并断言OPENING，生产手势时间未改。

十轮脚本曾出现一次ID变化，发生于换人后大步回中央的合成输入；改用四个连续位置回中央，记录ownershipTrace并在每轮动作内与移动前后断言ID一致。单元测试另外覆盖突然跳变拒绝，不能靠放宽匹配比例吞掉这项失败。另一次候选断言按墙钟400ms检查时页面已经锁定；最终依据浏览器事件时间校验新锁定至少经过800ms候选，参数未变，失败JSON仍保留。

精选截图清单与大小见`evidence-manifest.json`。截图是真实Chrome运行，摄像头图像/landmark均标记为合成输入，不当作真人检测证据。

## 剩余验收

[PHYSICAL_CAMERA_CHECKLIST.md](PHYSICAL_CAMERA_CHECKLIST.md)全部真人项目为PENDING PHYSICAL ACCEPTANCE，包括正常/近距离半身10/10锁定、开关≥9/10、多人/多手竞争、10轮完整周期、真实CPU/GPU/距离/光照与长时表现。空间追踪无法保证未被Pose检出的旁观者、完全重叠或同位置替换的真实身份；fallback只利用已有模型的可观察证据。软件测试中的零误触不是现场统计。
## 最终软件验收 · 2026-10-08

| 项目 | 结果 | 验证边界 |
| --- | --- | --- |
| npm test | 74/74 PASS，0 FAIL | 全量B01源码保护、B02/B03及布局/材质/动效/NEXT/OperatorTracker/InteractionController/PosePipeline测试 |
| 语法/构建检查 | PASS | 9个相关模块/脚本及生产入口模块编译；无单独打包build脚本 |
| 三视口生产回调 | PASS | 1440×900、1920×1080、1366×768；Camera/Hands/Pose消息链真实，模型输出合成 |
| 普通预览绘制 | PASS | 真实MediaPipe绘制helper；Canvas像素出现/消失，与原框边界一致；非真人手 |
| 半身漏腕NEXT | 36/36 PASS | 单手准备/挥动只前进，每次最多切一人 |
| 半身漏腕阅读开合 | 14/14 PASS | neutral→展开/保持、阅读、收拢/保持、POST_READING_LOCK |
| 完整浏览器使用周期 | 10/10 PASS | 每轮动作中ID保持；离开后释放，新操作者≥800ms重新获取；逐步回中央ID保持 |
| 单元漏腕周期 | 左/右/双腕缺失各10轮 PASS | 同一个operator连续阅读/滚动/关闭/放手/NEXT，不重锁 |
| 旁观者干扰 | 8/8被阻止 | 多手/跨人物竞争；受断言场景无误NEXT/误阅读 |
| 既有B03 functional/stage/hf/layout/surface/motion | PASS，0 page errors | 全部已有相关npm scripts；四视口/30次切换、鼠标键盘、图鉴与资源有界；部分测试用既有本地ID05材料 |
| 实际双模型烟测 | PASS | 独立Chrome、空白320×240合成图、实际模型；HTTP/1.1诊断，生产网络配置未变 |
| 摄像头/模型/RAF生命周期 | PASS | 单Hands、单Pose、活动Camera≤1、舞台RAF=1；退出Camera/RAF/Pose提交为0；旧会话与旧Worker消息无效 |
| 真人摄像头 | PENDING PHYSICAL ACCEPTANCE | 不能用上述合成/空白帧验证代替现场成功率 |

独立双模型烟测：稳定5秒窗口 Hands callback 30.316 FPS、Pose 10.105 FPS；累计平均推理60.248ms、含冷启动的最大388.5ms；稳定窗口stale Pose ratio=0。峰值超过220ms仍按旧规则拒绝，不扩大时效。Headless RAF平均6.356ms/最大37.600ms，不能换算为展厅显示器FPS或CPU/GPU验收。之前并发其他Chrome回归的烟测出现较高过期比率，报告保存在local，最终使用独立采样，不宣称负载下同样稳定。

归属微基准：4人体×4手，10,000帧，平均0.007681ms、P95 0.0097ms、最大0.7085ms；只测内存中的assign，不包括模型、相机、渲染或物理FPS。

合成过程的“零误触/零自动重开”仅指受断言的场景。所有失败/中间结果及网络诊断列在`regression-results.json.attempts`，原始文件保存在local；默认Chrome冷启动超时仍是环境相关风险，HTTP/1.1通过不能证明所有网络正常。

| 精选截图 | 状态与范围 |
| --- | --- |
| `selected/02-navigation-armed-1440.png` | 普通模式ARMED，真实绘制helper恢复预览骨架/点；合成hand |
| `selected/03-reading-1440.png` | 普通半身漏右腕阅读，双手归属有效；合成hand |
| `selected/06-upper-fallback-reading.png` | debug遥测UPPER/hips=false、detected=assigned=2、R=fallback；debug页绘制helper仍为stub，仅证明遥测，不作骨架视觉证据 |

三张共2,928,822 B（约2.79MiB）；文件hash见`evidence-manifest.json`。完整13张手势截图（含精选的原始捕获）及完整视觉回归/录像留在local，不删除历史证据。
