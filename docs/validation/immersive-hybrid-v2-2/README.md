# 水龙祠原境数字展厅 V2.2｜廊道连续合成候选

> Repository Cleanup V1.0 历史提示：本页为当时版本的验收记录，以下入口、命令和视觉结论仅适用于[该历史提交](https://github.com/dovisct28-eng/--SHUILONGCIWEB/tree/933a353a569982415fb39604cf70798b6669e7b3)，不代表当前版本。当前共享建筑基线为 Combined B / V2.4-B1，入口与范围见[当前展厅说明](../../../module-a/immersive-hybrid-v1/README.md)；本页原有历史证据完整保留。

2026-10-26，分支 `feature/shuilongci-hybrid-gallery-v1`。开始前重新fetch，本地与远程均为 `4f80826592ffeeb2fa02243ff72c14c5917f3cad`。本轮不合并master，保留工作区其他未提交工作。

2026-10-27收尾复核：正式录像为完整浏览器视口，含原UI和CSS环境；经完整文件Blob解码抽查，已确认正向进入及反向返回。直接从本地HTTP跳转抽帧曾误读旧帧，原因是原型服务器不支持Range；不能据此认定原录像静止。排查候选保留local，正式WebM的SHA与实际解码帧差见 `video-metadata.json`。首次融合仍有单帧停顿，实测最大值保留在摘要，不宣称最终无缝验收。

三维延伸与实际局部图像合成已经实施；技术结果见本目录JSON，最终材质与运动采用等待用户动态审图。程序材质候选不等于精细室内美术已经定稿。

## 修改文件

以下源码路径相对 `module-a/immersive-hybrid-v1/`。

| 文件 | 用途 |
| --- | --- |
| `src/corridor-path.mjs` | 原5停靠点逐采样不变，追加5秒轨道、4状态、统一融合权重、第一幅锚点 |
| `src/corridor-layers.mjs` | 原表面提取、材料图像投影、预载/8秒超时/失败释放/重试/资源销毁 |
| `src/temple-runtime.mjs` | 原实例安装增强，导出相机、灯光、表面、线性深度及遮挡 |
| `src/entry-main.mjs`、`index.html`、`src/entry.css` | 九节点、同轨返回、加载门控、比较与手动融合调试 |
| `assets/hybrid-v2-2/` | 纹理原件/Web副本、实际RGB、深度、蒙版、配置及来源 |
| `tests/corridor.test.mjs` | V2.1保护、C1连续、眼位/FOV、可逆、加载权重与并发控制 |
| `scripts/corridor-*.cjs` | 模型探查、素材重建、保护检查、浏览器测试与动态证据 |

正式A01–A08、B、共享建筑入口、GLB、壁画、V1素材、固定归档引用未改。新增模块仅由既有 `gallery-entry && controlled` 专用入口加载。

## 空间与合成

实际GLB探查保存在 `local/model-geometry.json`。戏台石基x约±1.55、z约7.075–9.725，木构背面z约9.555；东廊柱列x3.25，z9.5、7.2、2.4等；内墙主面x4.89，廊道顶面y0.32，檐架约y2.62–2.73。均为设计模型单位，不是现场测量。

原门内 `[.12,1.38,11.15]` 出发，沿戏台背后右移，进入柱列与右墙之间。右廊建立机位 `[3.85,1.38,9.7]`；匹配机位 `[3.85,1.38,8.4]` 看向 `[4.05,1.38,2.4]`；终点 `[3.85,1.38,7.65]`。新增段FOV48、眼高1.38，沿-Z面向主殿。第一幅仍在前方右墙 `[4.865,1.55,4.8]`，不移动锚点或朝向。

保留V2.1原轨道。新旧两段在门内为零速度连接；新段内部为非均匀三次Hermite、连续一阶导数。普通导航在用户选择的节点停靠，完整重播连续通过内部控制点。所有操作与倒退采样同轨，融合权重从轨道推导。

采用「原几何表面投影图层＋原深度遮挡＋有限推进」。近景柱梁、屋檐、戏台、转角由原几何渲染；右内墙、廊道地面、主殿右墙承载从原三角面提取的浅层材料图像。保留原法线、UV、光照阴影，在漫反射阶段调制细节，再共同经过原ACES/AO，不重复烘焙光照或色调映射。

近景权重始终1，中景在局部轨道0.60–0.95渐入，远景0.66–1.00渐入。两张1024纹理在交接前预载；未准备好时保留原位置及三维，8秒资源超时后可纯三维继续。重试先返回 `corridor-3d` 再同轨融合，避免补图闪现。没有第二Renderer、重复GLB、全屏图片溶解、自由转身或CSS透视替代。

实时深度缓冲承担遮挡，离线蒙版只供检查。建筑几何始终保留，局部材料图像接管表面表现，这是保留几何的2.5D合成。

## 素材

S02、S03、S04整室图均已查看，方向/透视不能直接匹配本轮轴向镜头，未整图接入。仅从S04空白墙面提取 `[550,400,550,220]` 小块纹理、移除平均照明并叠加程序细节；铺地为程序材料。未新增AI生成调用，未覆盖V1原件/提示词，未修改或生成壁画。来源与重建说明见素材目录 `PROVENANCE.md`。

第一幅的独立挂载参数与原运行时能力保留，本轮不显现壁画，不开发其停靠和展开。室内美术丰富度、木构微表面、第一幅停靠属后续范围，当前画面仍须用户确认。

## 验证与证据

结果见 `unit-results.txt`、`build-results.json`、`browser-results.json`、`motion-evidence.json`，摘要见 `measurement-summary.md`。

精选：01门内、02右转、03廊道3D、04深度预览、05同机位增强、06手动50%、07终点、08对照、09实际正反向录像。截图来自实际浏览器，展板仅排列实际截图。完整三视口、61张融合相邻帧与正式回归图留在忽略提交的 `local/`。

相机/表面/灯光/后期/图层参数在 `handoff-*.json`。匹配深度为素材目录 `corridor-eye-depth.f32.gz`，Float32 LE、左上原点、线性正向眼空间-Z、模型单位、0为背景；尺寸/相机/量化误差在 `depth.json`。灰度PNG仅作预览。

限制：本机Headless Chrome，未测弱GPU或物理设备；纹理内存估计不等于真实VRAM。模型通行检查不是现场人体尺度认证。技术验证不能替代用户审图。部分导读截图存在高频纹理采样差异，独立复采曾得到0差异，底层原因未确证。报告保留原像素差异，回归同时检查源文件保护、准确文案/素材/布局一致及2px高斯平滑后的低频结构，不声称所有截图逐像素相同；没有为此修改正式产品。具体数值与验证方法见实测摘要。

## 复验

根目录设置 `$env:A01_PORT='4186'`，运行 `node module-a/a01/server.mjs`。另终端设置 `$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'` 后依次执行：

```powershell
node --test module-a/immersive-hybrid-v1/tests/*.test.mjs
node module-a/immersive-hybrid-v1/scripts/corridor-build-check.cjs
node module-a/immersive-hybrid-v1/scripts/corridor-browser-check.cjs
node module-a/immersive-hybrid-v1/scripts/corridor-evidence.cjs
node module-a/immersive-hybrid-v1/scripts/corridor-video-check.cjs
node module-a/immersive-hybrid-v1/scripts/corridor-report.cjs
```

预览为 `http://127.0.0.1:4186/module-a/immersive-hybrid-v1/`，旧V1在 `v1.html`。普通运行不需要测试依赖、联网API或新npm安装。
