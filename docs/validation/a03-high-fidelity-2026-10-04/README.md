# A03 高保真验收 · 2026-10-04

实际开发/对照基线：`b6ce49f90383534bb85c30d1251d8d2dab6cec7f`，重新 fetch 后核实本地与远程 master一致。最终 commit与push核实见本次交付回复及Git元数据。本轮候选完成技术验收，等待用户审图，未冻结视觉参数。

实现、资料边界、相机与共享文件范围见 [A03_HIGH_FIDELITY](../../A03_HIGH_FIDELITY.md)。画面中场地/空气属于设计表达；没有改建筑几何或壁画位置，也没有新增历史解释。

## 关键截图

| 状态 | 1920×1080 | 1440×900 |
| --- | --- | --- |
| A02核心稳定 / 9.65屏 | [01](screenshots/1920-01-a02-stable.png) | [01](screenshots/1440-01-a02-stable.png) |
| A02→A03 / 10.4屏 | [02](screenshots/1920-02-a02-a03-transition.png) | [02](screenshots/1440-02-a02-a03-transition.png) |
| A03进入 / 10.85屏 | [03](screenshots/1920-03-a03-enter.png) | [03](screenshots/1440-03-a03-enter.png) |
| A03稳定阅读 / 11.7屏 | [04](screenshots/1920-04-a03-reading.png) | [04](screenshots/1440-04-a03-reading.png) |
| 阅读细节 / 原浏览器截图裁切 | [Detail](screenshots/1920-reading-detail.png) | [Detail](screenshots/1440-reading-detail.png) |
| 从第五幅出发 / 12.92屏 | [05](screenshots/1920-05-a03-handoff.png) | [05](screenshots/1440-05-a03-handoff.png) |
| 现有A04入口 / 13.21屏 | [06](screenshots/1920-06-a04-entry.png) | [06](screenshots/1440-06-a04-entry.png) |
| Reduced Motion | [1920](screenshots/1920-reduced.png) | [1440](screenshots/1440-reduced.png) |

截图均来自 localhost 实际 Chrome，未生成替代效果图；Detail由浏览器直接截取阅读区域，无重绘。两张旧版阅读截图保存在 `baseline/a03-1920x1080.png` 与 `baseline/a03-1440x900.png`，用于视觉关系对照；其他基线/旧回归PNG留在本地。远程保留本表完整关键帧，不只提交最好的一张。

人工审图检查了两尺寸阅读态与细节、环境退出、第五幅交接及 A04入口：主标题在文字层级中最强，建筑扩大并接近正文，标签与文案不相压，暗场不以可辨圆形光晕抢主。完整建筑投影占宽1920为58.4%、1440为62.0%；后者略超建议上沿但不构成冻结规则违反。缩略图层级是设计判断，不等于用户审美认可或理解效果已被证明。

## 测试与构建

- [tests.txt](tests.txt)：86项单元测试通过，包含本轮新增6项 A03状态、稳定阅读、连续/逆向、真投影锚点、对比候选及壁画材料保护测试。
- [build-results.json](build-results.json)：14份源码语法、内联 HTML模块解析、模型/Module B/其他章资源保护及归档引用通过。无独立打包器；没有运行 build-model。
- [results.json](results.json)：1920×1080、1440×900专项运行结果；正向、停滚、整个阅读区间静止、慢速wheel、快速wheel、跳滚、倒滚、刷新恢复与 reduced motion通过，必需资源失败、pageerror及相关console error为空。
- [legacy-browser/results.json](legacy-browser/results.json)：原A03浏览器检查的五种尺寸、标题两行、无overflow、核心三幅、倒滚像素、wheel、刷新、resize与reduced motion通过。
- 专项按13.195 / 13.199 / 13.2 / 13.201 / 13.205屏采样，邻帧canvas宽变化小于4px、建筑左缘变化小于4px，覆盖13.202屏A04接管阈值，不依赖先前播放。
- Git基线拦截对照：两尺寸各采样0.6、2.5、4、5.7、6.7、7.55、8.7、9.65、10.2、13.21屏。A01动画与Hero像素一致；A02及A04入口按既有容差（最大通道差≤4，或变化像素比例<0.05%）通过，完整差异数据在results的regression字段。少量抗锯齿差异不报告为像素完全一致。

旧测试更新原因：原“copy边界不得进入iframe矩形”把渲染容器当作建筑轮廓，强制右侧小画布，与本轮允许建筑进入标题负空间的目标冲突。已改为检查标题/正文完整、无overflow、真实屏幕标签不覆盖阅读区；标签坐标从iframe局部坐标转换为页面坐标后判断。真正的文字可读性、核心标记、相机不重播、生长状态及逆向检查保留。

可复现命令（服务已启动于4173；Playwright/pngjs位于本机bundled NODE_PATH）：

```powershell
node module-a/a01/server.mjs
node module-a/a03/sync-preview.mjs
$tests = rg --files module-a shuilong-temple -g '*.test.mjs'
node --test $tests
node module-a/a03/build-check.cjs
node module-a/a03/remaster-check.cjs
$env:A03_VALIDATION_DIR = 'docs/validation/a03-high-fidelity-2026-10-04/legacy-browser'
node module-a/a03/browser-check.cjs
node module-a/a03/performance-check.cjs
```

## 性能与已知限制

[performance.json](performance.json)记录本机 GTX1660Ti、headless Chrome，两尺寸各before/after、90帧静止及90帧滚动；基线通过Git源码响应拦截。几何、纹理与canvas没有新增，后处理在A03关闭，未新增HDRI、景观资产、大图或动画时钟。真实画布从旧小容器扩大，渲染像素量随之增加；即使draw call数不变，也有fill-rate成本。

最终串行采样（先经过A02核心态，统一GPU资源驻留条件）：两尺寸均保持64份renderer几何、20纹理、52 draw calls、90,562三角形、1 canvas。首屏HTTP响应正文总量11,791,682→11,827,412B（+35,730B，主要为源码与离线模块）；无新大型素材。静止帧间隔均值约4.10–4.13ms；滚动P95为1920：13.0→18.9ms、1440：12.6→16.2ms，放大画布确有滚动/resize成本，没有把这组结果描述为性能零影响。

`post.targetBytes`是现有A01后处理器按照目标尺寸计算的容量估计，**不是实测GPU内存**。A03后处理关闭，主场景直接渲染；本轮没有新增target。记录该估计随canvas尺寸增加，不将其误报为GPU分配量为零或实测内存占用。帧间隔包含浏览器调度与同步resize，不等于GPU时间、显示帧率或跨设备性能保证。

全响应式、手机视觉、用户阅读理解测试未进行。文物图像与历史资料仍依照原内容地图的核验边界。本轮未开发A04高保真主体，未修改Module B。已有归档脚本修改、素材删除与无关未跟踪文件保留在工作区、不纳入提交。
