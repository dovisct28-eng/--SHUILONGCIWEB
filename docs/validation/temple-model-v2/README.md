# V2.4-B0 历史建筑候选 · 静态设计归档

**历史候选对照已归档，不再提供当前运行入口。** 用户已确认 Combined B（Corridor B＋Stage B＋Roof B），当前共享正式模型基线为 V2.4-B1。当前入口及范围见 [展厅 README](../../../module-a/immersive-hybrid-v1/README.md)，B1 原始证据完整保留于 [integration-b1](integration-b1/README.md)。

## 保留的设计过程

- [CANDIDATE_COMPARISON.md](CANDIDATE_COMPARISON.md)：廊宽、戏台、屋顶的取舍、比较口径和整合成本。
- [candidate-config.json](candidate-config.json)：可编辑候选参数；[model-manifest.json](model-manifest.json)：历史尺寸、三角形、SHA-256 与固定归档资源地址。
- `src/baseline-model.js`、`src/candidate-model.mjs`：仍被正式 Combined B 一致性测试及 B1 整合来源检查使用，完整保留。`src/cameras.mjs` 和 `src/glb-writer.mjs` 保留为可编辑设计资料。
- `camera-manifest.json`、各验收 JSON：当时比较与机位的历史记录，不能当作当前重新执行结果。
- `selected/01-original-corridor.webp`、`02-corridor-A.webp`、`03-corridor-B.webp`、`04-corridor-C.webp`：原走廊与 A/B/C 同机位/居中比较。
- `selected/05-stage-comparison.webp`、`06-roof-comparison.webp`：戏台及屋顶变化。
- `selected/07-combined-a.webp`、`08-combined-b.webp`、`09-mural-front.webp`：组合取舍与真实壁画正视。
- `selected/10-route-preview.webm`、`11-corridor-motion-comparison.webm`：独特动态对照保留。

全部 11 份精选设计证据保留。本轮移除 9 份历史候选 GLB、独立比较 HTML、只服务该页面的 loader/preview 及旧 B0 构建/验收脚本。当前正式构建、测试及运行不依赖这些文件；逐文件原因、哈希及恢复方式见 [维护清单](../../maintenance/repository-cleanup-v1/deleted-files.json)。

## 历史复现

完整 B0 文件可从[稳定 B1 Tag 中的历史目录](https://github.com/dovisct28-eng/--SHUILONGCIWEB/tree/temple-combined-b-b1-2026-10-28/docs/validation/temple-model-v2)恢复。若要重新运行原始候选对照，请另建隔离检出，使用 [B0 提交 ef0f366](https://github.com/dovisct28-eng/--SHUILONGCIWEB/tree/ef0f366/docs/validation/temple-model-v2) 的整套源码、正式基线 GLB 和脚本；B1 Tag 中共享模型已经更新，不适合直接复跑原 B0 一致性检查。

原 `build-candidates.mjs` 的“冻结源码等于正式源码”前提在 B1 后已失效，因此退役该命令。B1 目录的原始报告和脚本按任务要求逐字节保留，其中历史状态断言应在原提交环境复现；本次维护使用独立验证脚本和结果。
