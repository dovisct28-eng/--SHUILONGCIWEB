# 当前正式架构（2026-10-31）

开发分支：feature/shuilongci-hybrid-gallery-v1；不合并master。

正式路径：/module-a/a01/ 的A01→A02→A03，主动进入/module-a/gallery/，建筑大门→①②③④⑤→主动进入localhost:3000模块B。保留?layout=model与?layout=report的方位对照、状态隔离、刷新/返回恢复。③④现场方位待导师核对。

Combined B模型及完整运行链保留，V3.5母版v35.html通过sync-formal-v3.5.cjs同步gallery/index.html。旧编号JS/CSS仍被正式入口加载。旧v32/v33/v34独立HTML已退役；preview脚本只提示退役，不再打开失效页。有价值的旧算法、参数和捕获脚本保留作研究资料，历史捕获需先从清理Tag恢复入口。?legacy仍为历史高保真路径。

固定低保真A01–A08由独立worktree和启动器运行，不参与正式开发。保护固定SHA、Tag、归档分支及两个.lofi目录。

V3.5原始验收产物默认local/latest；evidence-v3.5.cjs只提升必要静帧，不自动提交完整录像。保留原测试结果及视频元数据。历史媒体在清理Tag找回，精确重复文件还可用清单中的存活副本恢复；未知原图不删除。

[整合说明](validation/interior-visual-v3-5/INTEGRATION.md) · [方位对照](validation/interior-visual-v3-5/ROUTE-COMPARISON.md) · [清理报告](maintenance/repository-cleanup-v2/CLEANUP_REPORT.md)
