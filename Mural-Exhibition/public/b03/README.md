# B03 本地视觉资源

- `karst-valley.webp`：从 `shuilong-temple/environment-assets/a01-v3/karst-valley.webp` 原样复用（102,818 B）。仅作设计性远山背景，不作为真实水龙祠周边地貌资料；模块 A 源文件保持。
- `narrative-serif.woff2`：与模块 A 同款 Noto Serif CJK SC Medium 的 B03 字符子集，正式人物名、现有档案标题和 UI 文案共 843 字符，347,652 B。母字体 SHA256 与模块 A 记录一致：`19322be2ecf5dd2abd546db7a86cc83c286026cbd28593583bfcfd721e48c9fe`；来源 [Noto CJK 官方仓库](https://github.com/notofonts/noto-cjk)，SIL OFL 1.1 授权见 `OFL-Serif.txt`。版本和子集散列见 `font-manifest.json`。通过 `../../subset-study-font.py <source.otf>` 重建；新增人物缺字时按宋体系统字体回退，不下载全量 CJK 字库。
- `thumbs/`：真实 org/line/color 的 112×80 上限缩略图，由 `../../make-study-previews.py` 生成，原素材保持不变。按稳定 ID 命名，扫描返回可选 `previews`；没有缩略图时保留文字导航。作者新增/替换正式图像后可重新生成，再刷新浏览器。缩略图不用于主画幅。

CSS 仅在 B03 可见时使用这些资源，B01 不请求远山/字体/缩略图。体感沿用原 Three.js/GSAP/MediaPipe 外部组件，不添加新外部运行服务。
