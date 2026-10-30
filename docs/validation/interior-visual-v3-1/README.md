# V3.1 阅读展墙背景验收

2026-10-30；基线：fetch 核实的 feature/shuilongci-hybrid-gallery-v1 / `8643a4daeb55cca217ab0be5222822c3716bf14c`。只更新独立 V3，未替换正式展厅。

## 改动与边界

一套共享静态展墙，由深灰渐变、极弱SVG肌理、顶部暖光和宽柔阴影构成。全幅保留低强度空间明暗；细读装饰降至40%。背景在 main 下方，事件穿透，不覆盖真实图片，不改变文字字号和控件位置。

进入/退出背景650ms，C↔D装饰350ms，系统/复选框减少动态均直接稳定显示。原 syncReading 650ms图像动画、细读坐标与边界计算、相机轨道、建筑融合、壁画数据和B交接源码经过保护检查，保持不变。技术标注没有恢复。

实现、资源及性能说明：[READING_SPACE_V3_1.md](../../../module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/READING_SPACE_V3_1.md)。本地服务不支持外部SVG的正确图片MIME，已改为CSS内嵌SVG；无需更改服务器。

## 验证

- 61项相关Node测试通过，含新增4项冻结实现保护；主脚本与两份浏览器脚本语法检查通过，git diff --check通过。原生ES模块无额外打包步骤。
- 沿用既有标注清理/五铺交互浏览器回归并增加背景断言：1920×1080、1440×900、1366×768，各正常与减少动态，共6组/30次逐铺检查通过；pageerror均为空。全幅→细读、键盘、滚轮、拖动、复位、三处观察点、回全幅、回墙、前往下一铺、逆向返回通过。
- 第一铺1440×900的标题、图像、底部操作矩形与修改前layout-baseline.json完全一致；五铺 contain、自然尺寸、无图像滤镜及控件边界通过。内部note注入检查继续通过。
- transitions.json记录正常模式实际进入/返回的 191/193 个RAF采样：透明度有连续中间态，原图650ms变换仍在；背景未完全显现时真实建筑仍可见，逆向时建筑先恢复；无新增纯黑/白色转场层。
- 细读装饰强度、纹理不随平移、复选框减少动态、256×256内嵌纹理解码通过。稳定态背景动画数0，阅读闲置1.2秒建筑renderCount增量 0。未新增运行时RAF循环、renderer、实时灯光或高成本动态模糊；不据此推断跨GPU性能。
- 原有B交接检查复跑（输出隔离在local）：实际进入B、保留双入口、浏览器后退恢复第五铺通过；B核心未改。

## 人工实图检查

实机图中壁画仍为第一视觉主体，外围可见低对比墙体明暗；第四铺竖幅左右空间由同一展墙承接，第三铺原现场照片边界完整。未见清晰射灯、柱影、重复纹样或纹理接缝；细读背景更弱。结果是视觉候选，不替代用户审图，也不新增文化资料或配准结论。

## 精选截图

6张，共 0.99 MiB；全部浏览器渲染。重复回归PNG留local并由既有gitignore排除，历史证据不改。

|内容|截图|
|---|---|
|第一铺全幅修改前|[before](selected/first-full-before.webp)|
|第一铺全幅修改后|[after](selected/full-1-1440-true.webp)|
|第一铺细读修改后|[detail](selected/first-detail-after.webp)|
|第三铺全幅修改后|[third](selected/full-3-1440-true.webp)|
|第四铺竖幅修改后|[fourth](selected/full-4-1440-true.webp)|
|第五铺全幅修改后|[fifth](selected/full-5-1440-true.webp)|

## 复现

启动localhost:4186（见原型README），NODE_PATH指向环境提供的Playwright/sharp，执行：

```powershell
node --test module-a/immersive-hybrid-v1/tests/*.test.mjs module-a/immersive-hybrid-v1/design-studies/interior-visual-v2/study.test.mjs module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/study.test.mjs module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/ambience.test.mjs module-a/navigation/*.test.mjs
node --check module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/study.mjs
node module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/ambience-browser-check.cjs
node module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/ambience-transition-check.cjs
```

所有本轮验收项通过；最终视觉强度等待用户确认。本轮停止扩展，不集成正式展厅。
