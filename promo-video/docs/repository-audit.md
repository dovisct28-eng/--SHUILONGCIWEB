# 仓库、实现与资料审查

审查日期：2026-10-15（Asia/Shanghai）。范围为宣传片 Phase 1；属于独立制作规划，同时只读审查 A/B。未授权也未执行网页重构。

## 1. 已核实的远程基准

| 项目 | 结果 |
| --- | --- |
| 仓库 | https://github.com/dovisct28-eng/--SHUILONGCIWEB.git |
| 分支 | master |
| 审查起点 HEAD | `d90aaa29173269270420c18df4a2a37c21fbf8f1` |
| fetch后 origin/master | `d90aaa29173269270420c18df4a2a37c21fbf8f1` |
| 独立 git ls-remote master | `d90aaa29173269270420c18df4a2a37c21fbf8f1` |
| 提交说明 | fix: share gallery character introductions across module B |
| 提交时间 | 2026-10-14 13:11:06 +0800 |

首次受限命令无法联网且不能写 `.git/FETCH_HEAD`；随后提升权限执行 fetch/ls-remote成功。前次失败没有被当成已完成核验。本次规划提交之后，远程分支会前进，素材审查基准仍固定以上SHA。

源入口和功能代码均未在开始时的已跟踪差异中出现；素材通过 `git ls-tree` 对照基准，并逐项记录本地SHA256。实际浏览器检查使用带用户编辑的工作区，不冒充全新远程检出验收。

## 2. 用户最新本地操作

- 用户确认01–07人物介绍改动及 `10_上层猖兵/` 删除是其最新操作。保留，不恢复，不混入本任务commit。
- 存在本地未跟踪 `08_上层猖兵/`，其中 `meta.json` 的 `id` 与 `order` 仍为 `10`。`scanAssets()` 以元数据ID识别人，不能仅按目录名认定“第10人物已从应用消失”。本轮本地接口实际仍返回8人：01–07及来自08目录的ID10。
- 远程基准含01–07及10目录；本地08目录6文件为LOCAL_ONLY，旧10目录6文件为LOCAL_DELETED。没有推断用户改名的全部意图，也没有替用户修正ID。
- 另有归档启动脚本/文档、删除的建筑图及大量未跟踪历史文件。本轮均不触碰；不运行reset/clean、全仓库格式化或构建重生成。
- 影片主选人物01、02、03的图像与远程匹配；介绍正文存在用户新稿。正式制作前锁定“采用最新正文”的素材版本并重新登记，不拿远程旧稿覆盖。

## 3. 结构与启动

| 对象 | 实际实现 | 启动/入口 | 制作注意 |
| --- | --- | --- | --- |
| 模块A | `module-a/a01/index.html`、`app.mjs`，原生模块、连续滚动舞台 | 根目录 `node module-a/a01/server.mjs`；默认 `http://127.0.0.1:4173/module-a/a01/` | `A01_PORT`可改；启动BAT使用4173；不把每章当独立页面 |
| 建筑与场景 | `shuilong-temple/水龙祠-交互预览.html`、GLB、共享场景 | A内同源iframe；模型就绪 `contentWindow.modelReady` | 影片可独立复用GLB，不能改模型几何或在业务里加影片模式 |
| A04 | `module-a/a04/controller.mjs`、`path.mjs`、`timing.mjs` | 同一A舞台；自动导览 | 当前`TOUR_DURATION=45`秒，`LEGACY_DURATION=58`；文档旧58秒不是现行时长 |
| A05–A07 | `module-a/guide/`、`a05/a06/a07/content.mjs` | 同舞台18–25、25–32、32–40屏 | 整体介绍后右端→左端连续巡视；不具有B级人物热点工具 |
| A08/导航 | `module-a/a08/controller.mjs`、`navigation/exploration.mjs` | 实际进入地址 `http://localhost:3000/index.html` | 主动点击；3002展览启动器不能直接替代该链接目标 |
| 模块B | `Mural-Exhibition/server.js`、`public/index.html` | `cd Mural-Exhibition`；`node server.js`默认3000 | Express静态资源；B01为选择入口；B02/B03是同页状态，不是/b02、/b03路由 |
| B展览启动器 | `start-exhibition.cjs` | `node start-exhibition.cjs`默认3002 | 复用服务前检查 `/api/b03-runtime`，不能杀未知占用者 |
| B02数据 | `gallery-store.cjs`、`/api/scan-assets` | 动态扫描`public/assets/`，meta排序/热点位置 | 无需改业务即可增减资产；影片应按meta.id定位 |
| B移动页 | `/m`→`gallery.html` | 模块B已有独立移动入口 | 本片为PC 16:9，不混入移动端交互 |

## 4. 实际可用内容与边界

模块A：A01有屋檐近景、曲线后撤、结构线、实体显现和设计山谷；A02呈现建筑布局与壁画位置；A03引入主题；A04沿项目路线⑤→①→②停靠、回撤与总结。A05、A06、A07各有独立导读；A08沿第二幅左端接用户点击。电影可节选，不改变网页结构或声称影片看完等于完成全部导读。导航已在`app.mjs`导入实现，规范部分“待开发”属于被后续记录覆盖的历史表述。

B02：真实全景8192×1853，支持拖动、缩放、热点和人物索引。`switchLayer()`会解码和核对尺寸，提供原壁画、高清线稿、数字色稿；色稿存在video资源时可自动播放视频并回退静帧。影片的静帧对照应使用已登记PNG，或完整记录真实视频变化，不把色稿视频当原壁画动作。01三层均为1946×1319，尺寸一致不保证所有局部已逐像素配准，仍需检查眼、手和器物三个视觉锚点。

B03：`figure-stage.mjs`处理透明人物有效边界，`mural-surface.mjs`处理展示材质，`orbit-layout.mjs`/`orbit-stage.mjs`生成环绕图像细节面板。它们主要承载原图/线稿/色稿片段，不是可凭空编写历史论断的浮动文本卡。完整人物介绍仍是实际右侧阅读面板，和B02共用`infoPath`解析。数字色稿和figure须明确为数字化演绎，不等同原壁画原色抠图。

当前输入链为 `OperatorTracker → HandOwnership → GesturePointer → DwellController`。`INTERACTION_CONFIG`含操作人获取800ms、控制手获取350ms、目标驻留1000ms、移开释放250ms、阅读过渡750ms等候选校准值。有效同一控制手移动至目标：next→NEXT；view在NAVIGATION→OPEN，在READING→CLOSE；阅读态不NEXT。失效/暂停清零驻留，不能将旧进度补满。影片只复述控制机制，不把这些参数当实体展场性能承诺。

项目依赖边界：A模型/壁画为本地资源；B03仍按源码加载外部Three.js、GSAP、MediaPipe及模型资源。故“localhost运行”不等于B03完全离线可用。影片模拟不需要摄像头，也不应趁机重构依赖。

## 5. 规范与资料层级

已阅读 `AGENTS.md`、`HIFI_VISUAL_SPEC.md`、`DESIGN_SPEC.md`、`CONTENT_MAP.md`，并结合A01 V3、A04、A08文档、B03 V4.3与10月14日人物介绍验收记录核对实现。

- **已冻结/本次继续遵守**：真实素材原色、原几何、⑤→①→②设计路线、主动进入B、A/B边界、归档保护、一个一级视觉主体及宋体标题/黑体说明的方向。
- **推荐范围**：网页字号、间距、模型占屏比例，只能作为影片打样参考；1080p字幕应另测安全区和电视观看可读性。
- **待打样**：Accent精确色值、字体文件、镜头光照/速度、影片标题字号与转场。暖白/金色是任务书的影片方向，不能反过来冻结全站网页样式。
- **禁止**：生成或修复真实壁画、换色、镜像、杜撰人物身份或仪式、将模型/AI山谷写成测绘复原、将模拟动作写成摄像头验证。

“湖南江永，勾蓝瑶水龙祠”地点字幕得到项目资料及[湖南省文史研究馆考察报道](https://css.hunan.gov.cn/css/xxgk/gzdt/gydt/201603/t20160318_3265035.html)支持。年代、绘制者、仪式解释存在不同资料，本片不新增相关断言。人物名称按项目meta作界面标签，未重新确认每个人物身份的学术定论。

## 6. 本轮证据

`asset-register.json`：66条关键资产记录，40条字节匹配、7条仅换行规范化后匹配、7条正文改动、6条本地新增、6条本地删除。未读取超大母版生成副本，也未认证素材版权。

`runtime-audit.json`：真实Chrome 154.0.8037.98、1920×1080、本地实际页面；A模型就绪/单canvas及B02人物01三层载入通过，页面脚本错误0。未录制视频、未跑B03、不接摄像头、未做全视口回归或最终视觉验收。历史验收材料只作为参考，未挪用其PASS作为本轮结果。
