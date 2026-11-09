> 2026-10-31清理V2：本目录保留技术报告、视频元数据与10张当前精选；大批原始媒体已精简，新运行默认local/latest。清理后的真实回归见 [清理验收](../../maintenance/repository-cleanup-v2/VALIDATION.md)。历史完整媒体按deleted-files.json中的Tag或副本恢复。

> 2026-10-31清理注：被精简的历史媒体链接已改为清理前Tag或已核对的相同副本；下文原测试结果保持当时记录，不能作为最新运行结论。

# 水龙祠 V3.5 整合与验收

> 当前展厅固定走①→②→右侧③麒麟→左侧④盘龙→左侧⑤。旧双路线的方案与证据见 [历史方位对照](ROUTE-COMPARISON.md)。本页的验收数字和录屏均为历史记录。

状态：五铺观看、视觉统一及正式模块A接入完成，规定六组合桌面回归通过；**未标记全部整体完成**。模块B体感真实启动受外部GSAP/Hands加载失败影响，用户最终视觉验收尚未完成。已测试的观看核心未发现新增阻断回归。

本地打开 `启动水龙祠数字展厅.bat`，从 `http://127.0.0.1:4173/module-a/a01/` 滚动到 A03，再主动进入五铺展厅。

1. 五铺完整运行：六组分别完成从建筑进入、①②③④⑤全幅/细读、⑤④③②①逆向返回。
2. 第二铺疑点：正常流程纹理正确；旧seekRoute未退出第一铺阅读合成层，诊断截图错图，已最小修复。
3. 视觉改善：墙面标题缩小并左上配准、标题先于亮图、完成后降权；统一阅读层级、全图索引比例和等比可逆桥接。
4. AI回退：第五铺转向继续使用原模型；停靠使用原安全投影。未重新生图，未增加覆盖。资源失败检查也确认原模型回退可继续观看。
5. 正式模块A：默认A01–A03主动接入新五铺路线，旧A04–A08保留在?legacy；A03大字构图保持。
6. 模块B：真实本地跳转、连接拒绝提示、浏览器返回和重载恢复第五铺通过；图鉴流程通过，体感真实启动未通过。
7. 回归：56项（原53项加路线方案3项）A相关测试、130项B测试、六组合浏览器及资源/并发/内存循环通过；B体感外部依赖失败单独记录，不声称全功能通过。
8. 限制：首次准备仍有等待；相机与墙位是设计模型，③④非实测配准；用户视觉、多GPU、实体摄像头仍待验收。

文档：[诊断](AUDIT.md)、[视觉参数](VISUAL-CHANGES.md)、[正式整合](INTEGRATION.md)、[历史测试及限制](TEST-RESULTS.md)。V3.2–V3.4 独立页面已退役，历史参数、源码与证据可供查阅。

[方案A连续录屏（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/interior-visual-v3-5/selected/continuous-walk-1440x900.webm)、[方案B连续录屏（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/docs/validation/interior-visual-v3-5/selected/continuous-walk-report-1440x900.webm)：均为1440×900、VP8/25fps，无剪辑，完整解码结果及实际时长见video-check.json。精选包含12张必要对照截图和两条不同路线视频，清单与体积见selected/manifest.json；完整回归保留local。

阶段提交：60ae370诊断；46c9a6f合并视觉与阅读转场小调整；53ca442正式接入与性能/状态准备；最终验收提交见本目录Git记录。仅同步feature/shuilongci-hybrid-gallery-v1，不合并master。
