> 当前入口为 `/module-a/gallery/`。v32/v33/v34独立HTML及其预览入口已退役；下文参数/算法保留为历史研究记录，需要旧页面时从pre-repository-cleanup-v2-2026-10-31恢复。v35母版、正式运行控制器及AI/相机资源继续保留。

# V3.2 第一铺至第二铺独立原型

入口：`v32.html`，双击 `启动V3.2.bat`。原 `index.html`、V3.1 阅读展墙、细读组件、介绍文本、五铺数据、正式展厅和模块 B 保持原文件。基线为功能分支 `cd8f624e59a3ad2f0ea3efa59e20bf1109325748`。没有构建新 GLB 或修改 Combined B 主体几何。

## 连续路线

`route-v3.2.mjs` 使用原安全走廊节点构造限幅三次曲线，以弧长表驱动位置，仅在整段首尾减速，不再逐节点停靠。位置、视线、FOV 同时插值。路径约 23.43 模型单位，模型单位不是实测米；700 段、半径 0.18 单位、双向偏移射线检查无碰撞。动态运行前仍复查。逆向使用同一曲线；原第二至第五铺路线保留，通过原第二铺节点接入。

按用户追加意见，第二铺停靠点改为 `[-0.65,1.85,-11.75]`，朝向 `[4.515,1.85,-11.75]`、FOV 48，以露出整面墙及上下结构。三个测试视口的真实壁画角点另存验收 JSON。减少动态保留必要空间行进，跳过非必要显影、展开和 UI 动画。

## 新素材与配准

五个实际模型机位位于 `assets/route-v3.2/references/`。相机 position/target/FOV、projection、matrixWorld、模型变换、语义分类、结构边界、深度编码见 `camera-manifest.json`、`*-regions.png`、`*-boundaries.png` 和 `prepared/*-depth.png`。RGB24 深度为参考相机正向眼空间距离，解码 `dot(RGB,[65536,256,1])/16777215*40`，零为背景。完整 Float32 导出保留本地，不重复提交。

用 image_gen 基于对应参考画面生成五个机位，另保留一个被后退机位替代的旧停靠候选。逐条提示词、源文件路径和生成状态在 `generation-records.json`；可移植候选为 `candidates/*.webp`，生成 PNG 保留在本地及 CODEX_HOME。候选全图有局部结构偏差，不能作为文物资料或直接覆盖屏幕。空墙要求已用于生成提示，并单独保留真实壁画图层。

`route-surface-v3.2.mjs` 只复制原三角面用于投影；固定世界坐标与参考矩阵防止屏幕贴图滑动。参考深度拒绝错误遮挡面的采样，实时深度缓冲保留木柱和屋架遮挡。独立五机位权重不复用入口四机位时间曲线。模型语义蒙版向内腐蚀，外侧保持零值；准备阶段使用模型/AI 的低频明暗比匹配照度，保留生成微纹理。

当前有效融合限于可靠墙面与地面小块。生成的木构、屋架、台阶等不可靠部分排除，保留原模型材质；第二铺整面候选墙和第一铺真实壁画区域在投影 shader 中排除。第二铺停靠候选安全蒙版全零，未把它误报为整墙 AI 融合。AI 占比随几何可靠性变化，主殿转角融合明显少于东廊。当前方案没有实现全路线木构/屋顶 AI 材质替换。

## 真实壁画与阅读衔接

第二铺仍用 `/水龙祠壁画素材/网页展示图/mural-02-display.webp`，候选墙位、比例和 `registration: candidate` 不变。接近时已存在贴合墙面的暗图层；停靠后先出现克制黑体标题，再改变材质 RGB 光照增益显影，opacity 始终为 1。亮度只作用于展示材质，原始图像未改动；这是一套展示光照曲线，没有声称完成物理照明重建。

墙面到全幅使用同一真实资源，根据第二铺 Mesh 实际角点、当前相机与阅读图像 contain 尺寸计算。正面停靠时按当前投影矩形展开，逆向收回；没有使用第一铺固定角点。该实现适用于正面停靠，不是任意斜视角的四边形单应展开。异常斜视/裁切时采用短时可逆图像桥接，`body.dataset.bridge` 标记回退。复用 V3.1 全幅/细读 UI 与背景。

## 复现

- `node --test module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/route-v3.2.test.mjs module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/study.test.mjs module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/ambience.test.mjs`
- 启动 localhost:4186 后运行本目录 `browser-v3.2.cjs`，依赖环境中的 Playwright、sharp、Chrome，不增加正式运行依赖。
- `capture-v3.2.cjs` 导出实际模型参考；`prepare-v3.2.cjs` 生成展示候选、安全蒙版及深度 PNG。完整参考捕获临时使用单独离线 renderer，完成后释放；运行原型仍复用原 renderer。

实机检查、精选截图与连续录屏见 `docs/validation/interior-visual-v3-2/`。浏览器检查不是最终用户视觉验收；第三至第五铺尚未采用本次新素材与曲线。
