# V2.4-A 场景候选来源

生成日期：2026-10-27；内置 image_gen（工具未报告确切后端模型）。三张原件均为 1672×941 PNG，Web 副本保持原像素尺寸编码为 WebP quality 90。图像是设计表达，不是现场照片或历史复原。采用的只是无壁画墙面和地面上的受控投影；未修改 GLB 或壁画原图。旧 S01–S04 和前一版 east-mid 均保留，未作为本入口的投影图片。

| 编号 | 参考 | 原始输出 | 实际使用 | 具体问题 |
|---|---|---|---|---|
| G01 | `references/gate-interior.png`，模型 `time=1` | `generated/g01-original.png` | `generated/g01.webp` | 前景戏台及右墙大致对应；墙面与原图光照不同。实际限制取样区域；不能将整图视作已配准。 |
| G02 | `references/corridor-start.png`，模型 `time=1.6` | `generated/g02-original.png` | `generated/g02.webp` | 增加材质、改变了部分木构细节与光影，地面阴影是烘焙图像；以真实几何遮挡并限制取样，动态接缝仍待人工审查。 |
| G03 | `references/mural-look.png`，第一幅原位机位 | `generated/g03-original.png` | `generated/g03.webp` | 右墙为空白；天空与实际夜色不匹配，限制为空墙、廊道地面投影。不能用作整张背景。 |

生成参考为 1920×1080 原建筑渲染，不含 UI、壁画。`camera-manifest.json` 保存各相机矩阵及部分构件投影；`*-depth-mask.png` 为近景深度范围调试参考，`*-regions.png` 为运行时几何区域可视化（非本版产品用蒙版）。产品使用局部软边矩形约束与实际模型表面及深度遮挡，尚未建立逐像素配准误差测量。原件无覆盖，未重绘任何真实壁画。

## G01 实际提示词

Use case: sketch-to-render. Reference is an exact camera frame from a design model. Produce a 16:9 architectural visualization for the SAME CAMERA, not a redesigned building: preserve the near left stage back wall occupying ~60% width, its stone base, the right foreground column, right blank plaster wall, roof beams and their precise silhouette and vanishing direction. Improve material texture only: naturally aged dark timber, muted plaster and stone, subtly brighter ambient shadow, low-key diffuse natural light compatible with a dark twilight exterior. No UI, people, signs, wall paintings or added architecture, doors or columns. Empty wall. Reference geometry has priority over decoration. Not a historic reconstruction.

## G02 实际提示词

Use case: sketch-to-render. Reference is a fixed camera image of a temple design model. Create 16:9 high quality architectural material visualization from EXACTLY this perspective and framing. Preserve all positions and outlines of the foreground post, receding posts, roof, floor, blank right wall, courtyard and hall. Do not alter number of pillars, geometry, camera, wall orientation or add rooms. Improve only aged timber, plaster and paving detail, gentle low-key natural light and readable shadow, coherent dark dusk mood. No mural, artwork, people, text, new windows, lights or objects. This is design visualization not documentary evidence.

## G03 实际提示词

Use case: sketch-to-render. Reference is a fixed view of a traditional temple corridor and blank mural wall. Render the EXACT same viewpoint, perspective, geometry, number and locations of columns, beams, floor and long right blank wall. Improve materials and natural low-key light only, aged wood, unadorned muted gray plaster, stone paving. Keep the entire right wall blank for separately composited real original photograph. No wall paintings, art, people, text, windows, added architecture or modern lighting. No historical reconstruction claims.
