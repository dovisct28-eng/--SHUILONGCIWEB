# 清理前基线

- 分支：feature/shuilongci-hybrid-gallery-v1
- 本地与 fetch 后远程：25d87f7326ef7714b71936ab84afc61ce153a864
- 建筑：Combined B / V2.4-B1。Tag：temple-combined-b-b1-2026-10-28，已远程核实 peeled commit 相同。
- 低保真归档：48f272497e86e4549c5bcd0dee275ff347171a3f，Tag/分支保持。
- 物理目录：15522 文件 / 22096871918 bytes（含 .git、依赖与归档检出，不跟随符号链接）。
- 工作内容口径：14347 文件 / 11492330090 bytes（排除 .git 与 .lofi-preview）。
- 已跟踪现存：3831 文件 / 1757625174 bytes。
- 原有改动：18；未跟踪：3539；暂存区为空。完整状态/原始字节哈希留 local/，逐项原有已跟踪修改及 B1 保护清单见 preserved-files.json。
- 原始资源哈希见 preserved-files.json 和 local/snapshot-before.json；本轮不恢复用户已删除的素材、不修改其余脏文件。

远程直连 TLS 失败后，单命令使用本机已存在的 http://127.0.0.1:7897 代理成功 fetch/push/ls-remote；未修改全局网络配置。
