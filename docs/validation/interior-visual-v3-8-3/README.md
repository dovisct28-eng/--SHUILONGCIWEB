# V3.8.3 建筑前景土质贴图

基准为 `2d8d6f31122acd5cad43b6077966912db0ae681c`，正式入口为 `/module-a/gallery/`。内置 imagegen 生成了一张俯视暖灰褐压实土 Base Color。保留 1254×1254 原生分辨率，发布为约 565 KiB 的 [WebP](../../../module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/assets/exit-ground/compacted-earth-basecolor.webp)。

展厅实例对 `SlopingSoil` 用世界坐标投射，以约 8.8 个模型单位覆盖一块纹理，采用镜像重复、mipmap 和各向异性过滤。从同一贴图亮度派生窄幅粗糙度变化和轻微 bump，并压暗墙脚与近景。地形继续参与原有深度和阴影，门内权重为零，出门后沿用 V3.8.2 的平滑显现。贴图请求失败时使用单像素暖褐回退。现有坡体轮廓和边缘过渡仍可辨，表面起伏由材质表现。

Chrome 检查了 1920×1080、1440×900、1366×768 的第一幕和实际离庙回望。抽帧中未见明显平铺接缝、纹理拉伸或新增闪烁，末帧相机姿态与基线一致。远山、立面与标题抽样区域像素一致，五铺索引等高且无需滚动。减少动态下通过贴图请求失败回退检查。6 项离庙路线测试和正式入口构建检查通过。

- [1920×1080 第一幕](selected/act-1-1920x1080.png)
- [回望时建筑刚进入画面](selected/turn-back-to-temple.jpg)

## 生图提示词

```text
Use case: photorealistic-natural
Asset type: square 2048×2048 tileable PBR Base Color texture for the SlopingSoil mesh in a subdued cultural heritage gallery.
Generate one edge-to-edge texture scan of dry, old compacted earth in warm gray-brown and dark taupe, with slight dusty yellow-brown variation. True orthographic overhead view, zoomed to a roughly 5-meter-square patch. Use small irregular compressed soil grains, subtle lightly worn packed-earth marks and a sparse scattering of tiny grit and pebbles. Keep surface detail visibly legible at a grazing angle, with low to moderate local contrast and a subdued neutral palette. Homogeneous across the tile with small and medium variation, no prominent repeating motifs, and matching opposite edges for seamless repeat. Flat diffuse illumination suitable for albedo, no directional light, specular highlights, baked shadows, vignette, or light gradient. Fill the entire image, no border, perspective, horizon, scene, text, grass, green vegetation, cobbles, big rocks, hard cracks, concrete, mud puddles, footprints, or diagonal paths.
```
