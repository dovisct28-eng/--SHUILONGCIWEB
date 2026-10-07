# B03-HF-04｜动态环绕、空间层级与壁画质感深化

2026-10-07。开发前 fetch 并核实 `HEAD = origin/master = 94e30cebe8ae7ca39235afd8513c86436c0a4bf8`。本轮交付 B03 表现层实现、实际浏览器动态证据与回归结果；作者最终审图、不同正式人物对比和展厅物理验收仍待进行。

## 实现内容

- 保留环境 → 轨道/观察窗 → WebGL 人物的现有 stacking context。人物仍在 z-index 2、OrbitStage 在 1；通过尺度、亮度和透明度区分景深，没有拆分 WebGL 或强行穿插人物。山谷保持静止，人物后方增加弱压暗。
- HF-02 原布局输出和算法逐字节不变。表现层按 ID seed 自动选一个 PRIMARY，其余为 SECONDARY / TERTIARY / CONTOUR。原布局是位置预留区，新增尺度先验证完整漂移、旋转与焦点放大包络；空间不足时减小装饰。外层维持布局，内部两层分别承担漂移和焦点。角度 ±1.2°，焦点额外 3%，漂移按视口约束 X 4–10 / Y 5–14px、9–18秒；紧邻安全边界时允许关闭位移。默认布局恢复后参数也保持一致。
- 主轨36秒、反向副轨27秒；方向由 ID seed 决定。主轨每周期偏移等于完整 dash 图案长度，避免周期末跳变。floor 16秒轻明暗。只复用原三条轨道，增加两个固定 pulse path，没有新 RAF、setInterval、持续粒子或 DOM 扩容。
- 单实例 GSAP delayedCall 巡游，空闲6–9秒后触发一个1.3秒事件。当前窗透明度增加约12%、缩放3%、边框随亮度提高，其余降低6%；同一事件内1.1秒小段亮线从人物侧节点沿 connector 到 panel。输入、切换、收放、降级、偏好变化、页面隐藏和退出均取消旧任务。停止状态无持续 CSS 动画。
- 切换：旧 panel 180ms淡出并缩小6%，connector/node熄灭，旧轨略收紧；旧主体延迟80ms开始退场并退回颜料暗部。下一图像同时 fetch/decode；200ms退出等待可由 AbortController 取消，不阻塞新输入。资源 ready 后沿用 HF-03 pigment reveal，再建立轨道和按空间方位排序的25ms错开面板。首次显影1.05秒、缓存0.82秒，缓存切换表现约1.02秒加运行开销；网络慢时资源等待不承诺1.3秒内完成。原 version / stale / LRU 保护继续有效。
- 双手展开/收拢、鼠标和键盘继续走同一 `setRevealed`，轨道先进行220ms的3%展开或2%收拢反馈，简介延迟220ms显现。原安全布局和移动过程的面板隐藏策略保留。挥手既有视觉反馈函数增加200ms方向 pulse；手势 handler、分类、阈值、冷却和滚动计算均未改。
- Standard 调为 grain .042 / erosion .062 / cracks .0025 / edge .026 / blend .012；仍与 Strong 分离。高频颗粒、约62px中尺度及180px低频场共同调节局部RGB明暗；稀疏细裂纹、真实Alpha邻域的边缘明暗，不改Alpha、轮廓或源文件。低亮度像素材质变化降低到18%起步，保护原黑线。没有暖色蒙版或统一泛黄。彩色观察窗从原RGBA重新 `treatPanel`，约主体55%强度，不累积处理。程序化纹理是展陈候选效果，不能作为真实矿物颜料或文物残损数据。

## 明确未修改

Camera start/stop、权限、MediaPipe、摄像头预览DOM/位置/尺寸/边框/透明度/状态、手势算法；figure、org、line、color、info、meta和视频原素材；人物姓名、英文和资料；B01/B02/图鉴功能；模块 A；`figure-stage.mjs`、`orbit-layout.mjs`；固定低保真归档。

`index.html` 仅增加 B03 表现层接入和可取消退场协调。新增源码保护测试直接对本轮基线比较 Camera CSS、DOM、生命周期和完整手势函数。249份文件的实际字节/Git blob保护结果见 [asset-integrity.json](asset-integrity.json)，包括任务开始前已有 ID10→08 本地改名资源的原字节核对。既存未提交作者素材、归档脚本/说明改动、图片删除和无关截图均排除本次提交。

## 测试与实际运行

以下命令均已实际通过；完整结果、回归图和诊断保留 `local/`。汇总见 [test-results.json](test-results.json)。

| 命令（在 Mural-Exhibition 内） | 结果 |
|---|---|
| `npm test` | 25项通过；含HTML模块解析、旧shader方程、Camera/手势保护、漂移/焦点完整包络、CPU Alpha与暗线保护 |
| `npm run test:b03-browser` | 原主流程＋作者专项通过；合成双手/挥动、摄像头生命周期、快切、资源失败、晚到请求、图层/视频/校准/退出 |
| `npm run test:b03-hf-browser` | 四视口默认/展开/恢复、实际轮廓避让、快速反转、长简介与旧素材兼容通过 |
| `npm run test:b03-layout-browser` | 正式01、本地05、八ID兼容、九类有效合成轮廓及无效Alpha、四视口两布局与恢复、resize/晚到数据通过 |
| `npm run test:b03-surface-browser` | Shader、材质档位、缓存、20次快切、14轮收放、迟到资源、降级、reduced-motion及退出GL归零通过 |
| `npm run test:b03-motion-browser` | 15秒实际CSS/GSAP采样及录屏、四视口真实内框包络、单焦点任务、30次打断、最后输入胜出、方向反馈、降级/低动态/退出通过 |
| `npm run test:browser` | B01四尺寸、权限/依赖错误与恢复、6次会话全部停止、原A08入口及返回通过；A只读运行 |
| `npm run test:b02-browser` | 八热点、全景/缩放平移、原图层、扫描/保存/取消/解绑/错误恢复及临时fixture清理通过 |

原生静态前端＋Express没有打包构建命令。模块/cjs语法、HTML脚本解析、实际Shader编译和 `git diff --check` 用作本项目构建边界检查，不宣称产生了打包产物。运行依赖仍为本地原方案。录屏额外使用 Playwright 官方 FFmpeg，安装在忽略的 `tmp/playwright`，未加入生产依赖；动态专项在检测到该本地runtime时自动使用它。

## 材质与资源证据

1440×900稳定态实际GPU对照：Standard/OFF **Alpha差异0**、透明区RGB差异0；OFF与不挂shader的原MeshBasicMaterial **RGBA差异0**。Standard改变38,709个非透明显示像素。暗像素RGB绝对变化均值约.076，亮像素约4.060（不同亮度样本集合，支持黑线保护，不等于语义识别或物理材质测量）。观察窗另有CPU单元测试确认原数据不变、Alpha不变、透明RGBA不变、关闭恢复和处理不累积。

15秒观赏中：CSS dashoffset及内框transform持续变化，观察到一次巡游；5个panel池、1个SVG、纹理数不增长。30次快速切换后ID01正确，最多两套本地figure缓存/两张纹理，未增加renderer。退出后stage inactive，focus/delayedCall/ack/ready及所检查的stage tween均0，GL纹理/几何/缓存归0。软件采样和有限回归证明本次测试窗口内未观察到累积，不承诺展厅长期FPS或全部GPU资源测量。

## 视觉审阅与精选

正式ID01实际Chrome运行检查：1920×1080、1440×900、1366×768、1280×800的默认、展开与恢复；额外检查巡游焦点、切换退场、OFF/Standard。动态通过15秒时序采样、录屏实际播放和跨时点审阅检查，不能仅凭下面静态图推定动效通过。原始约22秒录屏及准确15秒的稳定态片段 `local/stable-review-15s.webm` 留本地。

本轮审阅判断：人物和名称保持最高注意力，主局部较明确，其他窗及轮廓弱化；轨道流动可从跨时点看到，面板位移小，焦点/脉冲没有持续抢占主体。中尺度明暗与颗粒仍有意保持克制，源figure本身的平整色块不会被改写成真实墙面。材质“足够可见”和动态“足够安静”属于视觉判断，作者仍应在目标显示设备确认，不能以像素差异数替代最终审图。

| 精选 | 状态 |
|---|---|
| [1920默认](selected/formal-01-default-1920x1080.webp) | 正式01、Standard、层级/全景 |
| [1440默认](selected/formal-01-default-1440x900.webp) | 常规桌面、Standard材质对照复用 |
| [巡游焦点](selected/formal-01-panel-focus.webp) | 1920、单窗提亮/connector事件关键帧 |
| [人物切换](selected/formal-01-switching.webp) | 1440、旧正式01退场，下一选择为本地05；界面标题已更新、旧主体仍收束 |
| [简介展开](selected/formal-01-revealed.webp) | 1440、原revealed安全布局 |
| [材质关闭](selected/material-off.webp) | 1440、原figure显示对照 |

精选6张，共5,042,336 B（约4.81MiB）。无损WebP与原PNG尺寸及RGBA逐一一致；清单/哈希见 [evidence-publication.json](evidence-publication.json)。1366/1280边界图、重复恢复图、错误诊断及全回归留local，未删除历史证据。可用 `node b03-hf04-evidence.cjs` 重新核验保护和整理本轮已有浏览器证据（需要sharp和完整local结果）。

## 问题记录与限制

专项发现旧选择流程调用 `setRevealed(false,true)` 会把刚开始退场的orbit立即settle，已增加仅重置界面状态的分支并重跑。旧“Standard裂纹必须0”测试已按HF04新要求更新，仍测试安全上限和OFF严格关闭。初次动态测试接入在GSAP加载前读快照，补充加载保护。沙箱下旧结果目录/Node写入EPERM，使用已授权项目目录的提权执行并改为本阶段local。初次录屏缺FFmpeg，补齐官方临时runtime后重新跑通。失败诊断仍留local，不用筛图掩盖失败。

**软件模拟通过不等于展厅真实摄像头和真实观众动作完成物理验收。** 本轮Camera替身和合成MediaPipe landmarks验证软件路径；真实权限、光照/距离、识别可靠性、实际挥动方向与物理动作、长期相机并行GPU负载仍待展厅实机验收。实际浏览器预览出现摄像头已连接仅是单次运行观察，不能扩展为上述硬件通过结论。

正式透明figure仍仅ID01；05为任务前已有未提交本地作者素材，只用于补充切换验证，本次未发布它。不同正式figure视觉验收仍需更多正式素材。其余人物继续原line/color兼容，不把合成几何或概念图当真实人物证据。人物资料沿用作者原文，本轮未重新核验其历史解释或来源，也没有新增说明文字。

本轮commit与远程核实SHA以交付回复和Git元数据为准；完成软件验证与文档后自动commit/push，禁止强推。作者最终视觉确认和物理实机验收单独保留为后续事项。
