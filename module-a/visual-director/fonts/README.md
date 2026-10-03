# A02–A08 本地字体打样

接入前预算（2026-10-03）：两个静态 WOFF2 子集，总计不超过 160 KiB；首屏新增字体请求为零。A02 接近时才注册字体，`font-display:swap`；不预载完整 CJK 字库。此工程预算和字体选择属于本轮打样参数，不冻结品牌字体。

沿用项目已核对授权的 Noto Serif CJK SC Medium / Noto Sans CJK SC Regular，来源为 [Noto CJK 官方仓库](https://github.com/notofonts/noto-cjk)。SIL OFL 1.1 允许子集和嵌入，授权文件分别随包保存。原 OTF 临时保存在本机，不加入仓库；A01 字体与子集均不变。

`subset.py <serif.otf> <sans.otf>` 从 A02–A08 入口／控制器收集正文、状态、来源与错误文案的字符集合，标题使用显式清单（含自动路线的动态标题）；记录版本、字符集、文件大小与 SHA256 至 `manifest.json`。增加标题后必须同步清单并重新生成。生成器检查实际 cmap，单元检查包散列与源码中文集合，浏览器再检查实际标题覆盖与安全区。缺字检查失败须重新生成。

本轮实际文件：宋体 40,272 B，黑体 96,644 B，合计 136,916 B。冷加载全流程为 3 次请求／2 个唯一文件，共 233,560 encoded bytes：当前 no-store 本地服务下页面与模型 iframe 分别请求黑体，不把文件预算当成传输总预算。四尺寸首屏新增字体为零；主动阻断 WOFF2 后，1440／1024 两宽低高度视口的 A02、A03、三幅介绍、A08 安全区检查通过。证据见 [导演深化验收](../../../docs/validation/module-a-visual-director-v2/README.md)。

标题 fallback：Narrative Serif → Songti SC → SimSun → serif。正文 fallback：Narrative Sans → Microsoft YaHei → PingFang SC → system-ui → sans-serif。
