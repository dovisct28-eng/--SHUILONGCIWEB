# 外砖内灰验收（2026-09-26）

基线：`2bf3661bba69184fa8d0f6cbabbb5d59ceb8cb70`。最终 GLB：83,360 triangles，3,348,544 B；18 张 512×512 建筑贴图源文件共 327,667 B，已嵌入 GLB。

## 实际执行

- `node shuilong-temple/build-model.mjs`：GLB 与离线副本一致。
- Node 单元测试共 40 项通过：既有模块 A 进度/壁画/路线测试、模型材质和元数据、新增内外表面方向、门楣内外封闭、COLOR_0 渐暗、屋顶恢复不透明深度写入。
- `wall-finish-browser-check.cjs`：1920×1080、1440×900、1366×768、1024×768；外侧长墙、后墙、入口外侧、廊内、入口内侧。每页 GLB 请求一次，未请求壁画；页面和 WebGL 无报错。
- `model-browser-check.cjs`：A01/A02/A03/A04、第一幅真实停靠、单模型请求；直接预览和 file:// 离线预览。
- `texture-browser-check.cjs`：PBR 纹理和可见材质副本加载、GLB 网络失败回退、建筑 JPEG 解码失败回退。
- `module-a/a04/browser-check.cjs`：完整自动路线、三幅按需加载与原比例、四尺寸全景、刷新、倒滚、跳过、重播、快速跨段、reduced-motion、壁画失败回退。
- `module-a/a04/transition-check.cjs`：四尺寸 A04→A05 交接、投影、resize 和反向恢复。

浏览器脚本支持 `MODEL_VALIDATION_DIR` 指定本轮产物目录；保留代表截图，其余重复中间截图不入库。`results.json` 为内外墙视角检查，`model-structure/results.json` 为共享模型检查，`a04/results.json` 与 `a04/mural-textures/results.json` 为路线和壁画检查。

外墙检查截图使用现有相机接口固定观察方向，不加载壁画，因此 `interior-gallery.png` 中保留占位。真实壁画效果见 `model-structure/a04-first-1440x900.png` 与 `textured-fifth.png`。

人工检查截图：外表皮为红砖，内表皮为暖灰抹灰；门楣内侧已封闭；第一幅周围仍有抹灰，第二/第五幅墙面保留上下裸砖层次。材质与尺度仍是依据照片和用户确认制作的设计表达。未重新量测真实硬件 FPS，也未进行建筑测绘。
