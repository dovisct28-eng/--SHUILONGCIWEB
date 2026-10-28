# V2.3 水龙祠原境 → 第一幅壁画数字阅读

> Repository Cleanup V1.0 历史提示：本页为当时版本的验收记录，以下入口、命令和视觉结论仅适用于[该历史提交](https://github.com/dovisct28-eng/--SHUILONGCIWEB/tree/ddef1d8daa31c13de4a83285713d5afb0f13817a)，不代表当前版本。当前共享建筑基线为 Combined B / V2.4-B1，入口与范围见[当前展厅说明](../../../module-a/immersive-hybrid-v1/README.md)；本页原有历史证据完整保留。

2026-10-27。范围为功能分支 `feature/shuilongci-hybrid-gallery-v1` 的独立候选入口。开始前重新 fetch，远程最新基线为 `1c811b58c1a4eb7beb5583c7d4ee832f54ee76dd`；未合并 master。首轮 Windows Schannel 握手失败，使用命令级 `http.sslBackend=openssl` 后成功，没有修改全局 Git 配置。

## 实现与资料依据

正式候选入口仍为 `module-a/immersive-hybrid-v1/index.html` / `src/entry-main.mjs`。建筑、环境、GLB、原入门轨道和廊道轨道保持，`sampleGallery()`、`GALLERY_STOPS`、V2.2.1 墙面/木构/地面/光影模块均与基线一致。

流程为「右廊停靠 → 走近壁画 → 原位观看 → 展开壁画 → 数字阅读」，原位状态不会自动继续展开。返回墙面后再返回廊道；从阅读点击旧导航时，也先按相同参数反向收拢、转回，再走旧轨道。鼠标、方向键和滚轮使用相同状态机，忙碌时拒绝重复输入。减少动态模式将每段缩至约 100ms。详细查看复用 V1 的 `mural-viewer.mjs`，支持等比缩放、拖动、复位、Escape 关闭与焦点恢复。

首处壁画使用原 `mural-01-display.webp`，与用户提供的 `水龙祠壁画素材/网页展示图/mural-01-display.webp` 字节相同，2880×990。核对了 `shuilong-temple/mural-locations.json` 中 mural-01 的墙位、锚点、展示尺寸及 `docs/CONTENT_MAP.md` 的 A06 资料记录，未仅凭文件名判断编号。UI 显示项目第一幅和右侧廊内墙的位置，不新增人物身份或仪式解释。精确现场尺寸和这处锚点仍属于设计模型资料，未新增现场测量或原始文献核验。

世界锚点 `[4.865,1.55,4.8]`、Y 旋转 `-π/2`、宽高 `3.65×1.2547` 不改。平面的图像四角依次为左上、右上、右下、左下，局部 +X 对应世界 +Z；完整 UV、单面朝向，无镜像、裁切、重绘和母版修改。模型高度是四舍五入值，与 2880:990 原图比例的相对差约 0.001%，小于当前显示尺度的一个像素。

新增物理转向以原 `time=2` 姿态起步，视线高度 1.38、FOV 48 不变，相机向廊内平移 0.30 个模型单位并平滑右转，最终位置 `[3.55,1.38,7.65]`。轻微向上调整注视方向，让近端上角进入视域。400 段、5 个偏移的双向射线扫掠未发现碰撞；这是半径 0.065 设计单位的离散软件检查，不替代实测净空。

## A → B → C → D 的可复验状态

| 阶段 | 实现 | 可复验方式 |
| --- | --- | --- |
| A 纯 3D 转向 | 独立转向采样、真实墙位壁画、建筑遮挡和逆向返回 | 右廊停靠点点击「走近壁画」，停留在 `mural-look`；此时没有阅读暗场或展平 |
| B 同位置接管 | 原位层与数字层共享纹理、几何和当前投影 | 在原位打开调试；壁画进度 0–0.35，0.175 为 50% 接管；切换 Original 3D / Hybrid / 2.5D |
| C 数字阅读 | 0.35 后虚拟阅读相机连续转正、构图展开，0.82 后出现文字与控制 | 点击「展开壁画」；最终完整阅读图，详细查看使用已有 viewer |
| D 反向与故障 | 使用同一参数反采样，恢复真实遮挡、相机和旧轨道 | 返回墙面 → 返回廊道；旧导航可继续退至门内；故障提供重试并保留可用原轨道 |

完整正常运动约 3.2 秒：物理转向 1.45 秒，含接管和展平的阅读展开 1.75 秒，中间允许无限停留。正反向没有独立的第二条轨道，不累加相机变换。

## 合成方法及必要 API 扩展

L0 为原建筑；L1 为有世界坐标的真实壁画；L2 保留同机位的原建筑画面，以程序暗场降低环境权重；L3 为晚出现的父页面文字与控制。没有使用旧 V1 生成室内图、全屏交叉淡入、黑场、AI 壁画或第二套建筑。环境停留在原真实渲染机位，作为有限交互下的深度背景；没有制作新的分层环境位图或夸张视差。

原建筑后处理包含 ACES 和分区调色，直接把壁画放进同一后处理会改变图像色彩。因此仅向 `shuilong-temple/a01-post.mjs` 增加只读 `getDepthTexture()`，不更改原渲染实现。候选运行时在原后处理完成后，使用**同一个 Renderer、Canvas 和相机**绘制轻量壁画合成场景，其中只有两片共享几何的壁画和一片暗场，无第二个 GLB 或建筑 Scene。壁画使用独立 sRGB 原纹理，不经过建筑调色；片元着色器读取该帧实际建筑深度，按投影深度丢弃被柱梁/墙体遮住的像素。不是固定 CSS 裁切蒙版。

配准阶段两个壁画层使用完全相同的原始投影算式；展平开始后，用虚拟阅读相机对同一刚性平面成像，连续插值位置和四元数，再逐渐将数字图像放到建筑前景之前。原物理相机保持在原位观看姿态。该阶段明确是数字阅读转换，不把虚拟阅读相机位置作为能在狭窄廊道实际到达的位置。

同一纹理同时复用两层；遮挡来自同帧真实深度纹理，不发生设备像素与父页 CSS 坐标混用。四角和矩阵参数可从调试面板导出 JSON。两组调试统计在动画中均限制为每秒最多 4 次更新。动态由一个父页面 RAF 时钟驱动，调用运行时立即渲染，未叠加第二套控制同一图层的动画时钟。非活动/停留时没有持续新增重绘。材质编译、纹理上传及首次小目标绘制在移动前完成；立即点击第一处导航也会等待准备，素材失败则保留可用原轨道并显示重试。

## 验证结果

- Node：展厅全部 21 项通过，其中新增壁画路径、投影、状态机、逆向、失败解锁等 8 项；原有模块 B 的 130 项通过。
- 构建/保护：[build-results.json](build-results.json) 核对 196 个文件；原始 GLB、壁画资产、旧轨道、V1、正式 A01–A08 源码保持，原后处理仅有上述只读 API 两行增加。固定低保真 Tag 与归档分支仍指向 `48f272497e86e4549c5bcd0dee275ff347171a3f`。
- 浏览器：[browser-results.json](browser-results.json) 实际 Chrome 156，1440×900、1920×1080、1366×768。包括旧轨道九处停靠、转向/原位/接管/阅读/反向、每尺寸五轮往返、快速重复输入、键盘/滚轮、缩放拖动复位、窗口变化、闲置停止渲染、缺图/解码失败/重试及 WebGL 不可用。正常运行 page/console error 为 0；故障注入的预期网络或 WebGL 报错与正常运行分开。
- 同位置 Original / 2.5D 对照差异记录在各尺寸阶段 B 中。两个尺寸均值/最大值为 0；最新 1920×1080 运行均值约 0.000708、最大 1/255，处于颜色量化级别，无边缘或尺寸跳动。三个尺寸均满足均值 <0.1、最大通道差 ≤3 的判据。
- 相机往返后与原终点对象数值完全相同；每尺寸五轮后均保持 50 几何 / 25 纹理，未出现计数持续增加。每页面只有一次 GLB 请求和一个原 Renderer / Canvas。
- 正式 A01–A08：[formal-results.json](formal-results.json) 在真实浏览器对比基线后处理与当前只读接口版本，文字、图像源、布局精确一致，2px 低频结构比较通过。A06 高分辨率壁画跨上下文栅格差较大，保留原始差值，不宣称所有章节逐像素一致。
- B01/B02 的实际浏览、缩放和详情通过；B03 遇到现有外部 gsap 资源加载失败，仅验证错误提示/重试回退，模型与摄像头启动未验证。B01/B02/B03 的本地基本浏览器结果单独保存在 [module-b-results.json](module-b-results.json)。物理摄像头和真实手势识别不在此次基本回归范围；当前工作区的人物资料和素材还有既有未提交修改，未据此宣称与 Git 基线的资料完全一致。
- 额外首击等待、阅读刷新复位、合成渲染故障后的精确回退/解锁/重入与 V1 运行见 [edge-results.json](edge-results.json)。实际录像及解码时间点、相机/图层/投影参数见 [motion-evidence.json](motion-evidence.json)。录像负载不混入性能对照。

## 性能与资源

[performance-results.json](performance-results.json) 使用本机 GTX 1660 Ti、1440×900、相同 Chrome、无录像，三轮交替顺序，各版本使用新上下文并统一禁用 HTTP 缓存，每上下文再走一次热循环。第一轮机器进程缓存与后续不同，启动耗时全部保留，不把不同缓存阶段解释为性能提升。帧数据是此环境的 RAF 帧间隔，不等同于实体屏幕刷新率或弱设备结论。

| 项目 | V2.2.1 基线 | V2.3 |
| --- | --- | --- |
| 原廊道 P50 | 约 4.2ms | 约 4.2ms |
| 原廊道 P95，三轮/两循环各段范围 | 4.2–4.7ms | 4.3–4.7ms |
| 原廊道最大帧间隔 | 8.4ms | 9.7ms |
| 稳定几何 / 纹理计数 | 48 / 24 | 50 / 25 |
| 新壁画专用解码/上传/预热 | 无 | 三轮总计 462.8 / 321.6 / 356.2ms，在运动前完成 |

新增转向/展平/逆向的 P50 约 4.2ms，P95 4.3–4.6ms，最大 12.6ms。首次转向耗时 1457–1470ms、首次展开 1757–1767ms；第二次转向 1452–1460ms、第二次展开 1752–1760ms，包含设定动画时长，不是资源准备耗时。全部原始分段数据均保留，未只报告平均 FPS。补充故障保护后的当前版本复测见 [performance-final-check.json](performance-final-check.json)，原廊道最大 8.4ms、新转场最大 8.3ms，P50/P95 和资源计数保持同量级。当前样本没有新增 >50ms 转场长帧，不据此承诺所有显卡无卡顿。

新增持久资源为共享壁画几何与暗场几何各一份，壁画纹理一份。2880×990 RGBA 含 mip 的估算约 14.50MiB，不是实际 VRAM 测量；没有加载 200–300MB 的母版。GPU 原建筑深度纹理复用，临时 64×64 预热目标即时销毁。多次往返不新增对象；离开页面释放新增纹理、几何和材质。

## 文件职责

新增：

- `src/mural-transition-controller.mjs`：独立相机转向、阶段曲线和互斥状态机。
- `src/mural-anchor.mjs`：原图/锚点元数据、四角和阅读取景计算。
- `src/mural-compositor.mjs`：共享纹理、真实深度、同位接管、数字阅读投影与资源清理。
- `src/mural-reading.mjs` / `src/mural-transition.css`：父页流程协调、阅读 UI、既有 viewer 接入和调试。
- 两个 `tests/mural-*.test.mjs`；七个 `scripts/mural-*.cjs`：浏览器、构建、性能、正式回归、模块 B、边界和录像复验。

修改：独立入口 `index.html`、`src/entry-main.mjs`、`src/temple-runtime.mjs` 和展厅 README；原 `a01-post.mjs` 仅增加只读深度 API。新增本阶段文档与精选证据。复用 V2.2.1 所有建筑/廊道模块、原 Renderer、深度目标和 V1 `mural-viewer.mjs`；未新增重复查看器。工作区原有 B 资料/素材删除、归档脚本和其他未提交内容均保留且不进入提交。

## 使用与复验

本地运行 `A01_PORT=4186` 对应的 `node module-a/a01/server.mjs`，打开 [候选入口](http://127.0.0.1:4186/module-a/immersive-hybrid-v1/)。本次保留该本地服务；模块 B 使用自身的本地 3000 端口。`?debug` 打开两组调试面板。

```powershell
$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node --test module-a/immersive-hybrid-v1/tests/*.test.mjs
node module-a/immersive-hybrid-v1/scripts/mural-transition-build.cjs
node module-a/immersive-hybrid-v1/scripts/mural-transition-browser-check.cjs
node module-a/immersive-hybrid-v1/scripts/mural-transition-performance.cjs
node module-a/immersive-hybrid-v1/scripts/mural-transition-regression.cjs
node module-a/immersive-hybrid-v1/scripts/mural-transition-edge.cjs
node module-a/immersive-hybrid-v1/scripts/mural-module-b-check.cjs
node module-a/immersive-hybrid-v1/scripts/mural-transition-record.cjs
```

最后运行录像脚本以更新真实反向中的第六帧与对照图。性能脚本通过 Git 读取固定 `1c811b5` 的入口/控制器/运行时并在浏览器请求层替换，保留可复验 V2.2.1，不重置工作区、不移动归档。各阶段完整回归/失败排查/录像解码帧在 `local/`，由现有忽略规则排除；只提交 `selected/` 中关键证据，具体字节清单见 [selected-manifest.json](selected-manifest.json)。

## 视觉审查与交付边界

截图中可见原廊柱、梁、墙面与真图关系连续；原位到正面由相同图像展开，最后完整呈现并保留低权重建筑痕迹。数字阅读阶段有意解除真实廊道的物理取景限制，其景深表现为受控的设计表达。基础技术与实际浏览器验证通过，整体视觉、转向速度和阅读构图仍为候选，供用户人工确认，不宣布最终定稿。没有扩展其他壁画停靠点、史实叙事、正式 A01–A08 或模块 B 功能。

最终同步状态及远程 commit SHA 由本次 Git 交付结果给出，避免文档自引用自己的 commit。只提交并推送该功能分支，不合并 master。
