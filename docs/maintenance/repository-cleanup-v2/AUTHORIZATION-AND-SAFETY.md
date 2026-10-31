# 本次删除授权与完整预检

用户粘贴任务书明确要求“请独立完成项目盘点、依赖分析、清理、测试、文档更新、Git提交和远程同步”，“请直接执行，不要只给我清理建议”。

第八节明确授权：“对于确认可再生成的缓存，可以删除”；“对于文件哈希完全相同的重复副本，确认保留副本后可以清理”。第五节授权删除已跟踪且可由恢复Tag找回的历史验收媒体，当前V3.5录像可仅保留结果、元数据与摘要。第十节要求先清单、后恢复点、再删除。

## 具体范围

恢复点 pre-repository-cleanup-v2-2026-10-31 已通过 git ls-remote 确认：annotated tag object 5869de334aacdbadae36410ed09c21eb483a81ae，peeled commit e2d3bba96a95685907d92c0a633976d9bf2843fb。

{
  "tracked-validation": {
    "count": 2538,
    "bytes": 1574817955
  },
  "retired-prototype": {
    "count": 3,
    "bytes": 18882
  },
  "rebuildable-cache": {
    "count": 2,
    "bytes": 155476610
  },
  "verified-identical-validation-copy": {
    "count": 1545,
    "bytes": 1931987976
  },
  "regenerable-v35-raw-capture": {
    "count": 72,
    "bytes": 308147449
  }
}

## 处理上一轮审批指出的问题

审批前发现两份重复文件的保留副本也被列入可再生成原始媒体清单。两份副本已经改为KEEP，删除数由4162降为4160；没有执行过该失败计划。

[recoverability-preflight.json](recoverability-preflight.json)为只读完整预检：每个已跟踪文件的当前字节计算Git blob SHA-1，必须与Tag树中的对象完全一致；每个非Git重复文件均核对存活副本SHA-256、大小，且该副本不得处于删除清单；仅72个当前V3.5忽略目录内测试原始媒体和2个特定Webpack pack按再生成依据清理。

不删除未知原图、人物资源、文献、设计源文件、现有用户跟踪修改。所有其他不具恢复证据的未跟踪或忽略文件保留。Tag不宣称恢复未跟踪文件，生成输出也不宣称能重现逐像素截图。

执行器只接受该清单，核对路径必须位于项目目录，禁止.git/.lofi-preview/.lofi-runtime；删除前重验哈希和存活副本。无recursive delete、git clean、reset、stash、GC或历史改写。
