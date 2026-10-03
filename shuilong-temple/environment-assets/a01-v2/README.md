# A01 v2 design asset

`Art-directed narrative environment` — 数字叙事艺术化环境，不代表水龙祠周边地貌测绘复原。

`karst-valley.webp`：1586×992，209,634 B。2026-10-03 使用内置 ImageGen 生成不含建筑的山谷素材，再用 Sharp 以 quality 88 编码为本地 WebP。没有使用 stock、CDN、历史图片或真实文物母版。SHA256：`c3b6f29eba6b0d716ad3dc40862a6022ed2e8329b2bb1ebf71e30b9109838bf5`。

用户随后要求喀斯特远景；生成的峰丛、岩壁与雾谷已符合这一艺术方向。不能据此推定现场地貌、植物种类、河道或光照。网页中的建筑始终由原 GLB 渲染。

天空与远山共用同一文件、两张软遮罩图层：天空保持静止，远景仅随滚动做小幅视差。近地坡面、细碎枝叶、灌木、石块和贴地雾由 [a01-environment.mjs](../../a01-environment.mjs) 程序化创建，与建筑共享相机和光照。叶片刷纹通过固定种子的 Canvas 生成；生成代码已入库，不是整棵树的图片卡片。

内置工具的完整生成 prompt：

```text
Use case: stylized-concept. Asset type: Environment-only matte painting for a WebGL Chinese cultural heritage narrative scene. Create a wide 16:10 landscape painting with no architecture whatsoever. Cinematic Chinese ink landscape with fine atmospheric perspective, dark blue-gray shadows and muted warm amber dawn in upper right. Elevated oblique viewpoint looking across a deep valley. Four layers of jagged karst ridges recede into mist, distant winding light ribbon of water far in the valley, woodland hills. Large dark near cliff with delicate ink texture occupies left quarter; valley opens toward upper right sunlit horizon. LOWER RIGHT HALF MUST be calm misty muted slate soil/woodland clearing with almost no salient details, as a real 3D temple will be composited there separately. Medium subdued brightness, fine natural painterly texture, not photorealistic photograph, not flat vector, no oversaturated orange. Sky upper 25%, mountain silhouettes and haze soften with distance. No temple, houses, buildings, bridges, ruins, pagodas, roads, people, text, letters, borders, UI or watermark anywhere. Art-directed narrative environment, imaginary geography, not a surveyed reconstruction.
```

工具原始 PNG 位于用户的 `.codex/generated_images/`，不作为项目运行依赖；项目选定素材仅依赖本目录 WebP。
