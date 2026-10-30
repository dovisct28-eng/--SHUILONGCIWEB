# V3.1 壁画阅读展墙背景

2026-10-30。基于 fetch 后一致的 `8643a4daeb55cca217ab0be5222822c3716bf14c`，仅独立 V3 阅读背景候选；不接入正式 v24 或 master。

## 图层与视觉

`index.html` 新增 aria-hidden 的 `.reading-ambience`，位于建筑 iframe 上方、main 内容下方；两者独立 z-index，背景及其子层 pointer-events:none。`#reading/#detail` 改透明，文字字号、位置、图像 contain 与工具布局保持。

- 基底：#101618 → #1b2325 → #20282a → #141b1e，低对比斜向明暗，不画清晰建筑轮廓。
- 暖光：两片大范围静态椭圆光域，#c7b79c 的约7.8%源 alpha 与低强度辅助亮度，边缘完全消散。
- 肌理：256×256 SVG fractalNoise，3 octaves、固定 seed=17、stitchTiles，去饱和；全幅 opacity .045，细读 .018。没有裂纹、污渍或剥落图样。
- 阴影：宽而软的非对称暗部、边缘与下方收暗；全幅 opacity .72，细读 .288。无窗框、柱子、屋檐实体图形或光束。

细读暖光 .4、纹理 .018、阴影 .288，均为全幅对应装饰强度的40%；基础展墙统一。背景固定，不随缩放和平移移动；所有像素、色彩与图像内容保持原有呈现。

纹理以 data:image/svg+xml 内嵌 CSS，避免当前本地 server 把 .svg 作为 octet-stream 导致图片解码失败；assets/wall-grain.svg 保留可编辑源。运行时不请求外部资源，不需要改 server。

## 过渡

- body[data-view=C/D] 控制共享背景；进入/退出外层 opacity 650ms，和原 syncReading 的650ms图像变换相配合。原 syncReading 函数未修改。
- iframe 保留在背景后方直到650ms淡入结束，然后 visibility:hidden；返回时立即 visible，保证渐隐背景后有真实建筑。
- 首铺反向展开前仅设置 data-reading-exit，允许原动画执行期间同步淡出；paintView 清理临时标记。二至五铺使用同一背景过渡，不增加专属图像展开。
- C↔D 只以350ms改变装饰层强度，基底不重切。系统 prefers-reduced-motion 和既有复选框均关闭背景过渡；只有原有状态事件设置 data-reduced-motion，没有新增时钟或RAF循环。

## 性能与边界

新增 reading-ambience.css 约2.7 KiB（含367字节SVG源的URI编码），静态源367字节只供维护；四个装饰DOM，无新renderer、Canvas、实时灯光、滤镜模糊、粒子或框架。背景是静态纹理与渐变，有限opacity过渡结束后不继续动画。专项实测阅读态闲置1.2秒建筑renderCount增量0；这不能代替跨GPU性能验证。

技术标注清理保持，m.note不重新进入观众界面；壁画数据、原图、模型、AI建筑融合、相机轨道、细读数学与B交接函数均保持。所有颜色、纹理与强度为待用户视觉验收的候选。

验证、截图与命令见 [验收记录](../../../../docs/validation/interior-visual-v3-1/README.md)。
