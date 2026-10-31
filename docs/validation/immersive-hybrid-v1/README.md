> 历史阶段（已被V3.5主线替代）：保留参数、测试数据与设计演变说明。部分截图/录像已按V2文件级清单精简；原已跟踪媒体可在pre-repository-cleanup-v2-2026-10-31恢复，重复媒体见清单中的保留副本。不得重跑旧入口检查作为当前正式验收。

# 水龙祠原境混合展厅 V1 · 验证记录

> Repository Cleanup V1.0 历史提示：本页为当时版本的验收记录，以下入口、命令和视觉结论仅适用于[该历史提交](https://github.com/dovisct28-eng/--SHUILONGCIWEB/tree/882237b83768160bd0d8754cdab8aed53453cb9c)，不代表当前版本。当前共享建筑基线为 Combined B / V2.4-B1，入口与范围见[当前展厅说明](../../../module-a/immersive-hybrid-v1/README.md)；本页原有历史证据完整保留。

2026-10-26；开发基线 `af7235cdd7df1a5e88085cc6528d6bc0ff09d8ad`，开始时已fetch核实远程master。交付分支 `feature/shuilongci-hybrid-gallery-v1`，不合并master。

## 结论

**技术与交互验证通过，AI场景为视觉候选，整体高保真视觉尚未最终验收。**

完成独立预览、六个真实模型锚点、四张实际AI生成场景及原件、模型深度前景蒙版、独立真实壁画图层、六状态控制、滚轮/按钮/返回、展开/放大/拖动/关闭、减少动态、调试对照、场景缺失回退与恢复替换。只开发第一铺，没有扩展第二至第五铺。

预览：`http://127.0.0.1:4186/module-a/immersive-hybrid-v1/`；[源码与使用说明](../../../module-a/immersive-hybrid-v1/README.md)。

## 自动与浏览器检查

- 新增4项行为/投影/真实图一致性单元测试，全部通过。
- 现有章节与共享模型105项、模块A根目录9项测试，全部通过，共118项Node测试。
- 独立构建检查通过：全部新源文件语法、19项图像尺寸/字节/SHA、受保护GLB逐字节一致、模型文本源与元数据内容一致（仅按Git现有CRLF换行归一化）。未运行会重写正式模型的构建脚本。
- Chrome实际运行1920×1080、1440×900、1366×768，所有五个空间状态、第一铺完整展开、125%放大、Esc关闭、按钮返回通过。每页GLB只请求1次，保留1个renderer/canvas。
- 墙面图层像素对照通过：三个尺寸隐藏/显示真实壁画分别改变约16.3万、9.2万、8.3万像素；防止“按钮可点而壁画未绘制”的漏检。原始文件SHA一致，CSS投影角点顺序经过测试，未镜像、重绘或改色。
- 同一页面1920→1366实时resize后投影仍在视口内；展开状态再resize、关闭仍返回原第一铺。
- 连续大滚轮事件不会跳过多个状态，反向滚轮能返回；系统减少动态与手动控件可用。
- 四张AI场景全部404时逐场景回退模型参考图；恢复资源后调试“重新读取”能从参考图切回AI图。实际AI原PNG通过固定URL替换也通过；没有用假图证明生成质量。
- 调试来源、对比开关、相机与图片尺寸可用。页面错误为0；本轮捕获中没有WebGL运行错误。

可机读证据：[browser-results.json](browser-results.json)、[build-results.json](build-results.json)。完整回归、初期排查及测试输出保留在忽略的local/，不批量上传。

## 性能与资源

四张WebP合计2,314,072 bytes，单张472,284–674,138 bytes；只有进入目标场景时才解码，loader保留当前场景引用。GLB 3,329,000 bytes，单次请求；Three.js完全本地。生成PNG原件不由网页加载。

本机Headless Chrome过渡回调帧间隔P95约4.4–6.0ms；这是有限过渡窗口的回调抽样，不是物理显示器帧率、GPU基准或跨设备60FPS保证。静态停靠不维持连续WebGL渲染循环。模型总览本次可见渲染约37 calls / 82,742 triangles，随视锥而变化，不能与模型总三角面直接等同。

没有实测弱GPU、长期多小时展览、真实摄像头或其他浏览器；这些不是本轮通过结论的一部分。

## 人工图像审查与未解决项

已查看本地大门、开门、右侧通道、主殿朝戏台四张照片；未把文件名含ChatGPT/Codex的图当实拍证据。照片哈希和来源限制在[本地资料审查](../../../module-a/immersive-hybrid-v1/assets/references/local-source-audit.json)。未找到能独立证明第一铺准确现场尺寸和模型平面的照片。

六机位均为1920×1080，统一模型坐标，完整屋顶显示，不含UI。中门运行时只打开木门与把手，砖券上方填充保留；开门后仍有戏台背部遮挡，因此从右侧绕行。原模型没有修改。各机位参数、用途、屋顶与预览处理见[reference-manifest.json](../../../module-a/immersive-hybrid-v1/assets/references/reference-manifest.json)。

生成图的主要墙、门、柱列和通道关系可对应模型，没有发现明显总平面重设计，但存在生成性的瓦面、梁底、柱础和风化细节，不能作为现场资料。S01天空偏戏剧化，入口混合帧有轻微轮廓漂移，尚不满足最终无缝衔接；第一铺原图矩形边界仍可辨，不把这张数字展陈图解释为整面原始墙貌。后续是否采用、是否继续修图须由用户审图决定。

没有通过重绘壁画、全局调色、模糊壁画、添加虚构构件来掩盖上述问题。原模型与AI对比、[逐图审查](../../../module-a/immersive-hybrid-v1/prompts/generation-review.md)、[实际生成提示词](../../../module-a/immersive-hybrid-v1/prompts/actual-generation-prompts.json)均保留。

## 精选截图

以下7张为1920×1080浏览器实图，4张为明确标注左右来源的对比板，共11张约22.18MB。对比板不冒充运行截图；不上传重复回归图。六个模型锚点另外作为必要制作资产保存在源码目录。

| 文件 | 覆盖内容 |
|---|---|
| selected/01-overview.png | 原GLB真实三维建筑总览 |
| selected/02-gate-transition.png | 模型到入口AI候选的混合帧，同时保留轮廓偏差证据 |
| selected/03-gate-exterior.png | 大门外部候选 |
| selected/04-gate-interior.png | 戏台右侧进入通道 |
| selected/05-gallery.png | 第一铺所在右廊 |
| selected/06-mural-stop.png | 第一铺停靠及独立真实壁画 |
| selected/07-mural-detail.png | 原图100%适配的完整展开状态 |
| selected/comparison-R03.webp | 模型入口 / AI入口对比 |
| selected/comparison-R04.webp | 模型门内通道 / AI通道对比 |
| selected/comparison-R05.webp | 模型廊道 / AI廊道对比 |
| selected/comparison-R06.webp | 模型第一铺空白墙 / AI空白墙对比 |

## 保护与同步范围

修改只在 `module-a/immersive-hybrid-v1/` 和本验证目录。正式A01–A08、共享模型、模块B未纳入本次提交。用户原有模块B题录/文件调整、低保真启动器改动、照片删除状态和大量本地未跟踪素材继续保留，未暂存、覆盖或清理。

固定低保真Tag解引用与归档分支仍指向 `48f272497e86e4549c5bcd0dee275ff347171a3f`。本次仅推送独立功能分支；远程master不应产生本次预览提交。具体提交与远程核实SHA由交付消息给出。
