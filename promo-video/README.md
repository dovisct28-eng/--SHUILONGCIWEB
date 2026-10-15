# 《出兵入将》120 秒竞赛宣传片 · Phase 1

2026-10-15。**仅完成规划与审查，尚未制作影片。** 目标为 1920×1080、16:9、30fps、120秒（3600帧），最终 MP4/H.264。

本目录独立于网页业务。没有修改模块 A/B、母版、人物素材或低保真归档；不把用户尚未提交的素材整理纳入本次提交。

阅读顺序：

1. [仓库与功能审查](docs/repository-audit.md)：远程基准、入口、实际功能、本地差异。
2. [120秒完整分镜](docs/storyboard.md)：六段叙事、创作取舍、字幕与声音。
3. [逐镜清单](docs/shot-list.md)：30个镜头，含来源、操作、转场、验收。
4. [素材清单](docs/asset-inventory.md) 与 [逐文件哈希登记](docs/asset-register.json)。
5. [技术方案与制作门槛](docs/technical-plan.md)：ChatCut核查、备用方案、20秒测试片及后续步骤。
6. [本轮验证记录](docs/qa-report.md)、[制作状态](docs/production-report.md)。

可编辑规划源为 [planning/timeline.json](planning/timeline.json)。整数帧区间均采用 `[start,end)`；字幕、模拟标识和手势事件分别管理。`subtitles/chubingrujiang-planning.srt` 是规划稿，不能当成最终影片已交付。

本机 Node 已可用。执行只读素材审查及源页面检查时，需让 Node 能解析已有的 Sharp、Playwright：

```powershell
$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node promo-video/scripts/audit-assets.cjs
node promo-video/scripts/audit-runtime.cjs
node promo-video/scripts/validate-plan.cjs
```

前两项分别更新素材登记与运行审查记录，第三项检查规划并导出镜头表和SRT。不会录视频、接入摄像头或编辑业务文件。依赖路径属于本机环境，不写入影片画面或元数据。

`assets/`、`recordings/`、`animations/`、`previews/`、`renders/`、`local/` 均仅本地保留；本轮未建立媒体工程、未复制素材、未生成音乐。后续正式精选证据遵循 `docs/VALIDATION_ARCHIVE_POLICY.md`。

下一步是在确认本分镜后进入 Phase 2；先完成20秒端到端技术测试，再录制和制作完整镜头。ChatCut当前会话连接未验证；Remotion/React未安装于本轮检查到的可解析环境；FFmpeg/ffprobe未在PATH发现。详见技术方案，不能据此声称任何剪辑链已可交付。
