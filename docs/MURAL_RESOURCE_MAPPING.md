# 模块 A 壁画资源映射

`module-a/mural-resources.mjs` 是稳定 mural ID 与图片资源的唯一映射点。模型节点元数据仍由 `shuilong-temple/mural-locations.json` 管理，ID 和位置不得因图片资源调整。

| mural ID | 壁画 | 模块 A `display` | `detail` |
| --- | --- | --- | --- |
| `mural-01` | 第一幅 | `水龙祠壁画素材/网页展示图/mural-01-display.webp` | `null`，模块 B 预留 |
| `mural-02` | 第二幅 | `水龙祠壁画素材/网页展示图/mural-02-display.webp` | `null`，模块 B 预留 |
| `mural-03` | 第三幅 | `null`，维持模型占位材质 | `null`，模块 B 预留 |
| `mural-04` | 第四幅 | `null`，维持模型占位材质 | `null`，模块 B 预留 |
| `mural-05` | 第五幅 | `水龙祠壁画素材/网页展示图/mural-05-display.webp` | `null`，模块 B 预留 |

模块 A 使用 `display.webp` 表现整体壁画。`detail.webp` 留给模块 B，模块 A 不加载 detail 资源。后续 A05、A06、A07 应通过 `muralId` 从同一配置取得对应 display 图。

Three.js 页面在 A04 的目标壁画进入观看阶段时，通过 `TextureLoader` 按需请求对应 display 图，在现有 mural group 上添加运行时纹理平面。模型生成器仍只输出建筑与 mural 几何，图片不嵌入 GLB。纹理平面按图片宽高比完整 contain 在 mural 边界内；加载失败时原占位材质仍可见。01/02/05 朝向分别由各自 side wall 朝向单独设置。

WebP URL 与 A05 使用同一绝对 URL，A01 本地服务对 WebP 设置一小时 HTTP 缓存以复用下载。A04→A05 使用运行时纹理平面的屏幕投影作为导读图起点，并将 iframe 内局部投影换算到父页面坐标。投影不作测绘级配准；起始显示仍保持原图比例并 contain 在透视投影区域中。过渡期间模型中的目标 mural 与二维图片同步交叉淡化，建筑其他部分继续使用原 A04 淡出进度。GLB 仍保留 `mural-01` 至 `mural-05` 的稳定节点和现有位置；03/04 保持青绿色占位板。
