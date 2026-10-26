# 水龙祠原境数字展厅 · V2.1 入口与保留的 V1 验证

2026-10-26：默认入口已切换到 V2.1 原场景复用与连续三维入门。复用原 A01 运行实例、地形、植被、材质、灯光、后期及原远山合成；五停靠点仅覆盖建筑总览→门内停靠。配置在 `src/entry-path.mjs`，同轨道前进/返回、滚轮消耗、减少动态、调试重播与交接导出在 `src/entry-main.mjs`。唯一共享入口改动受 `gallery-entry` URL 参数隔离，正式 A01–A08 不启用。

启动命令仍见下文。V2.1 地址为 `http://127.0.0.1:4186/module-a/immersive-hybrid-v1/`；V1 后续室内和第一铺验证保留在 `http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v1.html`，两者不自动切换。V1 原 main/model-view、场景清单、生成候选及历史证据均保留。

V2.1 的实现审查、镜头坐标、实际浏览器结果、精选帧/运动录像、V2.2 接口和未完成项见 [入口验收](../../docs/validation/immersive-hybrid-v2-1/README.md)。V2.2 室内 2.5D 尚未实施，视觉与运动仍待用户审图。

以下为保留的 V1 使用说明；原 V1 浏览器脚本已指向 v1.html。V2.1 使用上述验收文档的 entry 测试命令。

独立分支 `feature/shuilongci-hybrid-gallery-v1`；基线 `af7235cdd7df1a5e88085cc6528d6bc0ff09d8ad`。范围：真实模型总览 → 大门 → 绕过戏台 → 右廊 → 第一铺 → 展开查看。只做第一铺；正式A01–A08、B、原GLB和母版未改。

## 启动

在项目根目录运行：

```powershell
$env:A01_PORT='4186'
node module-a/a01/server.mjs
```

打开 V1 的 `http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v1.html`。必须通过HTTP，不能双击index.html。复用项目现有静态服务器，不依赖在线图片、CDN、API或新npm安装。Three.js 0.180.0及MIT许可从项目既有内嵌版本提取到vendor，V1 的renderer独立于正式页面。

向下滚轮或“下一处”推进，向上或“上一处”返回；底部可直接定位。第一铺点击真实图或“展开壁画”进入查看，±放大缩小，放大后拖动平移；Esc或关闭返回原处。减少动态支持系统设置和手动开关。没有自动滚页或滚轮preventDefault。

右上“调试”显示来源、机位、资源尺寸、渲染统计和上次过渡帧间隔。勾选“对照原模型截图”可查看未增强锚点。正式观看不显示调试面板。

## 资产与替换

- `assets/references/`：六张1920×1080原始模型截图和完整相机/屋顶/运行时调整清单。
- `assets/generated/originals/`：四张未经覆盖的生成原件；生成工具的确切后端模型不可确定。
- `assets/generated/`：Web副本S01至S04，固定命名。
- `assets/layers/`：同相机模型输出的前景遮挡蒙版。
- `assets/murals/mural-01-display.webp`：与用户真实源文件逐字节相同的独立副本，2880×990。
- `scene-manifest.json`：四场景资源、参考机位、来源、版本、日期、原件及真实壁画映射。
- `prompts/`：四组基础提示词原文、实际执行提示词、统一规范、生成差异记录。

替换固定文件名 `S01-gate-exterior.webp`、`S02-gate-interior.webp`、`S03-gallery-approach.webp`、`S04-mural01-background.webp`，或更新manifest路径。新图片保持16:9及参考透视，保留原件，重新检查墙柱轮廓、空白壁画墙、蒙版和对比图。刷新页面自动读取；调试面板“重新读取场景图”会清除解码缓存并加版本参数。生成图不存在时回退对应模型截图，明示“参考渲染图”。没有静默生成或把回退标为AI成品。

## 调整与扩展

相机在 `src/camera-presets.mjs`。调整后先运行 `scripts/export-anchors.cjs` 重新导出六视角、前景蒙版及投影角点，再复核对应生成图；仅改模型机位会使旧图不再匹配。墙画投影从现有锚点 `[4.865,1.55,4.8]` 和3.65×1.2547模型展示尺寸计算，不手工猜屏幕位置，不镜像原图。

未来新增壁画需在manifest增加场景、添加相机及独立真实图，扩展状态列表和标题、蒙版、测试。本轮未预填其余四铺的图像或历史内容，也未将参观顺序解释为历史顺序。

## 复验

浏览器脚本使用Playwright与Sharp；依赖从当前Codex桌面运行时解析，项目运行本身不依赖这两项。若终端尚未解析，在本机设置：

```powershell
$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node --test module-a/immersive-hybrid-v1/tests/logic.test.mjs
node module-a/immersive-hybrid-v1/scripts/build-check.cjs
node module-a/immersive-hybrid-v1/scripts/browser-check.cjs
```

`scripts/prepare.mjs` 可从现有工程重新提取vendor与真实图，不修改原模型；`prepare-scenes.cjs`记录本轮生成输出的本机路径，仅用于本轮素材归档，不是用户运行样片的前置步骤。

验收见 `docs/validation/immersive-hybrid-v1/README.md`。交互与构建通过；AI图为视觉候选，入口匹配与壁画边界融合仍待审图。不能称为现场实测复原或已正式上线。
