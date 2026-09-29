# 模块 A 低保真最终归档

## 固定基线

- Commit：`48f272497e86e4549c5bcd0dee275ff347171a3f`
- Annotated Tag：`module-a-lofi-final-v1.0`
- Archive Branch：`archive/module-a-lofi`

Tag 和归档分支是模块 A 低保真最终状态的历史基线，不用于后续高保真开发。高保真开发继续在 `master` 进行。

## 使用方式

| 用途 | 启动器 | 端口 | 入口 |
|---|---|---:|---|
| 当前开发工作区 | `启动模块A原型.bat` | 4173 | 保留当前启动器行为 |
| 冻结低保真 | `启动低保真归档.bat` | 4174 | `http://127.0.0.1:4174/module-a/a01/` |

低保真启动器需要 Git、Node.js 和 Windows PowerShell。双击后会检查固定 Tag、创建或复用 `.lofi-preview` Worktree、校验 Commit 与文件状态、启动 4174 服务并打开浏览器。第一次创建 Worktree 后，日常启动不需要联网。

关闭标题为“水龙祠模块A低保真服务器”的命令窗口即可停止服务。重复双击启动器时，如果已确认 4174 运行的是该归档服务，只会重新打开页面。

## 本地目录与磁盘占用

`.lofi-preview/` 是不纳入版本管理的 detached Worktree。它共享主仓库的 Git 对象库，但会检出一套独立工作文件，因此大型模型和图片仍会额外占用磁盘空间。

`.lofi-runtime/` 保留给本地运行状态，两者都已加入 `.gitignore`。

## 安全规则

- 启动器不会切换主工作区分支，也不会执行 reset、clean 或自动删除目录。
- `.lofi-preview` 指向错误 Commit、属于其他仓库或存在文件变化时，启动器会停止并报告。
- 4174 被未知程序占用时，启动器不会终止该进程。
- Tag 必须最终解析到固定基线 SHA；Tag 与 Worktree 同时偏移也不能通过检查。

## 常见问题

- **未找到 Git、Node.js 或 PowerShell**：安装缺少的运行环境并加入 PATH。
- **未找到归档 Tag**：先获取仓库的远程引用；启动器本身不会自动联网。
- **`.lofi-preview` 不是 Worktree 或属于其他仓库**：人工检查目录，不要直接删除其中可能存在的文件。
- **Worktree 存在文件变化**：使用 `git -C .lofi-preview status` 检查；启动器不会自动恢复。
- **4174 被未知程序占用**：停止对应程序，或人工确认占用来源后再启动。
- **15 秒内未就绪**：查看独立服务器窗口中的 Node.js 错误。

## 已验证环境与结果

2026-09-29 在以下环境完成验收：

- Git `2.55.0.windows.3`
- Node.js `v24.14.1`
- PowerShell `7.6.5`；BAT 实际调用并通过 Windows PowerShell `5.1.26100.6584`

验收结果：

- 实际执行 `启动低保真归档.bat` 成功；首次创建、版本校验、重复启动复用均通过。
- `.lofi-preview` 最终保持 detached、洁净，并固定在基线 Commit。
- 主工作区启动前后保持 `master`，已有文件状态未被改变。
- 4173 开发服务和 4174 归档服务同时运行通过，各自只有一个监听进程。
- A01–A08 均在归档服务中实际到达；正向及 A08→A07→A06 逆向滚动通过。
- A04 项目自带浏览器验收通过，实际自动播放覆盖第五幅、第一幅、第二幅、回撤及三段路线总结。
- GLB、Three.js Canvas、三幅 WebP 壁画和 iframe 均正常；没有关键 404 或页面 Console Error。
- A08“进入探索”链接实际打开 `http://localhost:3000/index.html` 的模块 B；模块 B 需按其现有方式单独启动。
- 归档启动与浏览器集成测试通过。

基线全量单元测试共 48 项，其中 46 项通过；`environment.test.mjs` 与 `model.test.mjs` 的 2 项逐字源码同步检查在 Windows Worktree 中因 CRLF/LF 换行差异失败。运行时浏览器验收和对应功能测试均通过。本归档任务不修改冻结内容，故保留这一已知基线测试限制。
