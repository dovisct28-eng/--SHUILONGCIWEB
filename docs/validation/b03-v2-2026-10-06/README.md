# B03 V2 · 双模式视觉重制验收

2026-10-06。基线：开发前 fetch/ls-remote 后本地 HEAD、origin/master、远程 master 均为 `e9d297f3653afb719f9be4b3da4e28dde210e42e`。本记录是桌面实现与技术验收，视觉参数仍待作者最终审图，真实摄像头/物理手势未验收。

## 本轮交付

图鉴采用完整真图＋独立档案的编辑式构图；三图层配准诊断、原视频、按需加载、稳定人物 ID/order 和可访问索引保持。体感采用独立透明人物舞台＋作者短简介，复用模块 A 现有远山，新增 Alpha 边界/统一安全区/独立锚点/归一化校准。具体素材格式、算法和作者操作见 [当前 B03 说明](../../B03_CHARACTER_STUDY.md)。

正式素材仅 ID01 的 `figure.png` 新加入本轮提交，文件原样保持；源 org/line/color/video/info/meta、B02 全景/坐标、模块 A 源码和归档机制未修改。本地既有上层猖兵目录改名、归档脚本修改、图片删除和无关验收文件排除提交。远山为原文件副本；标题字库来自与模块 A 散列一致的同款母字体，补齐 B03 字符而不修改 A 的字体。素材散列见 [完整性清单](asset-integrity.json)。

参考图只用于构图/层级方向，人物、文字、纹样和人数未照搬。原始参考图单独保存在 [references](references/README.md)，实际截图的无损 WebP 在本目录，合成几何测试截图统一标记 `synthetic-*`，不得作为正式人物或史料展示。

## 实际浏览器截图

所有截图来自 Chrome 实际页面、真实 Three.js/GSAP/MediaPipe 库；设备接口为测试替身，手部坐标为合成输入。没有使用 AI 效果图代替运行证据。默认体感截图等待真实人物平面的 opacity 完全恢复到1；[首次显影反馈帧](cyber-entry-feedback.webp) 是过程帧。

| 桌面尺寸 | 原壁画 | 线稿 | 色稿 | 索引 | 长文 | 体感默认 | 展开简介 | 收拢恢复 |
|---|---|---|---|---|---|---|---|---|
| 1920×1080 | [图](gallery-default-1920x1080.webp) | [图](gallery-line-1920x1080.webp) | [图](gallery-color-1920x1080.webp) | [图](gallery-index-1920x1080.webp) | [图](gallery-long-1920x1080.webp) | [图](cyber-default-1920x1080.webp) | [图](cyber-revealed-1920x1080.webp) | [图](cyber-closed-1920x1080.webp) |
| 1440×900 | [图](gallery-default-1440x900.webp) | [图](gallery-line-1440x900.webp) | [图](gallery-color-1440x900.webp) | [图](gallery-index-1440x900.webp) | [图](gallery-long-1440x900.webp) | [图](cyber-default-1440x900.webp) | [图](cyber-revealed-1440x900.webp) | [图](cyber-closed-1440x900.webp) |
| 1366×768 | [图](gallery-default-1366x768.webp) | [图](gallery-line-1366x768.webp) | [图](gallery-color-1366x768.webp) | [图](gallery-index-1366x768.webp) | [图](gallery-long-1366x768.webp) | [图](cyber-default-1366x768.webp) | [图](cyber-revealed-1366x768.webp) | [图](cyber-closed-1366x768.webp) |
| 1280×800 | [图](gallery-default-1280x800.webp) | [图](gallery-line-1280x800.webp) | [图](gallery-color-1280x800.webp) | [图](gallery-index-1280x800.webp) | [图](gallery-long-1280x800.webp) | [图](cyber-default-1280x800.webp) | [图](cyber-revealed-1280x800.webp) | [图](cyber-closed-1280x800.webp) |

实际截图展板：[1920](review-board-1920x1080.jpg)、[1440](review-board-1440x900.jpg)、[1366](review-board-1366x768.jpg)、[1280](review-board-1280x800.jpg)。只拼接缩略运行截图，详细阅读检查用原尺寸无损 WebP（原始 PNG 留在本地）。目视核对四尺寸的主体完整性、标题/正文层级、索引和控制条分离、原图比例/色彩、体感默认/展开构图与背景权重；实测投影检查人物四角始终避让顶部/底部 UI 及展开正文。

八组正式图鉴截图：`character-01.webp`—`character-07.webp`、`character-10.webp`，包括不同原始宽高比。旧人物体感使用兼容路径；[校准工具](author-calibration.webp)、[无效抠图的旧素材回退](invalid-alpha-legacy-fallback.webp)、[空边界诊断](empty-alpha-diagnostic.webp)、[手动边界提示](manual-bounds-diagnostic.webp)、[三层配准诊断](layer-registration-diagnostic.webp)、[图层失败保留前图](layer-failure-retained.webp)、[档案失败重试](archive-failure.webp)、[仅原图与安全 Markdown](original-only-safe-markdown.webp)、[减少动态效果](reduced-motion.webp)。

合成几何图：[细长默认](synthetic-tall-default.webp)、[细长展开](synthetic-tall-revealed.webp)、[宽动作比例默认](synthetic-wide-default.webp)、[宽比例展开](synthetic-wide-revealed.webp)。这些是纯矩形的算法测试，四尺寸两状态均检查 bbox 安全范围；不是第二组正式人物验收。

## 验证

- `npm test`：11项单元测试及 B01 源码保护通过。覆盖 Alpha 细边/安全边距、空/不透明/异常边界、0.01–100极端比例、四尺寸安全区、人工校准、可选资源扫描/旧字段与未知元数据保留、安全档案/链接、标题字体散列与正式姓名覆盖。[日志](tests.txt)。
- `npm run test:b03-browser`：主流程及作者舞台专项通过。[主结果](results.json)、[专项结果](stage-results.json)。检查八组正式资料/资源、三图层与实际视频 ended、四尺寸投影、快切/晚到请求、错误重试、同 ID 双模式、长文和键盘、原手势函数输入、摄像头退出；额外覆盖仅抠图、Alpha/解码失败回退、不跳人、手动 bounds、长 summary/HTML纯文本、校准复制/恢复/反向/resize、Alpha缓存复用、三层尺寸异常诊断。
- `npm run test:browser`：B01 双入口、摄像头拒绝/缺失/占用/晚到、六次会话释放、单 renderer、外部组件失败/重试、键盘、减少动态效果、真实 A08→B01→返回/刷新通过。[B01结果](b01-regression/results.json)。
- `npm run test:b02-browser`：原八热点与绑定、全景平移/缩放/返回位置、素材按需、原视频、标注增量扫描/保存/取消/解绑/冲突与错误恢复通过，临时测试人物在 finally 清理。[B02结果](b02-regression/results.json)。
- HTML module 解析、相关 mjs/cjs 语法、`git diff --check` 通过。项目为原生静态页面＋Express，无打包构建器，不宣称生成打包产物。

默认3000端口已有旧服务，最新扫描器验证使用独立3005端口；测试支持 `B_VALIDATION_ORIGIN=http://localhost:3005`。A08 的正式固定3000入口仍单独按真实契约检查，模块 A 未改。日常使用更新后的普通服务时需重新启动 `Mural-Exhibition` 的 `npm start`；独立3005服务可用于本轮预览。

## 性能观察

最终主测试 ID01 Alpha 扫描87.9ms（专项独立页面60.9ms），只在该页面首次使用该资源时扫描；跨人物返回实测 `cacheHit:true`，scanMs保持原记录，未重复读取像素。背景没有独立持续循环。透明人物轮廓反馈结束后停止绘制点阵；原体感 renderer/识别循环保留，人物原平面仍清晰呈现。

四尺寸正常动态路径始终1个renderer、2份上传纹理/2份几何；减少动态效果的新透明人物不上传从未绘制的反馈层，计数为1/1，旧素材兼容路径为2/2。所有点阵≤80,000顶点，真实 ID01 为79,776；连续反向收放额外图像请求为0，resize未增加资源。12次切换无资源对象计数累计上升。显式GC后的JS usedSize从5,219,768 B到5,476,824 B（+257,056 B，约251KiB）；样本有限，不据此承诺长期无泄漏。8次模拟摄像头会话启动/停止均为8，最多同时1、结束0。

这些是单Chrome进程的软件观察，不覆盖浏览器RSS、解码内存、实测GPU字节或展厅PC物理FPS。首次外部组件启动墙钟、真实摄像头并行性能和长期占用未实机测量；没有以无头浏览器调度频率宣称真实屏幕帧率。完整结果见上述JSON。

## 素材与硬件待办

- ID01 抠图为1864×1802 RGBA、122,958 B，透明像素约64.57%，bbox为完整原画布。与其正式色稿中的人物相符，真实内容未替换成参考图的持戟形象。
- ID02、03、04、05、06、07、10尚缺正式 figure；继续提供旧体感兼容展示。尚缺第二组明显不同动作/比例的真实抠图，不能将合成矩形测试当作完成这项正式视觉复核。
- 所有人物的专用 cyber.summary 未提供，界面明确“人物介绍待补充”。原档案和已提供英文/来源保留；本轮没有核验身份、信仰、历史等原研究判断，没有新增解释。
- 真实摄像头权限、MediaPipe真实跟踪、实际双手展开/收拢、单手挥动、不同光照/距离、阅读手势和展厅PC实际性能仍待实机。模拟设备与合成输入仅验证软件状态机。
- 本轮视觉为可继续精修的候选，不冻结颜色、字库、尺寸、动效和构图。

## 上传精简

首次推送返回 HTTP 408，远程 master 经重新查询仍为原基线；随后用户要求停止传输、检查大文件并清理。本轮未发现单个超大新增文件（最大约4.1MiB），但112份证据文件累计145.86MiB，运行资源和代码仅约0.81MiB。大批截图增加传输负担；不能仅凭408断定服务器超时的唯一原因。

保留原始提交的本地引用 `codex/b03-before-upload-cleanup`，原始PNG、B01/B02回归截图和参考副本也完整保留在本地。提交B03必要截图的无损WebP、四尺寸展板和JSON报告；回归PNG与参考PNG不再重复上传。转换脚本逐张比对尺寸及全部RGBA解码字节完全一致，散列与大小见 [发布清单](evidence-publication.json)，并未改动网页图片、母版或人物内容。新增 `.gitignore` 规则排除本地 `/tmp/`、`/docs.zip` 和本轮原始PNG；原来已跟踪的大文件不会因ignore自动消失，因此精简的是尚未发布的本地提交，不追加一个仍携带冗余历史的删除提交，也不强制推送。

本次 commit / GitHub 同步与核实结果以交付回复和 Git 元数据为准；只在 push 后重新核实远程 master 包含本次提交才报告已同步。
