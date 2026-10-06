# 模块 A 沉浸式导航与全局验收 · 2026-10-06

基线：重新fetch核实的master `20e6cd6deadf73e0c4532205babafe3d48b177f9`。当前状态：**高保真候选完成 / 技术验收通过 / 待用户最终视觉确认**。没有正式封版Tag。章节、壁画、模型及B内部未改，归档固定引用仍为 `48f272497e86e4549c5bcd0dee275ff347171a3f`。

实现说明和维护边界见[候选记录](../../MODULE_A_HIFI_RELEASE.md)，功能细节见[导航规则](../../MODULE_A_NAVIGATION_PLAN.md)。

## 结果与证据

| 验收 | 结果 | 原始记录 |
| --- | --- | --- |
| 完整单元测试 | 115/115，0失败 | [日志](unit-tests.txt) |
| 原生模块构建/保护检查 | 通过，A01只允许app接线，所有章节主体/B/素材/归档保护 | [JSON](build-results.json)、[日志](build.txt) |
| 导航实际浏览器 | 7视口、全部入口/键盘/焦点/快速操作/触摸/顺逆/刷新/resize/A04跳离恢复均通过 | [数据](browser-results.json)、[日志](browser-log.txt) |
| 实际B服务 | A02/A05/A08来源返回、A08主CTA、服务连接失败提示通过 | browser-results.json 的 returns / functional |
| 窄屏减少动态效果 | 390px触摸下，目录及A08主入口进入真实B并返回通过 | [日志](reduced-b.txt) |
| 全局画面对照 | 25个关键帧/边界正向对照、反向图片检查通过；仅排除导航及授权移位的末端交接提示后，主体最大3/255通道差 | [数据](comparison-results.json)、[日志](comparison-log.txt)、[对照图片](comparison) |
| 既有导读/交接/异常/路线 | a05/a06/a07/a08/multi/resilience/transfer/director，8项全部通过 | [回归数据](regression)，本目录 regression-*.txt |
| 多次性能采样 | 同机/同Chrome/1440×900、3组基线与候选、串行交替次序 | [数据](performance.json)、[日志](performance-log.txt) |

首轮受限权限下完整单元测试113通过，归档启动器用例因本机进程访问被拒绝而失败；未改归档用例，先以所需权限复跑114全部通过，用户追加巡视规则后最终115通过。新目录最初的focusout微任务时序使鼠标链接被提前关闭，改为判断relatedTarget后实测通过。A08品牌触及墙面上缘的问题通过收紧导航自身修正，墙面与章节文字未动。稳定A04播放期间导航属性修改为0，不每帧重写UI。

## 审图材料

[本地完整审图画廊](review.html) / [六帧总览](review-sheet.webp)。总览依次为A02默认、目录展开、A03海报、A04完整路线、A05巡视、A08终态。

| 关键帧 | 图片 |
| --- | --- |
| A01最终Hero，导航隐藏 | [A01](screenshots/a01-hero.webp) |
| A02默认导航 | [A02](screenshots/a02-default.webp) |
| 目录展开 | [目录](screenshots/directory-open.webp) |
| A03海报与导航 | [A03](screenshots/a03-poster.webp) |
| A04路线总结与原控件避让 | [A04](screenshots/a04-summary.webp) |
| A05整体介绍/巡视 | [INTRO](screenshots/a05-intro.webp)、[SCAN](screenshots/a05-scan.webp) |
| A06整体介绍 | [A06](screenshots/a06-intro.webp) |
| A07整体介绍/巡视 | [INTRO](screenshots/a07-intro.webp)、[SCAN](screenshots/a07-scan.webp) |
| A08最终墙面与主CTA | [A08](screenshots/a08-final.webp) |
| 390px移动目录 | [390×844](screenshots/nav-open-390x844.webp) |

其余1920×1080、1440×900、1366×768、1024×768、1440×650、760×768展开截图在screenshots内。WebP是浏览器PNG的压缩交付副本；原PNG留在本机工作树，未将大型重复历史截图全部纳入提交。25对基线/候选截图同样为真实页面截图压缩副本，不是生成式效果图。

画面审查：A02品牌与居中标题分开；A03顶部主题不被目录按钮覆盖；A04导航工具位于跳过/重播下方；INTRO单行品牌放在编辑区之前，SCAN按用户追加审图要求彻底隐藏品牌且移出焦点；A08品牌只在墙面上方暗区。三幅末端提示实测均与目录相交，统一向左移，窄屏另放在幅名下一行。文字、壁画及A08正文未改。开放目录是用户主动的局部覆盖，没有全屏遮罩或主体模糊。窄屏保留44px触控区域，点击后自动收起。应用内浏览器另手动实滚、展开与点击第五幅，并保留用户预览。

追加审图证据：[修改前](refinement-before.json) / [修改后七视口](refinement-after.json)，含23/24.8/29/31.8/38/39.8六处巡视与交接。修改后三幅品牌hidden/inert且display:none，所有可见提示与导航工具不相交。1440修改前后和七视口A07交接截图见screenshots的before/after及a07-handoff-*。

## 性能解释与限制

历史A08 P95 29.2ms指rAF帧间隔，并非四角投影脚本耗时或GPU时间。本轮在相同host/Chrome/headless/1440×900下串行做3组fresh context对照，先后次序交替。每段89个间隔，父页面render的同步脚本耗时用相同测试响应包装测量；包装未写入产品代码。菜单记录20次点击＋强制布局耗时，包含脚本和布局；不将其等同于GPU合成。

本轮最终样本（3次P95，单位ms）：

| 测量 | 基线 | 候选 |
| --- | --- | --- |
| A07巡视帧间隔 | 8.3 / 8.4 / 8.4 | 8.4 / 16.7 / 8.4 |
| A07父页面同步render | 3.2 / 3.8 / 3.7 | 3.3 / 6.1 / 4.1 |
| A08过渡帧间隔 | 29.1 / 16.6 / 12.6 | 12.7 / 16.7 / 16.6 |
| A08父页面同步render | 3.0 / 4.3 / 3.4 | 2.9 / 3.4 / 2.9 |
| 目录点击＋强制布局 | 无新增目录 | 2.3 / 2.8 / 2.3 |

三组均为1个Canvas、66 geometry、22 texture，后处理关闭。A07有一组波动，不能宣称统一提速；首屏就绪受冷启动影响。候选重复跨章后的JS heap快照为51.43 / 40.27 / 52.13 MiB，基线38.12 / 41.62 / 37.29 MiB，快照受GC时序影响，未据此确认内存泄漏或其不存在。低性能实机及长期稳定性仍待验证。

性能初始检查曾因直接跳Hero遗漏暂态线稿GPU分配，出现56/66 geometry计数差；记录保留在performance-warmup-diagnostic.json及对应日志。测试已改为两版都逐段经过相同开屏再采样，产品渲染未改；不能把尚未绘制的资源当成资源增量。

首屏没有新增narrative字体/壁画请求；一个Canvas、既有geometry与texture计数保持，post.enabled=false，无detail图。重复跨章后资源与JS heap快照记录在performance.json，不能据此证明所有设备无卡顿或不存在长期泄漏，也不能将JS heap当成完整进程/GPU内存。

既有四角投影、局部边缘合成、真实壁画及场景效果保留。单机样本有波动；最终用户审图、低性能设备实机性能仍待核验，不阻止在当前候选基础上进入B高保真设计。

## 复现与本地接口

项目采用原生ES模块，不存在根package.json或bundler。A可用 `启动模块A原型.bat`（4173）；本轮脚本目标为4175，独立终端设置A01_PORT=4175后运行 `node module-a/a01/server.mjs`。B在Mural-Exhibition目录运行 `node server.js`，端口3000。既有服务已运行时勿重复启动同端口。

配置NODE_PATH指向当前已安装的Playwright/Sharp依赖后，在项目根运行：

```powershell
node --test
node module-a/guide/build-check.cjs
node module-a/navigation/browser-check.cjs
node module-a/navigation/comparison-check.cjs
foreach ($task in @('a05','a06','a07','a08','multi','resilience','transfer','director')) {
  node module-a/navigation/regression.cjs $task
  if ($LASTEXITCODE -ne 0) { throw "Regression failed: $task" }
}
# 性能须在其他浏览器回归结束后单独执行
node module-a/navigation/performance-check.cjs
node module-a/navigation/pack-evidence.cjs
```

B入口探测为3秒上限no-cors连接检查，opaque结果不能判断HTTP状态或B内部资源；真实页面打开与返回另测。没有修改B的加载、热点或高保真设计。保留用户已有归档脚本/文档/测试改动及图片删除，未清理或混入本次提交。
