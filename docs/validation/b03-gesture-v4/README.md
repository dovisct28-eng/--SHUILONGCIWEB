# B03 体感 V4：单手空间驻留

实施基线：`6a7b6f328e84a98a833178821586f1c669383332`。2026-10-08 开始时 fetch 后本地 HEAD 与 origin/master 一致。范围为 B03 交互及相关测试、文档；交付结论分为软件自动化和真人摄像头两部分。

## 交互结果

锁定观众后，用归属于该人物的一只手控制屏幕指针。查看 / 返回、下一人物两个目标使用真实 DOM 命中矩形，稳定驻留默认 1000ms；动作后必须稳定移出所有可用目标 250ms 才能再次操作。非交互区的另一只可见手不取消控制，两手竞争、跨人物归属、失效 Pose、加载和转场仍阻止操作。

状态路径为 `NO_OPERATOR → READY → TARGET_HOVER → DWELLING → TRIGGERED → WAIT_RELEASE → READY`，追踪失效、歧义和转场另有暂停/阻断状态。阅读模式隐藏 NEXT，返回后不会原地重开；长文通过上下位置与真实时间滚动 `#info-text`，中央静止区停止滚动。短文不显示阅读提示。

旧轨迹 NEXT、手掌张开分类和双手展开/合拢默认逻辑已删除；旧生产状态机和相应断言退出。鼠标与键盘继续走原展示入口。人物 Alpha、几何、材质、适配、环绕算法、顺时针反馈、原摄像头 DOM/CSS、320×240 输入和模型会话保护保持。

详细说明：[architecture.md](architecture.md)、[test-results.json](test-results.json)、[browser-results.json](browser-results.json)。

## 实际检查

| 检查 | 结果与范围 |
|---|---|
| `npm test` | 63/63；指针、驻留、实际 onResults VM 生产链、空/缺 landmarks、旧会话、归属、竞争、释放、帧率、阅读及原舞台测试 |
| 构建 / 语法 | 本模块是 Express + 原生 ES 模块，无打包构建命令；入口静态契约及所有变更脚本 / 内联模块语法通过 |
| V4 Chrome | 四视口 1280×800、1366×768、1440×900、1920×1080；目标矩形避让、真实进度、查看/返回/NEXT、十轮完整操作、末尾循环、阅读滚动、键盘焦点保护、隐藏、三次重入、诊断开关 |
| 既有 B03 | 人物舞台、极端 Alpha / 旧素材降级、布局、材质、30 次原转场、退出与资源回收；专用识别由 V4 生产链套件覆盖 |
| B01 / B02 / A08 | 四视口 B01、进入/返回、权限与依赖故障；B02 媒体互斥 4302 帧、36 个截图；实际 A08→B01→返回路由。模块 A 其余章节未重新全面视觉验收 |
| 真实模型 | 固定 CPU Pose Worker 和现有 Hands 在空白合成 320×240 图像运行，默认 Chrome 网络；初始化 10824ms，Pose 8.24 FPS，回调约30.21 FPS，采样 Pose 过期比例27.27%；退出模型、摄像头、RAF和GL资源归零，重入单实例 |
| 真人摄像头 | **PENDING**，不得根据以上结果填入真人成功率 |

Chrome 测试实际渲染 Three.js / GSAP 和页面。驻留套件的摄像头像素、Hands 与 Pose 输出为合成输入；真实模型测试仍为空白合成图像。页面截图不是真人体感证据。故障用例中预期出现的404另行记录，不等于正常路径页面错误。

## 失败记录与限制

早期截图采集跨越驻留时长，使下一次断言看到已触发状态；现用独立新驻留尝试，并在同一次浏览器求值中读取进度值。早期资源繁忙时曾安全释放人物锁，原脚本错误地假定锁永不消失；现在记录重锁并要求实际获取与释放成功后操作，没有放宽人体归属阈值。末尾 `7 !== 0` 经前后索引与调用记录确认：体感末项循环成功，随后点击“上一组”使按钮保持焦点，页面既有快捷键保护阻止了方向键；测试现分别验证焦点保护和页面快捷键。

旧浏览器用例中的 opacity 等待和“尺寸不一致”文案与实施基线 B02 的单媒体显示、内部尺寸诊断冲突；只迁移测试，不恢复产品诊断文案。动效套件的旧挥手断言改用原生 NEXT，保留舞台保护检查。早期动效快照的跨调用延迟也改为原子采样。早期 A08 路由测试因本地4175服务未启动失败，启动静态服务后重测。各失败摘要、最终结果和采集状态保留在 JSON；重复原始截图 / 视频保留在忽略的 local 中。

本轮没有真人站位、距离、多人遮挡、低光、十轮成功率或十分钟误触数据。模型帧率和初始化仅是当前机器当前网络测量，不能保证展示硬件或冷启动。本次通过不抹除 V3.1 历史冷启动超时。重素材加载是否频繁导致重锁需现场观察。

CDN 依赖尚在；资源本地化仅完成调查，未实现离线启动。见 [resource-localization.md](resource-localization.md)、[resource-audit.json](resource-audit.json)。具体模型权重许可、第三方 NOTICE 和本地兼容验收仍待核实。

## 精选证据与文件范围

必要状态与代表视口放在 `selected/`，清单记录原始截图、采集状态、大小及无损像素校验。`04-triggered` 表示动作触发后的真实展示状态；瞬时 TRIGGERED 事件由生产回调记录验证，不声称截图冻结在该状态。`02-target-hover` 为进入目标后的早期驻留。保留一张失败帧和一个极端 Alpha 降级帧，不隐去失败或边界。

精选共13张，总计9,246,474字节；采用无损WebP，逐张解码RGBA与原PNG完全一致，不缩小、不裁切、不修改页面内容。原PNG及重复采样、测试录像保留于被忽略的local目录。

生产修改：`public/index.html` 的 B03 交互区、`public/b03.css`、`public/interaction-config.mjs`；新增 `gesture-pointer.mjs`、`dwell-controller.mjs`、`dwell-feedback.mjs`。新增指针/驻留/生产链单元测试与驻留 Chrome 套件；迁移相关旧浏览器测试、package 脚本和旧 VM fixture；删除 `next-gesture.mjs`、`interaction-controller.mjs` 及旧专用测试 / 契约。完整文件清单见 test-results.json。

Module A、移动端、B01/B02生产文件、人物元数据及素材没有本次改动。作者已有的素材新增/删除、归档脚本编辑和历史未跟踪证据没有进入本次提交。固定低保真 Tag 解引用与归档分支均为 `48f272497e86e4549c5bcd0dee275ff347171a3f`。

## 复现

在 Mural-Exhibition：`npm test`、`npm run test:b03-dwell-browser`，其余相关浏览器脚本见 package.json。当前 Windows 可设置 `NODE_PATH=C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`，使用已安装 Chrome。各浏览器脚本支持本轮 JSON 中列出的输出目录环境变量；A08路由回归需要根目录静态服务 http://localhost:4175。

现场流程及记录表：[PHYSICAL_CAMERA_CHECKLIST.md](PHYSICAL_CAMERA_CHECKLIST.md)。运行 `node server.js`，打开 http://localhost:3000/index.html；诊断入口附加 `?gestureDebug=1`。
