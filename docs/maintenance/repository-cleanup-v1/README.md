# Repository Cleanup V1.0

当前基线：Combined B / V2.4-B1。只维护功能分支 `feature/shuilongci-hybrid-gallery-v1`，不推送 master。

- [清理前基线](BASELINE.md)、[目录盘点](inventory.json)、[清理计划](cleanup-plan.json)
- [实际删除清单](deleted-files.json)、[保留清单](preserved-files.json)
- [交付报告](CLEANUP_REPORT.md)、[验证结果](validation-results.json)
- [B0 静态设计记录](../../validation/temple-model-v2/README.md)、[当前展厅](../../../module-a/immersive-hybrid-v1/README.md)

审核顺序：先盘点和哈希 → 审查依赖及保护目录 → 核实远程 Tag → 按明细删除 → 独立回归。未跟踪文件默认保留；本地仅删除 SHA-256 与保留的已跟踪验收文件一致的展厅自动输出，模块 B 本地资料完整保留。Git 历史不改写，删除不缩减历史仓库对象大小。

复验在项目根目录执行 `node docs/maintenance/repository-cleanup-v1/checks.cjs`、`node docs/maintenance/repository-cleanup-v1/replay.cjs browser`、`regression`、`module-b`（后两项为同一脚本参数）。浏览器使用既有 4186/3000 本地服务及本机 Playwright/Sharp。运行输出放 local/，不覆盖 B1 证据。旧 B1 固定时点保护断言保留供历史复现，本次使用维护期保护检查。

`audit.cjs --inventory` 与 `prepare.cjs` 是本轮盘点/计划过程脚本，不能作为日常清理命令重复执行。`--execute` 只在本次审核清单与 B1 HEAD 条件成立时使用，后续清理需新授权和新清单。
