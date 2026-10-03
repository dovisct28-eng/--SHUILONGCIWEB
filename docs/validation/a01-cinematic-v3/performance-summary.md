# 最终 V2 / V3 本机性能采样

154.0.8037.93；ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti (0x00002191) Direct3D11 vs_5_0 ps_5_0, D3D11)。每行三次新 context 的中位数；RAF 列为三次窗口统计的中位数。

|尺寸|版本|GLB ready ms|含字体/贴图 ready ms|RAF median ms|RAF p95 ms|Hero calls|Hero triangles|Post MiB|JS used heap MiB|
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
|1440×900|V2|2888|2982|8.5|241.6|46|172,798|31.41|41.24|
|1440×900|V3|2684|2750|4.3|16.7|48|199,154|31.41|45.28|
|1920×1080|V2|2332|2411|8.4|216.5|46|172,798|46.71|41.77|
|1920×1080|V3|2584|2678|4.3|16.7|48|199,154|46.71|44.99|

V3 每次请求 42；GLB 1、字体 2、matte URL 1，无壁画 detail / 三幅导读 display 图片请求。四尺寸浏览器报告中的 GLB 2 包含一次明确 reload；没有同一文档重复建立 renderer 或模型。

V3 增加 2 calls / 26,356 triangles，用于更密土坡和局部遮挡。Post 目标容量保持不变（1440 为 31.41 MiB，1920 为 46.71 MiB）。resize 往返后 geometry / texture 计数不增长。

headless RAF 未保证显示器同步，不能将 4.2 ms 等间隔换算成用户可感知的保证 FPS。V2 原进度改变容器大小，V3 固定容器，减少了 resize 和 render-target 分配压力；本次未进行因果隔离实验，不把性能差异全部归于这一项。新 context 不是全系统冷缓存；未测低端 GPU 或长期内存稳定性。
