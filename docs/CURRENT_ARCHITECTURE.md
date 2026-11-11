# 当前正式架构

开发分支：feature/shuilongci-hybrid-gallery-v1；不合并master。

本地从 `http://127.0.0.1:4173/module-a/a01/` 开始。已有 `启动水龙祠数字展厅.bat` 的工作区可联合启动模块 A、B。A01→A02→A03 后主动进入 `/module-a/gallery/`，经大门观看①→②→右侧③麒麟→左侧④盘龙→左侧⑤，走出大门后进入仪式解读，再主动进入 localhost:3000 的模块 B「第二铺壁画探索」。

2026-11-09 再确认第三铺为麒麟、第四铺为盘龙。正式展厅只有一条路线，旧 `layout` 链接沿用这条路线。模型墙位和图像配准属于数字展陈设计。

V3.6 复用 Combined B 和既有相机、显影、图像加载运行时。正式母版仍为 `v35.html`，由 `sync-formal-v3.5.cjs` 同步 `gallery/index.html`。全幅和细读均可继续。细读先复位至全幅，沿既有图像过渡返回墙面，再按照片贴图的局部横轴从右向左巡视。巡视完成后从实际终点接到下一铺。前进和后退均保持原停靠位置，后退使用原轨道。自动播放期间锁定路线输入。系统减少动态时，巡视阶段直达端点，铺间和离庙使用短过渡。

第五铺巡视后从主殿经右侧通道绕过戏台，穿过中央大门。门外回望接入「五铺壁画」「队伍怎样走到供桌前」「走近第二铺壁画」三屏解读。模块 B 仍保留图鉴探索与体感交互。服务暂不可达时留在专题并可重试。进入 B 前只在当前展厅的浏览历史项记下交接状态，浏览器返回或重载恢复到专题，不重播导览。[文案与文献依据](validation/interior-visual-v3-6/CONTENT-SOURCES.md)

旧编号 JS/CSS 仍被正式入口加载。旧 v32/v33/v34 独立 HTML 已退役。保留历史参数、捕获脚本与 `?legacy` 高保真入口作为研究记录。

固定低保真A01–A08由独立worktree和启动器运行，不参与正式开发。保护固定SHA、Tag、归档分支及两个.lofi目录。

V3.5原始验收产物默认local/latest；evidence-v3.5.cjs只提升必要静帧，不自动提交完整录像。保留原测试结果及视频元数据。历史媒体在清理Tag找回，精确重复文件还可用清单中的存活副本恢复；未知原图不删除。

[整合说明](validation/interior-visual-v3-5/INTEGRATION.md) · [历史方位对照](validation/interior-visual-v3-5/ROUTE-COMPARISON.md) · [清理报告](maintenance/repository-cleanup-v2/CLEANUP_REPORT.md)
