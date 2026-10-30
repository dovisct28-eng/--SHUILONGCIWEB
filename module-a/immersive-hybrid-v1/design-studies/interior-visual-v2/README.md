# 内部数字展厅视觉研究 V2

日期：2026-10-30。基线：`a523be67e0546d788331af55a0680e0a403ecf60`。所属模块 A 的独立实验；目标分支 `feature/shuilongci-hybrid-gallery-v1`。本地与远程分支在开始时已核实一致。

本轮按用户《内部数字展厅视觉深化任务书 V2》执行，停在视觉原型与候选表面融合阶段。正式 `v24.html`、建筑几何、相机轨道、第一铺状态机、真实壁画、外部环境、模块 B 与固定低保真归档均未改动。任务书明确授权本独立实验的第一铺细读，不将其扩展到正式 A06 或其他章节。

## 预览

双击本目录 `启动视觉原型.bat`。也可在仓库根目录执行：

```powershell
$env:A01_PORT='4186'
node module-a/a01/server.mjs
```

打开 [四状态交互原型](http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v2/) 或 [方案对照页](http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v2/comparison.html)。需要 localhost，不能直接以 file 协议打开。

## 四种观看状态

| 状态 | 设计与操作 | 实现情况 |
| --- | --- | --- |
| A 入廊 | 暗木、灰墙与柱影；前后按钮、滚轮、方向键沿既有轨道行进 | 真实 Combined B ＋经标定的 AI 表面投影；不是截图背景 |
| B 显影 | 原墙面黑体标题、暗态壁画、渐亮、转正、展开 | 使用原状态机与原四角投影；仅实例级字号/亮度曲线候选 |
| C 全幅 | 宋体标题、完整原图、右侧基础信息、下方编辑式介绍 | 原相机完成展开后，以相同图像矩形接续 HTML 版面；可返回墙面 |
| D 细读 | 三处观察区域、侧栏说明、位置索引、自由缩放与平移 | 使用同一真实展示图；无 AI 修复、无人物身份推断 |

顶部四项用于原型状态审阅，不替代项目正式全局导航。入廊阶段的“继续前行”或下滚逐步到第一铺；停靠后继续前行会运行完整显影并进入全幅。点击“显影”标签可回到稳定墙面态；“预览选项 → 重播墙面显影与展开”可重看完整节奏。

**墙上“第一铺壁画”没有删除**：它在转向后的显影阶段出现，随亮起淡出，并非走廊行进中的常驻标牌。用户 2026-10-30 追问后已据实机 `mural-cue-hold` 截图再次核对。不要把稳定亮态截图中无字解释为功能删除。

“预览选项”保留 A/B 两组方向、当前正式融合、原始模型、九个技术停点、完整内部路线与诊断。默认 B；正式当前版本仍可独立打开。

## 已知边界

- AI 共生成四机位 × 两方向，整景均存在部分结构漂移；整景只作参考。实机仅融合安全墙面、地面与木柱内部，屋架与建筑边界由原模型保持。
- 实际提升主要在表面质感与局部明暗，檐下大块黑暗仍在。不能把候选整图的丰富程度描述为已实现的动态画面。
- 细读使用 2880×990 现有展示图；放大上限 4 倍为交互范围，不代表新增原生分辨率。尚未引入高清切片。
- 尺寸与“88个人物”等整体说明沿用当前正式页面及内容记录，未重新清点人物或核验现场测量。三个新增观察点只描述可见形态。
- 本轮技术验证不等于用户视觉通过，也不等于跨设备 GPU 性能保证。

## 复现检查

有 Node、Chrome、Playwright 和 sharp 时：

```powershell
node --test module-a/immersive-hybrid-v1/tests/*.test.mjs module-a/immersive-hybrid-v1/design-studies/interior-visual-v2/study.test.mjs
node module-a/immersive-hybrid-v1/design-studies/interior-visual-v2/browser-check.cjs
node module-a/immersive-hybrid-v1/design-studies/interior-visual-v2/motion-check.cjs
```

库使用当前环境提供的运行时，不向正式项目新增依赖；如未在 Node 搜索路径中，设置 `NODE_PATH` 为实际依赖目录。原型本身不依赖 Playwright 或 sharp，原生 HTML/CSS/ES Modules 无额外打包步骤。`prepare-assets.cjs` 仅用于维护候选导出，源生成图在 `generation-manifest.json` 所记录的本地路径；已提交的 Web 资源可直接运行。

设计详见 [视觉系统](VISUAL_SYSTEM.md)、[AI 与配准记录](AI_SCENE_RECORD.md)、[正式接入计划](IMPLEMENTATION_PLAN.md)。验证记录见 [本轮验收](../../../../docs/validation/interior-visual-v2/README.md)。
