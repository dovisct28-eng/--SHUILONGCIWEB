# V2.4 右廊候选图来源及状态

- 生成日期：2026-10-27，内置 image_gen；确切后端型号未提供。
- 参考：`east-mid-reference-ui.png`，本轮从运行中的 V2.3 模型截图，1440×900，机位 `[3.85,1.38,0]`、目标 `[3.85,1.38,-7.3]`、FOV 48；带有旧界面文字，不是现场照片。
- 未改原图：`east-mid-v1-raw.png`，1672×941；`east-mid-v1.webp` 为同像素尺寸 quality 88 的 WebP 副本。未覆盖此前素材。
- 决定：暂不接入。候选改变了部分屋面与柱梁细节，日照与原夜间模型也不连续，参考和输出的纵横比不同；没有无界面参考、配准测试、遮挡层、分层成果或动态审查。
- 未生成壁画；模型墙面和生成墙面空白。此素材是设计视觉候选，不是文化遗产照片或复原证据。

## 实际完整提示词

> Use case: sketch-to-render. The input is a screen capture of the actual design-model reference viewpoint in an experimental heritage exhibition; remove all website UI and lettering. Create one 16:9 candidate architectural visualization background for the same camera viewpoint in a traditional Chinese temple. Preserve the visible geometry and perspective extremely closely: the large foreground wooden column, successive right-hand corridor posts and roof beam, plain blank right plaster wall, stone corridor floor, open left courtyard and distant hall as they appear. Improve the material realism and natural subdued lighting only: aged dark wood, worn gray-white plaster and stone floor, tranquil chiaroscuro. Keep the right wall entirely blank so an authentic mural can later be composited. No murals, people, text, plaques, signs, decorative additions, invented columns, modern lights or technology. This is a design visualization, not documentary evidence. The generated image will be evaluated for geometric registration before any use.
