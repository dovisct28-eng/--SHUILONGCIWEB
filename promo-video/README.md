# 《出兵入将》参赛演示视频

**V4局部精修与参赛文件（2026-10-15）**：已完成片尾三层点题、图鉴提示删除，实际输出母版121.37MB、双遍优化版48.01MB，并选择母版生成 `renders/v4-final/chubing-rujiang-final-submission.mp4`。编码/完整解码、Chrome与Edge完整播放、相关测试及抽样画质复核通过。Veo源标识按本轮用户确认保留；没有代替连续人工听审或许可认证。详见[修订与交付报告](docs/v4-final-delivery.md)、[PPT完整材料](docs/v4-final-ppt-materials.md)、[最终剧本](docs/v4-final-script.md)、[精选证据](../docs/validation/promo-video-v4-final/README.md)。完整视频本地保留，不进入普通Git。以下V4/V3及早期内容是历史记录，本轮任务书覆盖其旧提示保留决定。

**V4更新：173秒审片候选已实际导出**，文件 `previews/preview-v4-173s.mp4`。ChatCut独立时间线“出兵入将｜E类参赛演示 V4”，ID `9bf5f59a-8f3a-4d46-896b-7c03e53223fa`；V1/V2/V3保留，网页业务代码未改。片头标题前移、主题卡点补录、空间与壁画观看扩展、B03两处浮动标识移除，回顾统一分区。用户明确确认保留B02真实网页自带的数字内容提示。

交付与边界见 [V4制作记录](docs/v4-production-report.md)、[修改记录](docs/v4-edit-decisions.md)、[质量报告](docs/v4-quality-report.md)、[实际原生时间线](planning/production-state-v4.json)、[字幕](subtitles/chubingrujiang-v4.srt)、[精选证据](../docs/validation/promo-video-v4/README.md)。技术检测与抽样画面复查已执行，**全片连续人工视听、音乐听感与最终参赛认可仍待审片**，不命名为final。

V4检查：`node promo-video/scripts/validate-production.cjs v4`；`node --test promo-video/scripts/v4-validation.test.mjs promo-video/scripts/v3-motion.test.mjs promo-video/scripts/v3-validation.test.cjs`。Remotion新增 `/V4Review` 监看实际输出，时长5190帧。完整媒体仅本地保留，Git不含完整MP4及无损录屏。

**V3更新：150秒审片候选**，文件 `previews/preview-v3-150s.mp4`；ChatCut独立时间线“出兵入将｜150秒参赛演示 V3”，五轨可编辑。V1/V2保留。详见[制作记录](docs/v3-production-report.md)、[运动诊断](docs/v3-motion-audit.md)、[画质验收](docs/v3-quality-report.md)、[实际时间线](planning/production-state-v3.json)及[独立字幕](subtitles/chubingrujiang-v3-150s.srt)。当前为审片候选，音乐和最终参赛版尚待用户认可；不提前生成final命名文件。

V3：`node promo-video/scripts/validate-production.cjs v3`；运动/验证器测试 `node --test promo-video/scripts/v3-motion.test.mjs promo-video/scripts/v3-validation.test.cjs`。原生MG属性另见 `planning/motion-graphics-properties-v3.json`。Studio `/V3Review`为新增监看器，母工程继续在ChatCut。以下保留V2与更早制作记录。

**2026-10-15制作更新：130秒粗剪v2已导出并通过技术检查。** 最新审片文件为`previews/preview-v2-130s-revised.mp4`，可编辑母工程在ChatCut Desktop的“130秒粗剪 v2”。A03保留23–29秒；音乐为新生成的纯器乐候选，听感尚待确认。

当前事实、产物、编辑方式、接口限制和验证边界统一见 [制作交付记录](docs/production-v2.md)。实际时间线见[工程快照](planning/production-state-v2.json)，字幕见[subtitles/chubingrujiang-v2-130s.srt](subtitles/chubingrujiang-v2-130s.srt)。`http://localhost:4195/MyComp`是v2视频监看器，ChatCut本地工程保留可编辑画面、字幕和音频轨。

运行`node promo-video/scripts/validate-production.cjs v2`核验实际时间线；`promo-video/editor/`中运行`npm run lint`、`npm run build`检查监看工程。`promo-video/motion-graphics/`为原生动态图形源码，属性登记在`planning/motion-graphics-properties.json`。

以下为保留的Phase1规划历史，所有“未制作/未连接”表述仅描述当时的状态：

2026-10-15，P1.1。**仅完成规划与审查，尚未制作影片。** 按用户最新授权允许延长，当前编排1920×1080、16:9、30fps、130秒（3900帧），最终MP4/H.264；粗剪可依实际节奏调整。A03独立6秒（23–29秒），全片31镜；原120秒要求作为初始任务历史保留。

本目录独立于网页业务。没有修改模块 A/B、母版、人物素材或低保真归档；不把用户尚未提交的素材整理纳入本次提交。

阅读顺序：

1. [仓库与功能审查](docs/repository-audit.md)：远程基准、入口、实际功能、本地差异。
2. [130秒完整分镜](docs/storyboard.md)：六段叙事、A03主题镜头、字幕与声音。
3. [逐镜清单](docs/shot-list.md)：31个镜头，含来源、操作、转场、验收；[配乐深化](docs/music-direction.md)给出主题、配器与试听目标。
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

下一步是在确认本分镜后进入Phase 2；先完成20秒端到端技术测试及配乐试听，再录制和制作完整镜头。首次审查时ChatCut会话连接未验证，Remotion/React在检查到的可解析环境中不存在，FFmpeg/ffprobe未在PATH发现；本次分镜修订未重新测试这些连接。详见技术方案，不能据此声称任何剪辑链已可交付。
