# 项目开发规范：V3.5 正式整合主线

本项目为“水龙祠壁画数字交互体验”。当前开发及远程同步仅使用 `feature/shuilongci-hybrid-gallery-v1`，不推送、合并 master，不向低保真归档提交。

## 正式架构与入口

- 模块 A：`/module-a/a01/`，A01开屏 → A02建筑空间 → A03主题及主动展厅入口。根路径及模块A启动器进入该页。
- 五铺展厅：`/module-a/gallery/`，建筑总览 → 大门进入 → ① → ② → ③ → ④ → ⑤ → 用户主动进入模块B。不得恢复旧⑤→①→②为正式路线。
- 模块 B：`Mural-Exhibition/`，本地 `http://localhost:3000/index.html`，图鉴探索及体感交互。模块A通过明确路由接入，不依赖或重写B内部缩放、热点、Canvas/WebGL、加载、节点和数据结构。
- A/B空间方案必须保留：`?layout=model`（③右④左）、`?layout=report`（③左④右，再回左⑤），包含独立轨道、相机、返回标记与状态恢复。第三/第四铺方位待导师核对，均不得称为现场正确版；B后墙AI机位不匹配时保留原模型安全回退。
- 正式gallery使用V3.5母版与既有Combined B运行时。`study-v3.2.mjs`、`gallery-v3.3.mjs`、`route-v3.4.css`及`route-v3.5.css`等旧编号代码仍属于当前依赖，不按文件名清理。
- `v32.html/v33.html/v34.html`独立原型已退役；参数、算法和有价值源码保留。历史测试/捕获脚本不等于当前验收入口。`?legacy`保留旧A04–A08高保真实现，属于历史路径；不得作为默认开发主线。

详见 [V3.5整合](docs/validation/interior-visual-v3-5/INTEGRATION.md)、[方位对照](docs/validation/interior-visual-v3-5/ROUTE-COMPARISON.md)、[当前架构](docs/CURRENT_ARCHITECTURE.md)。

## 修改范围与保护

开始前检查实际结构、入口、路由、图片加载、构建和测试，判断属于A、B或shared。优先最小修改；确需跨模块先说明原因。不得为A需求无关重构B、替换大图加载、移动热点、删除已有交互或改信息架构。B01/B02/B03的功能和视觉默认保护。

Combined B（Corridor B＋Stage B＋Roof B）模型及构建链路、真实壁画、已确认③④裁切、AI辅助图、投影蒙版、深度层、纹理及相机配准数据必须保留。不得未经要求重建模型或以生成图替代文物资料。

壁画母版、实地照片、手工作品和设计源文件不得直接覆盖、改色、增添人物纹样或自动修复替换。采用 Master → Web展示 → 多分辨率/Tile 的派生链，懒加载大型图片，保持来源可追溯。

不得编造历史、人物身份、仪式、象征或历史观看顺序；现场未核实内容写“待确认”。数字①②③④⑤为项目观看路线，交互方向与历史/空间路径分开说明。

## 视觉、技术与本地运行

模块A高保真规划、打样、开发或审查前先读 [HIFI_VISUAL_SPEC](docs/HIFI_VISUAL_SPEC.md)，结合 DESIGN_SPEC、CONTENT_MAP 及所属章节文档。当前架构覆盖文档中的旧三铺/A04–A08主线与旧master流程；历史解释保留作研究记录。区分冻结规则、推荐范围、候选和禁止项，外部审美参考不得覆盖项目规则。

采用既有原生HTML/CSS/JS、SVG、Canvas、GSAP及必要Three.js；不无故更换技术栈。优先localhost完整运行，不新增默认在线服务依赖。关注首屏、大图、内存/GPU、动画和不同视口稳定性。技术测试不等于用户视觉确认或现场真实性验证。

## Git、测试与交付

1. 开始先检查分支/HEAD、fetch同名远程功能分支、暂存/未暂存/未跟踪/忽略文件和worktree。保护原有工作，不reset覆盖、不批量clean、不遗忘stash。分叉先核对差异并安全同步。
2. 代码改动更新并运行相关测试、必要构建检查及实际浏览器验收；视觉/交互覆盖1920×1080、1440×900、1366×768及正常/减少动态。不得通过删除测试或放宽断言掩盖回归。退役入口可删除存活断言，但保留正式入口功能覆盖。
3. 原始截图/录像默认输出到忽略目录 `docs/validation/<阶段>/local/`；V3.5脚本通过 validation-paths-v3.5.cjs 默认写local/latest，V35_OUTPUT可覆盖。只提交测试摘要、必要JSON及约6–10张精选图。清理不减少测试覆盖。
4. 全部相关修改、验收和文档完成且无新增回归后，自动创建准确commit并push `origin feature/shuilongci-hybrid-gallery-v1`，fetch核实SHA，不等待额外push指令。不误提交原有用户工作，不force push、不重写历史或GC。网络失败保留同一commit并如实报告，重试不创建重复commit。
5. 交付说明：修改、测试、未验证/既有问题、commit SHA、远程同步与核实结果。未通过不能称为通过；体感CDN/摄像头限制与清理回归分开记录，不以模拟设备替代实机验收。

## 低保真永久冻结

固定commit `48f272497e86e4549c5bcd0dee275ff347171a3f`，Tag `module-a-lofi-final-v1.0`，分支 `archive/module-a-lofi`。不得移动、删除引用或向其提交后续开发。

保护 `启动低保真归档.bat`、`scripts/Start-LofiArchive.ps1`、`scripts/lofi-launcher.test.cjs`、Test-LofiArchive与Validate-LofiBrowser、docs/LOFI_ARCHIVE.md，以及 `.lofi-preview/`、`.lofi-runtime/`。启动器必须校验固定基线并独立运行A01–A08，不改变当前分支。

## 历史清理与资料保留

当前V2清理为2026-10-31用户任务书的一次性授权。只按 [文件级清单](docs/maintenance/repository-cleanup-v2/cleanup-plan.json)删除，恢复点 `pre-repository-cleanup-v2-2026-10-31`。原有未提交变更列入保护清单；不确定用途、来源或恢复条件者列REVIEW并保留。

小体积代码、参数、SVG、JSON、设计演变与技术说明优先保留。后续历史删除仍须明确任务授权及文件级审查，不能重跑本轮已执行删除命令。V1维护报告保持真实历史记录。后续验收遵循 [精选规则](docs/VALIDATION_ARCHIVE_POLICY.md)。
