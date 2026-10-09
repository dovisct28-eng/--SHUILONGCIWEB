# B03 V4.3 真实摄像头验收

当前状态：`PHYSICAL_CAMERA_PENDING`。自动化关键点、空白模型帧和 Chrome 浏览器结果均不能填写真人 PASS。

仓库根目录运行 `node docs/validation/b03-gesture-v4.3/start-physical-acceptance.cjs`。工具检查当前 V4.3 服务；默认 localhost:3000，旧服务占用时手动重启该服务或使用 `--port=3002`，不会终止未知进程。仅准备记录用 `--no-open`。

保持自然半身站姿，伸出一只手，在中央附近确认后依次：移动到左侧“查看人物” → 驻留 1 秒 OPEN → 离开所有按钮 → 再驻留左侧 CLOSE → 离开所有按钮 → 移动到右侧 NEXT。离开只是解除再次操作的锁，不自动关闭简介。每轮如实记录，不因失败重测删除原结果。

至少 10 轮；建议工程目标 9/10 完整成功，零错误接管、零非预期动作。它不是已达到的成功率。记录设备/浏览器/摄像头、站距、光线和操作者使用哪只手；左右手分别复验。

| 轮次 | OPEN | CLOSE | NEXT | 移动途中失锁 | 错误接管/误动作 | 结果 |
|---|---|---|---|---|---|---|
| 1 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 2 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 3 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 4 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 5 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 6 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 7 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 8 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 9 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |
| 10 | PENDING | PENDING | PENDING | PENDING | PENDING | PENDING |

另查：另一只手静止/移动不得抢占；两手交叉应暂停；短时遮挡同手恢复但驻留从零开始；持续丢失正确释放；第二个人远近进入、人体遮挡、快速移动、长时间阅读、退出/重入。不要将身份不可靠的暂停算成可用控制，也不要将实际误触发解释成正常。

失败时用 `?gestureDebug=1` 中原有导出按钮保存 `b03-v4.3-diagnostics.json`，保留失败前后的文件；新导出有最多 160 个事件和 240 帧（100ms 采样、坐标 0.01 精度）的派生数据。无录像、截图或完整关键点序列，普通模式不记录此追踪缓存。较长测试及时导出，环形缓存会淘汰旧项。CPU/模型/网络造成的 >650ms 真实失联仍释放，不能靠此修复保证现场性能。
