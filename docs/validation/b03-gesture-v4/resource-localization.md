# 固定版本 MediaPipe 本地部署调查

本轮仅调查，不替换生产模型，不宣称离线运行已解决。元数据和HTTP HEAD记录见 resource-audit.json；HEAD 的 Content-Length 可能是传输编码长度，不能当成完整解压文件大小。

当前 Pose 使用固定 Tasks Vision 0.10.21、lite float16 v1 模型及 classic Worker。Hands / camera_utils / drawing_utils 生产 URL 仍未固定版本，这是已有外部依赖风险。本轮不引入新的 CDN 版本。

[Google 官方 Web 指南](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/web_js)支持将模型保存到项目目录、配置本地模型与 WASM 根路径，也建议通过 Worker 避免推理阻塞主线程。因此保持现有 classic Worker 的本地化在接口层可行；真实本地路径与浏览器兼容性尚未运行验证。

建议后续固定目录：`public/vendor/mediapipe/tasks-vision/0.10.21/` 保存 vision_bundle.mjs、wasm/*；`public/vendor/mediapipe/hands/0.4.1675469240/` 保存 package全套JS/WASM/packed assets和LICENSE；`public/models/pose_landmarker_lite_float16_v1.task` 保存模型及可追溯校验值。将 Worker import、FilesetResolver、modelAssetPath、Hands script与locateFile作为一个受控变更验证，不单独换一条路径。

本次 registry 返回 Tasks Vision 解包大小 20,529,652字节，Hands包24,433,035字节，模型存储大小5,777,746字节。三项全量约50.74MB十进制；尚不含另外两个辅助包、许可证附件和发布清单，未做裁剪，不能当成最终部署体积。Hands 文件表记录 SIMD/非SIMD WASM、packed assets、full/lite模型；不可凭文件名删掉未测分支。

两个指定npm包元数据均声明 Apache-2.0：[Tasks Vision 0.10.21](https://registry.npmjs.org/@mediapipe/tasks-vision/0.10.21)、[Hands 0.4.1675469240](https://registry.npmjs.org/@mediapipe/hands/0.4.1675469240)。仓库[许可原文](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)保留为核对入口。**权重文件的具体分发许可和第三方NOTICE尚未逐项核实**，本轮不据包许可证推断所有模型授权。

后续验收必须包括 SHA256/版本清单、许可证/NOTICE、本地MIME、classic Worker importScripts/WASM、SIMD与fallback、断网冷启动、资源404和重试、退出重入旧会话隔离及真实摄像头效果。约50MB资源和完整兼容验收单列后续任务；当前网络/冷启动风险继续公开。
