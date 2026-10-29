# Combined B 过渡素材与配准记录

本目录保存 V2.4-B2 过渡素材。`v24.html` 在 Combined B / V2.4-B1 的原模型和原相机轨道上叠加本轮表面候选；右上角可切换纯 3D 对照。历史 `v24a` 资源未被覆盖。融合为设计表达，非水龙祠实测复原；本轮技术检查不等于用户视觉确认。

## 机位

由 `scripts/v24b2-reference.cjs` 从正在运行的 `v24.html` / `model=combined-b` 导出；视口 1920×1080、设备像素比 1，坐标为设计模型单位，不代表实测。完整投影矩阵、相机世界矩阵、壁画投影角点和模型表面点见 `references/camera-manifest.json`。采集时壁画渲染仅在采集会话内关闭，生成输入为空墙，不修改真实素材。

| 文件名 | 状态 | position | target | fov |
| --- | --- | --- | --- | --- |
| gate-interior-mid | threshold → gate-interior | 0.2684, 1.3893, 11.2347 | 1.9565, 1.4971, 10.5971 | 48 |
| gate-interior | gate-interior | 3.3, 1.55, 10.7 | 3.906, 1.55, 5 | 48 |
| stage-turn | stage-turn | 3.906, 1.55, 10.55 | 3.906, 1.55, 5 | 48 |
| corridor-advance | corridor-hybrid | 3.906, 1.55, 8.4 | 3.906, 1.55, 2.4 | 48 |
| mural-approach | corridor-2_5d | 3.906, 1.55, 7.65 | 3.906, 1.55, 2 | 48 |

当前 `gate-interior` 停点已位于戏台右侧，近柱遮挡较重；`stage-turn` 停点已接近横移完成。补充的 `gate-interior-mid` 是门洞内横移过程中的真实轨道取样；这些停点本身不能完整展示门内戏台和整个转弯过程。第五机位只用于记录轨道，不参与图层插值。

每个机位的 `foreground-depth-2.8.png` 是当前完整场景中距相机 2.8 模型单位以内的二值深度参考，不是连续深度图或最终遮挡蒙版；`regions.png` 是对实际建筑模型的独立诊断渲染，红色石灰墙、绿色向上的石材/铺地、蓝色木构、黄色屋面、黑色其他，采用模型当前材质键和几何深度。它未覆盖模型外的环境层，不能直接作为动态遮挡或融合 alpha，边缘和分类仍需对照画面检查。

## 新生成候选与配准

`candidates/combined-b-{gate-interior,stage-turn,corridor-advance,mural-approach}.png` 分别以同名空墙实机画面为输入，由 Codex 内置 imagegen 编辑生成，未覆盖历史素材。四张使用相同约束：保留精确机位、空间结构和遮挡，只轻度丰富木材、灰墙、地面及原有照明；空墙不画壁画；不增陈设、现代展陈、人物、文字或新建筑构件。

四次生成的完整提示如下，输入图分别为对应机位的 `references/*.png`：

> Use case: style-transfer. Edit target: the supplied exact 3D camera render of a Chinese historic timber temple, used for projection onto the same real 3D geometry. Preserve EXACTLY the camera framing, every structural edge, wall and roof silhouette, beam and pillar positions/count, floor plane, vanishing point, corridor width, relative brightness and occlusion. Only add subtle believable timber, plaster and stone surface texture and gentle existing illumination, matching the original dark restrained atmosphere. The entire right wall must remain empty plaster: no mural, picture, framed panel, words, symbols or artifacts. No new props, modern exhibition elements, humans, invented architecture, extra windows, dramatic lighting or perspective changes. 16:9 landscape. This is a design visualization and not historical evidence.

第一组人工对照发现生成图增加/改变了屋架、墙面立柱和部分边缘，未接入。后续对四个机位分别生成 `candidates/strict-*.png`：这一组主要柱位、墙面边界和视角更贴近对应模型参考，仍不是逐像素锁定，也不作为历史证据。四次使用下述完整提示：

> Use case: precise-object-edit. Edit the input image itself, not a new scene. Keep the SAME exact pixels and contours for every architectural edge, all silhouettes, pillars, walls, roof, shadows, sky and floor lines, and the same perspective and framing. Do not redraw, move or add any architecture. Change ONLY the texture within the existing broad empty plaster wall at right and the existing floor, by adding very subtle realistic fine-grain plaster and paving material; maintain original colors and lighting. Keep all timber and dark upper roof exactly as in the input. Do not add beams, frames, wall trim, skirting, windows, mural, people, props, text or lighting. If exact structural preservation is not possible, keep the original pixels. 16:9 landscape.

生成图为 1672×941，参考图为 1920×1080；`scripts/v24b2-prepare.py` 将其显式归一到 1280×720，依据各自的新机位模型材质分区及人工安全边界生成 `prepared/*-valid-rg.png`（R 墙面、G 地面）。边界先收缩再羽化，以避免把生成图中的结构边缘投影到另一位置。前景不靠静态 mask 遮盖：运行时复制符合条件的现有墙面/地面三角形，使用原场景的深度测试；木柱和屋架始终由真实模型遮挡。`foreground-depth-2.8.png` 仍为人工诊断参考，不是实时深度。

相机投影使用清单中的 `projection × inverse(cameraMatrix)`，生成图及其有效区共享该投影。时间采样为 1、1.43、1.8、2，邻机位以 smoothstep 交叉插值；总权重从 1.2 至 1.8 逐渐增加，墙/地最大增益分别为 0.55 / 0.14；转向壁画时随视线偏航退场，正视与阅读均为零。第一幅真实图像仍由原 compositor 的物理墙位和既有阅读投影控制；其发现透明度从 1.59 至 1.75 可逆渐显。

为规避生成图可能产生的错位，本轮只使用生成图里的墙/地表面，不把生成的整张建筑场景、木构或墙脚线覆盖模型；因此效果是偏克制的材质融合，建筑主体仍保留明显的 3D 风格。若需要生成图大面积接管整个空间，还需另行解决完整场景的逐边界配准和动态遮挡。

运行导出：先启动 `$env:A01_PORT='4186'; node module-a/a01/server.mjs`，再配置可用的 Playwright `NODE_PATH` 后运行 `node module-a/immersive-hybrid-v1/scripts/v24b2-reference.cjs`。
