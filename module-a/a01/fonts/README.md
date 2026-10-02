# A01 本地字体打样

本轮只作用于 A01 `.intro-mark`、`.copy` 与 `.scroll-hint`，不改变后续章节字体。候选为 Noto Serif CJK SC Medium（500）与 Noto Sans CJK SC Regular（400）。字体选择、色值和字号仍为打样实现，不升级为全项目冻结规则。

接入前预算：2 个 WOFF2 子集请求，合计不超过 64 KiB；不预载完整 CJK 字库，`font-display:swap`。首屏以系统字体即时显示；宋体 fallback 为 Songti SC → SimSun → serif，黑体为 Microsoft YaHei → PingFang SC → system-ui → sans-serif。

公开来源：[Noto CJK 官方仓库](https://github.com/notofonts/noto-cjk)。Serif 与 Sans 的 SIL OFL 1.1 授权分别随文件附带，允许嵌入与子集化。公开原字体下载到本地后以 FontTools 子集化，项目文案未发送第三方接口。子集字符与文件版本、SHA256、实际大小见 `manifest.json`；`subset-fonts.py` 为本地生成与缺字验证脚本。文案改变后须更新子集，不把缺字 fallback 当成子集覆盖通过。

复现：安装 FontTools/Brotli，下载上述仓库的 `Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Medium.otf` 与 `Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf`，运行 `subset-fonts.py <serif.otf> <sans.otf>`。母字体保留临时目录，不加入仓库。
