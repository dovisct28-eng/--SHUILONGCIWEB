# A01 暗灰水墨空间验收

2026-10-02—03；基线 `9191fed7cd5d2c7dbe50c859231ead46f37cebd1`。实施前视觉拆解与五 Pass 说明见 [A01_INK_SPATIAL.md](../../A01_INK_SPATIAL.md)。本轮只改变观看、材质、光影和设计环境，不提升历史复原可信度。

- [Before / After](before-after.jpg)：实际 1440×900 Hero。
- [首帧补验](entry-before-after.jpg)：左为五 Pass 完成时的空场，右为最终实际模型轮廓。最终从零滚动即有近景线稿；主体按既有进度后撤和成形。
- 五轮对照：[Camera](camera-comparison.jpg)、[Lighting](lighting-comparison.jpg)、[Material](material-comparison.jpg)、[Environment](environment-comparison.jpg)、[Composite](composite-comparison.jpg)。每轮先保存 8 张原尺寸 PNG 并查看，再进入下一轮；比较图为缩小的联系表。
- [四尺寸 Hero](final/contact/heroes.jpg)、[全部状态](final/contact/all-states.jpg)、[生长与交接](final/contact/growth-and-handoff.jpg)。完整原始 PNG 留本地，Git 提交精选图、联系表及报告。
- [新浏览器验证](final/results.json)：44 个 A01 帧、12 个共享章节帧；实际模型顶点投影、阅读/停滚、倒滚、交接、跳章，四种 reduced/艺术模块/墨景模块/墨景图片失败模式。
- [线层回归](line-regression/results.json)：36 帧、像素倒滚、刷新中段、快速跳转、resize、六种 reduced/资源失败模式；A01 隐藏 mural groups、A02 恢复。
- [合成文字对比](contrast.json)：实际背景采样，四个 Hero 最低 7.97 / 6.93 / 6.63 / 6.73 : 1；普通文字至少 4.5，大标题至少 3。调色变量在交接中也满足 4.5；淡出透明帧不等同完整阅读态。
- [字体换字](font-layout.json)：四尺寸真实延迟 WOFF2；小名称最初 auto 宽度变化，固定容器后通过。标题、正文和提示外框稳定。
- [环境](environment-regression/environment-results.json)、[共享模型](shared-regression/model-structure/results.json)、[A04](a04-regression/results.json)、[壁画贴图](a04-regression/mural-textures/results.json)。模型/贴图失败回退、直接预览、三幅实际停靠/回撤/路线、跳过/重播、A04→A05 四尺寸交接通过。
- [性能](performance.json)：同机顺序执行，每版本三个新 context；相同 HTTP route 拦截口径，六份基线代码来自 9191fed。浏览器/驱动缓存不等于完全清空。

| CSS 视口 | Hero 实际建筑宽 / 高 | 边界 |
| --- | --- | --- |
| 1920×1080 | 52.9% / 61.1% | 完整结构、图文分开，无溢出 |
| 1440×900 | 58.8% / 61.1% | 同上，逐 Pass 审查 |
| 1366×768 | 52.9% / 61.1% | 同上，低高度安全区 |
| 1024×768 | 55.1% / 46.8% | 优先完整结构和文字间隔，不强行放大到参考高度 |

近景线稿阶段允许有意裁切；稳定 Hero、成景、右移检查全轮廓与文案间隔。reduced-motion 取消新近景后撤，保留原进度和内容，不宣称全静态。

## 性能数据及成本

Chrome 154.0.8037.93 / Windows ANGLE D3D11 / NVIDIA GeForce GTX 1660 Ti，1440×900。首屏 HTTP 请求 36→38；GLB 仍单次加载，字体仍 2 请求。新 main ink 模块 3,707 B；art 模块 3,206→5,011 B，同时同步内嵌副本。没有新增图像文件或 WebGL 模型几何；父页面复用树/山图有额外请求和解码成本，不能宣称资源成本为零。性能脚本环境请求 3→4；普通四尺寸脚本记录 5 次环境资源事件，共 3 个独立 URL，二者缓存/拦截条件不同。

最终复验文字可见中位数 420→405ms，modelReady 1025→1018ms，图像/字体就绪 1105→1075ms。motion 窗口各 90 RAF，中位间隔 4.2→8.2—8.3ms，P95 4.4—4.6→8.4—12.4ms。新版本确有合成帧成本；小样本加载下降不能作为普遍优化结论。稳定 Hero draw calls 均 71 / triangles 均 83,898；完整线与叠合 draw calls 均 67 / 83。resize/反复 seek 后 renderer geometry/texture 计数稳定；该计数不包括全部 DOM 合成缓冲。

没有新增常驻 RAF、WebGL Canvas 或后处理。现有世界环境几何、本地位图文件和字体不变；SVG 山形与 CSS 图层是额外合成，不是免费效果。尚未覆盖低性能 GPU、长时间帧率与系统总内存。

## 像素与数值恢复

数值状态正反向严格相等。新增墨景合成存在约一个通道值的淡山舍入差：诊断中 1920 的差异占 0.602%，最大 2（仅 48 像素达到 2）；1366 另一诊断最大 3，只有一个像素达到 3，均值 1.007。首帧补验后的另一诊断为最大 5，只有一个像素大于 3；近线 travel 一次最大 33，但 2,293 个变化像素仅 30 个大于 3，均值 1.144。差异放大图已查看，位置为山雾及少量线边缘，没有模型位移。

像素检查增加两种联合阈值：低幅 max≤3 / 变化<1.5% / 均值<1.1；低幅背景和抗锯齿共存时 max≤64 / 变化<1.5% / 均值<1.2 / 大于 3 的像素<0.02%。保留旧稀疏边缘阈值，没有关闭比较。超限会保存诊断并失败。

最终 36 次反向截图比较全部通过：每个尺寸最大通道差 29 / 24 / 39 / 19；变化像素占比最大 0.603% / 0.690% / 0.993% / 0.758%，主要为一个通道值的小差异。各尺寸大于 3 的像素占比均低于 0.008%。不能称逐像素一致。停滚数值与稳定阅读状态一致。

## 实际执行

需要本地 Node + Playwright/PNGJS/Sharp，以及 Python 材质检查依赖。启动本项目 4173/4175 本地 server；设置 `A01_VALIDATION_DIR` / `MODEL_VALIDATION_DIR` 到本目录的对应子目录，避免覆盖历史验收。性能时没有并发运行其他浏览器检查。

```powershell
node shuilong-temple/build-model.mjs
node --test module-a/*/*.test.mjs module-a/*.test.mjs shuilong-temple/*.test.mjs
python shuilong-temple/architecture-style.test.py
node module-a/a01/ink-pass-check.cjs baseline
node module-a/a01/ink-pass-check.cjs camera baseline
node module-a/a01/ink-pass-check.cjs lighting camera
node module-a/a01/ink-pass-check.cjs material lighting
node module-a/a01/ink-pass-check.cjs environment material
node module-a/a01/ink-pass-check.cjs composite environment
node module-a/a01/visual-remaster-browser-check.cjs
node module-a/a01/ink-color-check.cjs
node module-a/a01/line-browser-check.cjs
node module-a/a01/font-browser-check.cjs
node shuilong-temple/environment-browser-check.cjs
node shuilong-temple/model-browser-check.cjs
node shuilong-temple/texture-browser-check.cjs
node module-a/a04/browser-check.cjs
node module-a/a04/transition-check.cjs
node module-a/a01/visual-remaster-performance-check.cjs
node module-a/a01/visual-remaster-contact.cjs
git diff --check
```

Node 59/59、Python 3/3，模型构建、模块及预览内联语法、相关浏览器检查全部通过。逐轮命令在各轮源代码状态下执行，不能在最终代码上重跑并声称重现旧版本。性能脚本路由可重现 9191fed 基线；不变的 GLB / model-source / 轮廓数据 / 进度源及固定归档引用另作核对。

本轮范围内无已知阻塞问题。与参考的绘画精度、真实山谷细节、模型瓦纹重复和线稿稀疏仍有差距，未通过虚构结构补齐；当前视觉判断是实现选择，不等于用户已最终批准审美参数。
