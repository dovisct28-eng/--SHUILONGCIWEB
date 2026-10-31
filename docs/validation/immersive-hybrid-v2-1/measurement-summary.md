> 2026-10-31清理注：被精简的历史媒体链接已改为清理前Tag或已核对的相同副本；下文原测试结果保持当时记录，不能作为最新运行结论。

# V2.1 实测摘要

日期：2026-10-26。以下值读取自本目录的实际浏览器、构建与运动报告。

本轮 33 项 Node 单元测试通过；构建/保护检查、三个视口、八章正式页面对照、滚轮输入、返回/重入、窗口缩放、减少动态、故障恢复与 V1 保留验证均通过。

- 本机图形设备：ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti (0x00002191) Direct3D11 vs_5_0 ps_5_0, D3D11)。
- 实测启动至入口就绪：1846 ms（一次样本，不代表跨设备或冷缓存统计）。
- 每个三视口测试均为 1 次 GLB 请求、1 个 Renderer、1 个 Canvas；入口段生成场景图请求 0 次。
- 原 A01 同机位、门板恢复对照：0 个变化像素；平均通道差 0/255。
- 五轮进出前后：几何 42 → 42；纹理 22 → 22。
- JS heap 估计：38.88 → 43.46 MiB。GC 未强制；单次增长不能当成泄漏结论或显存计量。
- 原后期保留两个 Pass；1920×1080 目标估算 74.65 MB，为既有后期，不包含全部显存。
- 相机轨道：1600 段 × 5 偏移包络、双向射线，建筑交叉 0。门板恢复/打开及门楣阻挡实测通过。
- 录像完整正向墙钟 10991 ms，包括录像开销和终点提交；轨道候选时长 10800 ms。

## 正常动态帧间隔

1920×1080，未开启录像或截图采集的交互运行；时间戳来自真实 rAF。不可把本机高刷新率结果推广为跨设备帧率保证。

| 区段终点 | 样本 | P50 ms | P95 ms | 最大 ms |
| --- | ---: | ---: | ---: | ---: |
| approach | 1254 | 4.20 | 8.10 | 8.70 |
| gate-close | 623 | 4.20 | 8.10 | 8.90 |
| threshold | 342 | 4.20 | 8.00 | 8.70 |
| gate-interior | 196 | 4.20 | 8.00 | 8.80 |

## 正式章节回归

| 章节 | 平均通道差 /255 | RGB 合计差超过12的像素 |
| --- | ---: | ---: |
| A01 | 0.000000 | 0 |
| A02 | 0.000093 | 0 |
| A03 | 0.000083 | 0 |
| A04 | 0.000000 | 0 |
| A05 | 0.000000 | 0 |
| A06 | 0.000000 | 0 |
| A07 | 0.000000 | 0 |
| A08 | 0.000000 | 0 |

正常场景脚本错误：0；V2.1 WebGL 警告：0。原正式着色器 X3595 诊断按 surface 保留于 browser-results.json；favicon 404 与故障注入 503 分开记录。

## 精选文件体积

共 12 个必要文件，总计 19.63 MiB。包括对照、五停靠状态、两个深度蒙版、12帧轨道展板和一段实际运动录像；完整回归与临时证据只在 local 中。

| 文件 | MiB |
| --- | ---: |
| [01-original-overview.png](selected/01-original-overview.png) | 2.50 |
| [02-reused-overview.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/02-reused-overview.png) | 2.50 |
| [03-gate-approach.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/03-gate-approach.png) | 1.59 |
| [04-gate-close.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/04-gate-close.png) | 1.36 |
| [05-threshold.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/05-threshold.png) | 1.17 |
| [06-gate-interior.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/06-gate-interior.png) | 1.11 |
| [07-overview-comparison.webp（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/07-overview-comparison.webp) | 0.18 |
| [08-interior-depth-mask.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/08-interior-depth-mask.png) | 0.04 |
| [09-continuous-rail.webp（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/09-continuous-rail.webp) | 0.15 |
| [10-gate-occlusion-mask.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/10-gate-occlusion-mask.png) | 0.04 |
| [11-gate-occlusion-candidate.png（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/11-gate-occlusion-candidate.png) | 0.97 |
| [12-continuous-entry-and-return.webm（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/immersive-hybrid-v2-1/selected/12-continuous-entry-and-return.webm) | 8.03 |

未验证：弱 GPU、其他机器、实际投影/显示器观感、用户最终视觉接受。V2.2 匹配素材与正式 2.5D 切换未完成。
