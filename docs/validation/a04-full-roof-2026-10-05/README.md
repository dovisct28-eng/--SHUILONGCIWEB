# A04 主殿屋顶全部透空：批注修正验收

基线：GitHub `master` / 本地 `33f3cfdd2a766c1673662666da07ad58c50be624`，修改前已 fetch 核实。用户要求批注区域屋顶全部透空，取消主殿残留的小段坡面。

## 修改

- 第五铺窗口半宽由 `[4.3, 4.1]` 改为 `[6.9, 4.4]`，覆盖主殿屋脊、檐口和两侧坡面；中心不变。实际模型屋顶 X 范围约 `[-5.381, 5.381]`，Z 范围约 `[-15.698, -7.402]`，全部顶点位于片元剔除的完整范围内。
- A04入场、0–8秒第五铺观看以及滚动靠近第五铺时使用完整主殿开口。8–10秒平滑收回原移动窗口，后续第一铺、第二铺窗口、36–41秒回撤与完整屋顶总结保持。
- A03仅同步末端交接窗口，避免交接跳切；五尺寸稳定海报与基线像素对照差异均为0。同步离线预览内嵌源码，未重建模型。
- 镜头、路线、控制器、时长、布局、A01/A02/A05–A08、Module B、壁画、GLB、anchor与低保真归档未修改。本地已有归档脚本/文档修改及图片删除不纳入本次提交。

## 验证结果

相关单元测试21/21通过，覆盖完整屋顶边界、窗口连续性、全景恢复、45/58秒路径一致性、材质保护与共享世界。原生模块和内嵌模块语法检查通过；离线源码与当前源文件一致；受保护资源差异为空；两个归档引用仍指向 `48f272497e86e4549c5bcd0dee275ff347171a3f`。

Chrome检查1920×1080、1440×900、1366×768、1024×768、780×614全部通过：主殿屋顶顶点全覆盖、单canvas、无横向溢出，正向/反向滚动、reduced motion、刷新正常。780×614实际自动播放验证第五铺停靠和45秒自然完成；完整总结屋顶恢复，重播/跳过正常。控制台和运行时新增错误为0。

既有 `transition-check.cjs` 在本轮4173服务执行，四个桌面尺寸全部通过，包含A04→A05投影、resize、反向滚动、刷新和reduced motion。测试默认4175服务未运行，首次执行连接被拒绝；改用当前4173服务后通过。

人工对照检查：主殿残片已消失，廊屋面、入口/戏台及主殿支撑结构保持；全景总结恢复完整主殿屋顶。此处为既有模型的展示剖切，不代表历史建筑开口。

## 证据与复现

- [实际入场（对应批注窗口）](actual-entry.webp)、[实际第五铺停靠](actual-fifth.webp)、[自然完成总结](actual-summary.webp)。
- [1920修改前](1920-before.webp) / [修改后](1920-after.webp)；[780修改前](780-before.webp) / [修改后](780-after.webp)。其余三个尺寸也保留前后对照。
- [移动窗口10秒](1920-time-10.webp)、[第一铺20秒](1920-time-20.webp)、[总结45秒](1920-time-45.webp)。`time`和前后对照图通过测试固定模型状态，父页字幕维持已完成状态；真实运行图使用 `actual` 前缀。
- [浏览器结果](results.json)、[构建与资源保护结果](build-results.json)。

```powershell
node --test module-a/a04/state.test.mjs module-a/a04/path.test.mjs shuilong-temple/a04-roof.test.mjs shuilong-temple/shared-world.test.mjs module-a/material-isolation.test.mjs shuilong-temple/source-equivalence.test.mjs
node module-a/a04/full-roof-build-check.cjs
$env:NODE_PATH='C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
node module-a/a04/full-roof-check.cjs
$env:MODEL_VALIDATION_DIR='docs/validation/a04-full-roof-2026-10-05/transition'
node -e "eval(require('node:fs').readFileSync('module-a/a04/transition-check.cjs','utf8').replaceAll('127.0.0.1:4175','127.0.0.1:4173'));"
```
