> 历史阶段（已被V3.5主线替代）：保留参数、测试数据与设计演变说明。部分截图/录像已按V2文件级清单精简；原已跟踪媒体可在pre-repository-cleanup-v2-2026-10-31恢复，重复媒体见清单中的保留副本。不得重跑旧入口检查作为当前正式验收。

# 轻量写实模型浏览器验收

截图为本轮 `1440×900` 主要审查尺寸；`overview-1024x768.png` 和 `transfer-17.8-1024x768.png` 补充小窗口检查。浏览器脚本实际还运行了 `1920×1080`、`1366×768`、`1024×768`，并将断言结果记录在 `results.json`、`model-structure/results.json`、`mural-textures/results.json` 和 `chapters-results.json`。未保留所有中间帧，以控制仓库体积。

| 状态 | 截图 |
| --- | --- |
| A01 | `model-structure/a01-1440x900.png` |
| A02 | `model-structure/a02-1440x900.png` |
| A03 | `model-structure/a03-1440x900.png` |
| A04 第五幅 | `fifth.png` |
| A04 第一幅 | `first.png` |
| A04 第二幅 | `second.png` |
| A04 全景路线 | `route-03.png` |
| A04→A05 | `transfer-17.8-1440x900.png`、`mural-textures/a05-entry.png` |
| 单幅壁画失败回退 | `mural-textures/mural-05-fallback.png` |
| A08 入口回归 | `a08-1440x900.png` |

`a04-final/` 是升级前验收基线，本目录是本轮升级后的代表截图。
