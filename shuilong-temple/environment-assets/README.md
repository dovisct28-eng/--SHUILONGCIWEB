# 水墨环境素材

2026-09-28 使用内置 `image_gen` 工具生成，随后仅用 Sharp 等比例缩小、编码为保留 alpha 的 WebP。不是现场树木、地貌或历史景观的记录，不属于壁画或建筑复原依据。三个文件均由本地项目提供；运行时不调用生成服务。

| 文件 | 分辨率 | 字节 | 用途 |
| --- | --- | ---: | --- |
| watercolor-tree.webp | 768×886 | 330776 | 共享贴图的六棵底部锚定树木 |
| distant-landscape.webp | 1536×614 | 181030 | 位于建筑画布后方的远景 |
| ivory-mist.webp | 1024×345 | 61818 | 建筑外围地面云气 |

原生成 PNG 保留于 `C:/Users/dovis/.codex/generated_images/01a0e7a0-4edc-7863-b2a8-414b84a1bddc/`，网页只引用本目录成品。生成对应文件依次为 `exec-b9174151-ea1e-4f83-8c04-0d6198c0ca71.png`、`exec-1eb63ec3-c0db-4a4f-b878-d485525a6e01.png`、`exec-36b4246b-f9d7-4b58-869e-2f228c3d85ca.png`。

## 完整生成提示词

所有调用均设置 `transparent_background: true`，未使用 CLI / API fallback。

### Tree

Use case: stylized-concept. Create a production-ready transparent PNG game environment sprite: a single graceful mature broadleaf tree with delicate branching warm grey-brown trunk, irregular airy olive-sage foliage in layered fine watercolor dabs, a few small grey limestone rocks and very subtle pale moss at its foot. Three-quarter slightly elevated view suitable for placing around a Chinese courtyard architectural diorama. Chinese ink and light mineral watercolor illustration, refined naturalistic botanical silhouette, desaturated grey olive green and warm tan, soft diffuse warm daylight. All trunk, foliage and base must be inside frame with generous clear transparent margins. The tree must have visibly delicate foliage with gaps, not polygon clumps, not a pine or bonsai. Transparent background with real alpha, no paper rectangle, no background mountains, no buildings, no people, no text, no shadow rectangle. Foliage should remain fairly crisp but painterly; edges taper into transparent washes. This is freely designed atmosphere, not documentation of a real historic tree. Portrait or square composition.

### Mountains

Use case: stylized-concept. Asset type: wide transparent watercolor distant landscape backdrop for a realtime architectural diorama. A very pale horizontal wash of Chinese ink and mineral watercolor hills, atmospheric warm grey limestone crags, scattered tiny grey olive woodland silhouettes, flowing thin cream mist. Gentle asymmetrical low rolling landscape with a few delicate rocky peaks, predominantly blank transparent space in upper half, entire bottom edge dissolves softly and irregularly into genuine alpha transparency. Elegant archival architectural illustration atmosphere, extremely low contrast, warm ivory and taupe and grey-sage; no saturated colors, no black ink masses. Wide panoramic composition, no ground horizon hard line, every edge melts away before reaching image border. No buildings, no people, no lettering, no calligraphy, no sun, no frame, no opaque paper background, no water surface. Freely designed landscape atmosphere only, not a depiction of a real geographic site.

### Mist

Use case: stylized-concept. Production transparent PNG environment asset for a Chinese architectural watercolor diorama: one low wide flowing wisp of ivory and warm grey mist, elegant subtle hand-painted curling cloud contours, wispy layered diluted washes. Very soft pale parchment beige pigment, a few fine faint ochre contour lines suggesting Chinese painting cloud rhythm, delicate not graphic, not cartoon. Wide horizontal isolated composition occupying central lower band, generous fully transparent margins on all sides. All edges naturally dissolve into real alpha transparency, no rectangular backdrop, no paper surface, no hard outline, no sky, no mountains, no tree, no architecture, no figures, no writing. Low visual contrast, intended to blend into warm ivory page around the base of an architectural model without covering the building.
