> 2026-10-31清理注：被精简的历史媒体链接已改为清理前Tag或已核对的相同副本；下文原测试结果保持当时记录，不能作为最新运行结论。

# V2.4-B1｜Combined B 正式建筑模型整合

**Combined B 正式模型整合完成，纯 3D 观看路线待用户视觉验收。**

入口：[已接入共享正式模型的实验展厅](http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v24.html)。它使用现有网页状态机、输入和共享建筑运行时，不是 B0 独立候选路线播放器。A01–A08 的正式入口仍为 [模块 A](http://127.0.0.1:4186/module-a/a01/)。

- [整合报告](INTEGRATION_REPORT.md)
- [完整真实交互录像（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/temple-model-v2/integration-b1/selected/12-full-interaction.webm)，70.00 秒，1440×900、正常速度，包含总览到阅读、缩放拖动复位及全程返回总览。
- [相机矩阵及视口](camera-manifest.json)，[模型一致性](model-verification.json)，[碰撞](route-verification.json)，[浏览器](browser-results.json)，[回归](regression-results.json)，[性能](performance-results.json)。
- [录像完整解码](record-verification.json)，[正视静帧来源](front-screenshot-verification.json)，[模块 B 加载](module-b-smoke.json)。

## 启动及复验

在项目根目录以 PowerShell 运行：

```powershell
$env:A01_PORT='4186'
node module-a/a01/server.mjs
```

模块 B 另在 Mural-Exhibition 中运行 node server.js（端口 3000）。测试所需 Playwright 与 sharp 来自本机已配置的 Node 包目录，通过 NODE_PATH 指定；没有增加项目依赖。module-b.cjs 另需 local/qa-three-0.160.0.mjs 和 local/qa-gsap-3.12.5.js，来自 module-b-smoke.json 中记录的现有固定版本 CDN；它们只用于本机 QA 响应缓存，不随本阶段提交。

正常构建只运行 node shuilong-temple/build-model.mjs。不要运行旧 B0 build-candidates：其冻结源码与正式源码字节一致的前提已按本次任务失效。旧候选源码、GLB、配置和清单保持原样；B0 清单中 baseline 的 URL 指向共享生产 GLB，整合后该 URL 会显示新模型，回看原基线请使用 ef0f366 的历史版本。

复验顺序：scripts/browser.cjs → scripts/regression.cjs → scripts/module-b.cjs → scripts/performance.cjs → scripts/video-check.cjs → 查看 local/dock-review.webp 并用 scripts/front-evidence.cjs 选择正视静帧 → scripts/model-check.cjs → scripts/finalize.cjs。浏览器与性能检查顺序执行，构建时避免同时请求 GLB（Windows 文件共享锁）。录像时长或流程变化后，应重新审图选择静帧时间，不能沿用旧帧号。

## 精选留档

| 文件 | 状态 | 视口 |
| --- | --- | --- |
| 01-a01-overview.webp | A01 总览 | 1440×900 |
| 02-a02-space.webp | A02 五幅位置 | 1440×900 |
| 03-a03-cutaway.webp | A03 屋顶及山墙剖切 | 1440×900 |
| 04-a04-mural-locations.webp | A04 路线总结及屋顶恢复 | 1440×900 |
| 05-gate-interior.webp | 门内沿戏台后方移至右侧通道 | 1440×900 |
| 06-stage-turn.webp | 戏台右侧 | 1440×900 |
| 07-new-corridor.webp | 拓宽后的右廊 | 1440×900 |
| 08-mural-discovery.webp | 第一幅斜向发现 | 1440×900 |
| 09-mural-front.webp | 真实录像中的正视停稳帧 | 1440×900 |
| 10-mural-reading.webp | 完整数字阅读 | 1440×900 |
| 11-return.webp | 返回原廊道 | 1440×900 |
| 12-full-interaction.webm | 完整正反向真实交互 | 1440×900 |

精选共 12 文件、12466769 bytes。三视口完整回归与排查截图、原始录像、视频逐帧审图及工作区完整哈希清单保存在 local/，按现有 .gitignore 留在本地，不提交。

技术验收不等于用户最终视觉定稿；未进行实体摄像头/手势验收，未新增历史释读或 AI 室内图。
