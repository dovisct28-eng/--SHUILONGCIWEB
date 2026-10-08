# B03 V4.2 摄像头与手势识别稳定性修复

2026-10-08；实施基线 `7a0e2947269529854787edcb0d0fd25f82be9562`。**软件验收 PASS，真人摄像头验收 PENDING。** 本记录随修复提交；最终发布 SHA 由 `git log -1 --format=%H -- Mural-Exhibition/public/camera-lifecycle.mjs` 或交付报告核实，测试时导出的旧 HEAD 同时标记 `workingTreeChanged=true`，不冒充发布 SHA。

## 实际修复

- 单一 CameraLifecycle 管理资源、模型、权限、采集、推理、退出和重试。原生权限等待与模型超时分开；旧权限请求未结算时不启动第二个会话；排队重试重新检查模式和隐藏状态。失败流关闭，Hands 按会话关闭，异常 Pose Worker 真正销毁并初始化新 Worker，迟到回调不能污染新会话。
- Hands 采集年龄独立上限160ms；Pose 使用主线程采集时间，返回时间与 Worker 内耗时分别统计。初始220ms；至少8个有效本 Worker 样本后，以延迟P95 + 结果间隔P95 + 35ms计算，硬上限360ms。过期数据仍不能分配新控制手或累计驻留。
- 单手在现有 gestureZone 内先显示无动作权限的候选光标，连续350ms后正式锁定，无须先命中按钮。保留人物ID/左右侧硬身份、双手初始竞争暂停、另一只手不得接管与原坐标映射。
- 同人物同手的安全间断最多200ms保留进度，失联、稳定恢复和首次恢复帧都零累计；歧义、换人、跳点、移出和转场取消。动作后必须新鲜稳定移开250ms，失联/重入不能解除移开锁。查看、返回、单向NEXT、末尾循环和阅读滚动沿用原交互。
- Debug 区分别显示原始、新鲜、归属手数量，采集/返回、P50/P95、人物/手锁、阻断和错误来源。主动导出本地 JSON，含实际 git SHA/软件改动标识；无视频、图像、关键点，不自动上传。普通模式保留原预览、骨架、按钮和舞台，仅必要获取反馈。

详细证据见[根因](root-cause.md)、[生产架构与边界](architecture.md)。现场截图239ms只足以说明该采样点超过旧220ms，不能证明每帧失效或确定所有连接故障来自CDN。

## 验证与限制

| 范围 | 结果 | 证据／边界 |
|---|---|---|
| npm test | PASS · 107/107 | 原 B01/着色器保护、B02/B03、实际 HTML 回调、生命周期、Worker、时序、单手与驻留安全；[test-results.json](test-results.json) |
| B03 专项真实页面 | PASS · 14场景 | Chrome/WebGL/实际 Camera.onFrame→Hands.onResults；模型/视频为合成输入，覆盖四类原生异常、模型失败、运行错误、新 Worker、隐藏恢复、十次切换与迟到权限 |
| B03 驻留全页 | PASS · 四视口／10轮 | 1280×800、1366×768、1440×900、1920×1080；查看/返回/NEXT、末尾循环、左右手、多人归属与移开锁；最终10轮中1次负载下安全释放后重新获取，不能声称无失联 |
| B01/B02 | PASS | B01四视口、6次合成会话最大1且全部停止、A08入口返回；B02四视口/8热点/30与50压力/30次访问；B02媒体3633监测帧、36状态截图与10轮视频释放，无违规 |
| 固定版本双模型 | PASS · 空白合成图像 | 实际 legacy Hands 与 Tasks Vision0.10.21 CPU Pose/WASM；稳态 Hands30.30/Pose9.90 FPS，采集至返回P50/P95=88.7/114.9ms，推理74.9/101.2ms，结果间隔P95=127.3ms，测得预算277.2ms。该稳态窗口过期2.61%，含首段的累计6.55%；不等于人体识别成功率 |
| 实机启动工具 | PASS · --no-open | 真实 Express/Git 元数据和12项PENDING记录创建；未打开Chrome、未使用摄像头 |
| 真人与现场 | PENDING | 冷启动×10、重入×10、左右手、双手、多人、遮挡、负载与10分钟无意动作；[完整清单](PHYSICAL_CAMERA_CHECKLIST.md) |
| GPU／进程内存／离线模型 | NOT_TESTED | JS堆与资源计数不能证明硬件性能；本次保留原CDN和模型版本，未本地化 |

[浏览器汇总](browser-results.json)、[相机与真实模型诊断](camera-diagnostics.json)、[语法与保护检查](build-results.json)明确区分最终 PASS、历史 FAIL、现场 PENDING 和 NOT_TESTED。真实模型退出时摄像头/Hands/启用Pose/RAF/纹理/几何体归零；健康的单个闲置 Pose Worker 可复用。真实模型冷启动曾有一次 Hands 初始化15秒超时，后续通过不取消该风险；其网络根因尚未确认。首段推理568.1ms超过360ms上限时仍拒绝旧结果，未用大阈值掩盖。

阶段 `local/` 保留原始与重复回归输出以及失败尝试，由既有忽略规则排除。正式汇总记录原始文件路径和SHA256；[5张精选截图清单](selected/manifest.json)共3,111,640字节，无损WebP、无缩放或裁切，逐像素RGBA一致核验。其中1张保留早期重素材加载后的安全释放失败帧；其余覆盖候选、正式锁定、错误重试与正常舞台。截图均不是实机验收。

## 复现与实机验收

在 `Mural-Exhibition` 执行 `npm test`。需要浏览器回归时设置 `NODE_PATH=C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules`，使用现有 `node server.js` 本地服务和对应命令：

```powershell
npm run test:b03-v42-browser
npm run test:b03-dwell-browser
npm run test:b03-pose-browser
npm run test:browser
npm run test:b02-browser
node b02-media-browser-check.cjs
```

这些命令会执行实际浏览器，但输入合成／真实空白帧的边界如上，不会自动生成真人PASS。原始测试环境为Windows、已安装Chrome、Node v24.14.1；真实模型需要原CDN可达。

目标设备在仓库根目录执行：

```powershell
node .\docs\validation\b03-gesture-v4.2\start-physical-acceptance.cjs
```

该工具检查或启动当前版本的本地服务，打开Chrome调试页并创建PENDING表；3000被旧进程占用时手动重启该服务，或加 `--port=3002`。它不会终止未知进程。仅准备记录使用 `--no-open`。按[清单](PHYSICAL_CAMERA_CHECKLIST.md)逐轮填写，失败时导出前后诊断，不能只挑成功轮。

## 修改范围与发布

实际代码/测试文件及SHA256见[test-results.json](test-results.json)的 `testedFiles`。新生产文件是 camera-lifecycle.mjs 和 gesture-diagnostics.mjs；其余为 B03 控制链与最小接入、错误诊断API、现有回归和新专项测试。未改人物素材、材质、舞台着色器、B02媒体切换实现或模块A。

仅提交本次28个代码/测试文件、B03章节文档和本阶段正式文档/5张精选图。既有素材增删、归档脚本修改、模块A与历史未跟踪证据保留。低保真固定tag/归档分支仍指向原基线；不移动引用。提交后必须 push origin master，并比较 HEAD、origin/master 和独立 ls-remote；具体发布SHA与同步状态由交付报告提供。
