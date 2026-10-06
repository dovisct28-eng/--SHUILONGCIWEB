# B01 双模式探索入口 · 2026-10-06

状态：B01 高保真候选，浏览器技术验收通过；最终视觉确认与真实摄像头/手势实机验收待用户完成。本轮不进入 B02 或体感内部界面高保真设计。

开发前 `git fetch origin`，本地 HEAD 与最新 `origin/master` 均为 `39167fa97bfa5185fa662bf70a4fd25469488497`。已阅读根 AGENTS、PROJECT_CONTEXT、DESIGN_SPEC、HIFI_VISUAL_SPEC、MODULE_A_HIFI_RELEASE、MODULE_A_NAVIGATION_PLAN、B index/server、实际 assets 及 A08 入口实现。A 的发布记录为技术验收候选，不把它描述成已经用户审图冻结。

## 改动与素材

- `Mural-Exhibition/public/index.html`：只重做 B01 与入口/返回生命周期。删除旧横移、诗文 DOM、标题/按钮延时、底部宣传字幕及固定 5 秒就绪判定；没有保留零时长的旧开场。
- `Mural-Exhibition/public/b01.css`：独立 B01 样式。左侧真实第二幅左端局部，右侧宋体标题、黑体功能文字与横排双入口。深墨空间、暖浅实体主按钮、细描边次按钮；52px 操作高度、focus-visible、轻 hover、0.4 秒图像淡入，reduced-motion 取消过渡。顶部只有「出兵入将」与 EXPLORATION，正文严格采用任务书文案。
- `Mural-Exhibition/public/b01/mural-02-left.webp` 与 `manifest.json`：来源是 A07/A08 同源的 `水龙祠壁画素材/网页展示图/mural-02-display.webp`，6000×1357；左端裁切 `[0,0,2250,1357]`，比例缩放到1800×1086、WebP质量88，820,680 B。没有镜像、修复、改色、拉伸或覆盖源图；源/输出 SHA256 见 manifest。`Mural-Exhibition/b01-art.py` 可用 Pillow 重现生成。
- `Mural-Exhibition/b01-check.cjs`、`b01-browser-check.cjs` 与 `package.json`：静态保护/语法检查、真实浏览器回归与 npm 测试入口。
- 本目录：实际浏览器截图、结构化结果与本记录。

没有改动模块 A、B 移动端、server.js、扫描接口、图鉴数据结构、热点坐标、着色器、原有壁画视锥/渲染计算、手势算法、图层与视频逻辑、母版或归档引用。原 WebGL 循环只增加启动/停止调度，沿用同一个 renderer。工作区原有归档文档/脚本/测试修改、图片删除及其他未跟踪材料未纳入本次提交。

字体使用系统 Songti/SimSun 标题与 Microsoft YaHei/PingFang/system-ui 正文回退，没有增加全量字体或网络字体。具体字体呈现取决于设备；本轮未冻结项目字体或色板。

## 入口与返回

首页无需等待体感 CDN、全景母版或图鉴详情图片即可阅读和选择。首页图像有独立状态与重试，失败不阻塞按钮。点击模式后才请求扫描接口（12秒超时）；进入地图才加载原全景底图（20秒超时）；进入体感才加载原 GSAP/MediaPipe/Three.js 依赖及选中条目的线稿/色稿。脚本与摄像头启动各有15秒超时反馈。

以 `selection / gallery-map / gallery-detail / cyber` 记录现有页面状态，集中控制显示与 inert，取消原嵌套转场定时器。重复点击以入口忙碌锁序列化；异步返回通过版本标识取消过期进入。地图返回 B01、详情返回地图、体感返回 B01；地图新增体感快捷入口，置于原坐标采集器下方避让。体感切回现有图鉴详情，继续保留所选条目。

摄像头只在主动体感入口启动。拒绝、无设备、占用、不支持、组件失败及超时均可返回。返回/切图鉴停止 Camera 与媒体轨道；晚到的启动结果再次停止；pending 启动期间不会创建第二个摄像头任务。pagehide 清理摄像头，BFCache 恢复重置选择页。没有新增路由、pushState 或覆盖 A 的滚动恢复。

## 真实素材问题核实

任务书中“splash-bg.png 未发现”不适用于本机：本机文件存在，17507×3960，149,142,026 B。它受 `.gitignore` 排除，无法假定新克隆仓库自带。全景地图仍使用 `assets/splash-bg.png`，没有拿 B01 裁切图伪造地图或移动热点；缺失时留在 B01，提示并允许恢复资源后重试。该原底图的体积及既有高清图层加载成本属于 B02 的后续性能工作，本轮未替换其加载方案。

体感沿用原有外部 CDN。断网时首页与本地图鉴可用，体感显示组件失败并提供重试。完全离线的 MediaPipe 包及 WASM 本地化不属于本轮入口视觉重制，未伪称体感已经完全离线。

## 验证记录

- `npm test`（在 Mural-Exhibition 目录执行）：通过。HTML 模块语法、server.js 语法及与基线逐块对照通过：原热点数组、全景拖拽/滚轮、图鉴数据/图层/视频、着色器与原渲染计算、手势算法保持。无打包构建器，本检查不称为打包产物。
- `node Mural-Exhibition/b01-browser-check.cjs`：真实 Chrome/headless 通过，原始数据见 [results.json](results.json)。浏览器需要 Playwright 与联网访问原体感 CDN；沙箱首轮阻止 CDN 的网络限制已在具有网络权限的进程中复测。
- 1920×1080、1440×900、1366×768、1280×800：品牌、标题、正文和按钮均在视口内，无页面横向溢出；无旧开场延时。截图逐张人工检查了材料清晰度、文字层级、主体/负空间及按钮状态。
- 图鉴：原全景图、8个原坐标热点、鼠标拖动、滚轮缩放、真实热点点击、原图/线稿/色稿、详情→地图→B01通过；B02视觉保持。
- 体感：真实 CDN 库与现有 WebGL 初始化通过；在真实 Camera 库的设备边界注入 NotAllowedError，提示与返回通过。另模拟 NotFoundError/NotReadableError/NotAllowedError；6次 Camera 模拟启动/停止，最大同时运行1、最终活动0、renderer数量1。晚到权限完成后清理通过。**这些结果不等于真实摄像头或手势实机通过。**
- 20次快速点击、首页图失败/重试、地图图失败/重试、扫描接口失败/重试、CDN阻断、不支持摄像头、Enter/Space/focus、减少动态效果通过；页面运行错误记录为空。Three ES模块导入失败后的浏览器缓存通过新URL重试恢复，另有实际阻断/恢复用例通过。
- A/B联调：实际4175服务 A08（42屏）→原主动链接→3000 B01→浏览器返回恢复42屏通过；B01刷新通过。A08截图用于同源左端视觉对照，不改 A 代码。
- `git diff --check`：通过。固定低保真 Tag 解引用与归档分支仍为 `48f272497e86e4549c5bcd0dee275ff347171a3f`。

## 性能边界

首个1440×900上下文为冷加载，后续三个尺寸为同上下文缓存加载。results 包含各次 DCL、资源传输字节、截图完成用时与布局；截图完成用时包含0.4秒淡入等待，不能当成交互就绪时间。冷加载实测首页图传输约821KB；没有请求原149MB全景图、扫描接口、org/line/color、体感库或创建 WebGL renderer。DOM仍有原摄像头输出canvas，隐藏且没有采集；并不把它算成新增renderer。

本轮没有同机旧版对照、GPU/完整进程内存测量或长期压力测试，不能声称跨设备统一提速或已经证明无泄漏。B01不新增持续RAF，原体感RAF在选择/图鉴状态停止。原图与材质的资料追溯边界保留；B02既有详情兜底文案未在本轮重新核实史料。

## 浏览器证据

| 状态 | 实际截图 |
| --- | --- |
| B01主画面 | [1440×900](b01-1440x900.png) |
| 桌面适配 | [1920×1080](b01-1920x1080.png)、[1366×768](b01-1366x768.png)、[1280×800](b01-1280x800.png) |
| 按钮反馈 | [Hover](b01-hover.png)、[Focus](b01-focus.png) |
| 图鉴 | [全景](gallery-map.png)、[左端热点](gallery-map-hotspots.png)、[详情](gallery-detail.png) |
| 体感 | [真实界面与模拟拒绝权限](cyber-permission.png)、[依赖异常](cyber-dependency-error.png) |
| 资源异常 | [接口](asset-api-error.png)、[地图](map-image-error.png)、[首页图像](splash-image-error.png) |
| A08对照 | [原A08](a08-source.png) |

Commit SHA 与 push 后远程核实结果以本次交付回复及 Git 元数据为准；本文件不填尚未生成的自身提交 SHA。最终视觉需用户确认后才进入 B02高保真。
