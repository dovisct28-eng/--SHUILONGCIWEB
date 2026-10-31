# 清理V2真实验收（2026-10-31）

结论：未发现本次清理引入的功能回归；不宣称历史测试全绿、现场方位已确认或体感硬件通过。可复核数据见 [regression-results.json](regression-results.json)。原始日志、截图及录像仅留local，未提交。

| 范围 | 结果 |
|---|---|
| 正式A01/A02/A03 | 1920×1080、1440×900、1366×768，正常/减少动态，共6组通过；真实模型canvas、章节状态、主动gallery入口、无A05默认实例 |
| 五铺model/report | 两套各6组，共12组；真实大门进入、①至⑤正向、⑤至①反向、墙面显影、全幅contain、自然尺寸、缩放/滚轮/拖动/键盘/复位/缩略图、③④裁切全部通过 |
| 资源/边界 | 两套矩阵无pageerror/console error/HTTP失败；Combined B与5幅真实图Git基线检查通过；动态模块及iframe实际加载 |
| 方案切换/状态 | 三视口页头、A/B切换重置、刷新、独立第五铺返回标记及跨方案隔离通过；两套轨道保留 |
| 安全回退 | 真实AI资源请求失败时返回原模型，③真实图及细读可用；延迟图期间busy锁定/拒绝重复导航通过；B报告方案原模型回退未删除 |
| A→B交接 | 两套都从真实A03进入，完整走完五铺、主动进入真实localhost:3000；不可达时停第五铺；浏览器返回与文档重载恢复均通过 |
| 模块B | 清理前8热点/人物原图与详情通过；清理后8热点同样通过，三桌面视口拖动/缩放/复位、原图/线稿/色稿、人物切换/详情通过，无pageerror |
| B已有130项 | 清理前130/130；清理后最终串行解除本地启动器沙箱限制为130/130。中间普通沙箱出现超时/EPERM，保留原日志，不修改测试断言 |
| 体感真实依赖 | 实际外部CDN下载失败，最终提示“gsap 体感组件加载失败，请检查资源网络后重试。”；Hands/gsap为undefined，回到选择页。清理前后状态/依赖URL和未修改B代码证明并非新增本地资源丢失；实体摄像头未测 |
| 低保真 | 固定SHA/Tag/分支不变；原启动器实际运行成功；原Validate-LofiBrowser覆盖A01–A08、反向、模型、壁画及B入口；1440、1920、1366三桌面视口均通过，与正式版并行独立，当前分支未切换 |
| 低保真减少动态 | 未另做独立完整矩阵；正式版减少动态矩阵已覆盖。不把未测低保真状态计为通过 |
| 构建/语法 | V3.5全部CJS/MJS语法、gallery逐字同步母版、本地入口资源、固定归档通过；未重建模型 |
| 清理保护测试 | 4/4通过，覆盖重复副本、运行资源边界、正式入口/归档及默认输出忽略 |

## 历史断言的既有失败

扩大检查A及模型共203项，197通过、6失败。使用清理前Tag的原始文件只读重放相关4个测试文件，13项中7通过、6失败，失败名称完全相同：

- A01 and A02 contain the approved copy, without the superseded explanations
- chapter fonts are licensed, within the recorded budget, and cover Chinese states and errors
- local font subsets cover A01 copy, match manifest and remain within budget
- local serif subset covers every rendered heading and body subset covers all new copy
- poster retains one accessible heading, approved copy and real WebGL layering
- three guides match the final copy verbatim, with coherent natural paragraphs

这些断言包含旧三铺文案和字体子集覆盖，未修改以掩盖失败，也未扩展本次维护去改正式文案/字体。清理前快照重放用于unit基线比较，不替代真实浏览器、外部依赖或摄像头验收。

## 证据与限制

精选10张实际浏览器图，覆盖A03、A/B③④墙位、第二铺暗图/标题、第五铺全幅、选择器总览、第三铺细读。部分状态使用正式页面?debug取得断言接口，截图可见诊断入口；正式默认隐藏开发控件已经两套无debug交接另行验证。未生成合成验收图。浏览器截图展板和细读原尺寸已目视检查。

保留原V3.5两套完整录像的测试结论与video-check元数据，已删除旧媒体本体；本轮新录像仅在local/latest。并行运行的时延数据不作为性能基准。未做新用户审图、现场测绘或实体手势验收。
