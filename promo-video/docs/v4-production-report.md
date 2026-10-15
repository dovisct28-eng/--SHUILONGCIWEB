# V4 原生工程与交付记录

2026-10-15。对象为 **V4审片候选**。实际MP4为 `previews/preview-v4-173s.mp4`，不是仅有配置或编辑器预览；最终参赛认可仍待用户审片。

ChatCut项目 `050726e1-fb18-4c5b-beb0-851c06f616fe` 内，先复制V3，再编辑独立时间线 **出兵入将｜E类参赛演示 V4**，ID `9bf5f59a-8f3a-4d46-896b-7c03e53223fa`。原V1/V2/V3及旧测试保留。V3时间、源素材和片段范围重新回读，仍为4500帧，与复制前一致；旧源代码未覆盖。

V4为1920×1080、30fps、5190帧；五轨，16个主画面片段、8个标题/字幕/回顾图形实例、一条音乐、四次确认音。空的来源轨继续预留。中文字幕使用可编辑MG，不是ChatCut自动转写字幕，因此read_project显示captions=absent不表示没有画面字幕。独立SRT及对应JSON由同一cue表生成。所有实例范围、源入点、属性回读与原生导出任务见 `planning/production-state-v4.json`；MG登记见 `planning/motion-graphics-properties-v4.json`。

先完成独立54秒关键段测试（1620帧、`technical-test-v4.mp4`，原生测试时间线 `aa78de9525`），覆盖片头、主题、A04、三幅壁画、图鉴切换、体感三操作和三段回顾。该测试解码、黑场、编码及音频技术检测通过，并检查实际抽帧后，才输出173秒全片。测试片音乐因测试片段拼接而断开，不能用来判定全片配乐接句。

初次全片导出后，抽帧发现A03文字仍早于重音基本展开，因此另采A03第二条源；先更新54秒测试片并通过实际导出检查，再重新输出全片。旧候选保留为 `preview-v4-173s-before-theme-refinement.mp4`，未覆盖V3。

当前全片原生导出任务 `ac88eb83-fadf-4cc1-9ebb-b65a181bc32e` 已返回done；文件121,774,173字节。Remotion `/V4Review` 只监看该实际MP4的本地副本，5190帧；`/V3Review`保留。母剪辑仍是ChatCut原生工程，不用单条成片替代可编辑轨道。

源视频、音乐、完整输出MP4及监看副本均只在本机保留，遵循已有.gitignore。真实页面在当前用户工作区采集，包含用户现有素材/文案；不假称是纯净远程checkout重放。未覆盖或暂存用户原有素材、归档脚本、历史截图等改动。远程开始时重新核实为08370d6347cfb5a245b8cd55724089a81888655a；一次TLS握手失败后，HTTP/1.1 fetch成功。最终提交与远程核实结果以实际交付消息为准。

## 复查入口

```powershell
node --test promo-video/scripts/v4-validation.test.mjs promo-video/scripts/v3-motion.test.mjs promo-video/scripts/v3-validation.test.cjs
node promo-video/scripts/validate-production.cjs v4
node promo-video/editor/node_modules/typescript/bin/tsc -p promo-video/tsconfig.json
# promo-video/editor 内运行 npm run lint 和 npm run build
```

实际媒体检测使用本机Python运行 `verify-render.py <MP4> 5190`、`verify-sync-v4.py` 和 `review-v4.py`。FFmpeg/ffprobe路径沿用本项目已有Remotion compositor。代码/配置和精选帧可追溯，完整媒体未上传普通Git；跨机器需要另行迁移这些本地媒体，当前未声称可直接在另一台机器打开全部源文件。

必须保留的未完成项：全片连续人工视听、音乐衔接主观验收、最终参赛认可。工具检测和代表帧检查已经执行，但不能代替这三项，也不能据此把文件改名为final。
