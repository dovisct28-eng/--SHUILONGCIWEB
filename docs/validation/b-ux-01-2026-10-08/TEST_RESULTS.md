# B-UX-01 测试与限制

软件与桌面布局验收 PASS；真实模型冷启动和实体摄像头 PENDING。不能把合成识别输入等同于硬件验收。

| 命令/检查 | 最终结果 | 范围 |
| --- | --- | --- |
| npm test | PASS，110/110 | 原有单元、语法和新增保护/引导断言 |
| npm run test:browser | PASS（导航）；真实模型启动 PENDING | 四视口、图像/API/CDN错误重试、设备错误、20重复点击、6会话、真实 A08 往返；未使用的 Hands 初始化仅在假摄像头导航部分模拟 |
| npm run test:b02-browser | PASS | 四视口、8组热点、30/50密集热点、管理、互斥图层、视频与图片/档案错误回退 |
| npm run test:b03-v42-browser | PASS | 生产 camera/onResults 路径，合成输入；锁定、错误清理/恢复、时序和10次模式往返 |
| npm run test:b03-dwell-browser | PASS | 生产驻留路径，合成输入；查看/返回/NEXT、失联暂停、阅读溢出、10循环 |
| npm run test:b03-hf-browser | PASS | 7 figure × 4视口 × 默认/阅读/恢复＝84状态；真实 WebGL/GSAP，模型与摄像头模拟；无意外错误遮罩 |
| npm run test:b-ux-browser | PASS | 每视口入口/全景/详情/体感默认/阅读/中断/切换；同ID、索引标记、低动态、键盘、缺内容、加载中返回 |
| 内容扫描与透明通道/哈希 | PASS | 远程8目录 + 授权6figure；仅文件/字段/alpha，不核验学术内容 |
| 实际摄像头/展场与真实模型稳定性 | PENDING | 真实 Hands 资源初始化超时仍保留；没有真人手势或展场验收 |
| 移动端 | NOT_TESTED | 本轮范围外 |

详细结果见 validation-summary.json。原始 logs/results/captures 保留在被 Git 忽略的 local/ 下；本报告汇总最终通过与限制，未清理初轮失败。

初轮失败包括：A08 所需端口未启动；B01旧25秒启动等待；假摄像头重复导航中的未使用模型下载；UX检查未等焦点过渡/稳定状态。对应测试边界或等待已纠正，未放宽生产阈值或改摄像头时序。真实模型超时仍是 PENDING，并将代表错误帧纳入精选。
