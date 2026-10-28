# 阶段一审查成果与复验记录

2026-10-28。范围为shared建筑的只读审查与功能分支影响分析；新增文件仅在本目录，未修改shared、正式A01–A08、模块B、现有实验入口、GLB、原材质/原图/摄像机/AI资产。

- [审查报告](MODEL_AUDIT.md)：结论、尺寸表、五墙核对、优先级及依赖风险。
- [可编辑SVG](model-layout-comparison.svg)：原生矢量对象，不嵌入截图；可在Illustrator继续编辑。历史图是有来源的示意提炼，不能作为精密CAD或修复后实测图。
- [文献图6提取](references/figure-6-plan.webp)：原PDF物理第7页；仅旋转−90°、裁切。原件位置与哈希记于`validation-results.json`，整页原渲染与临时图留`local/`，未提交整份PDF或照片原件。
- [验证数据](validation-results.json)与[文件检查](file-checks.json)：实际运行、视图矩阵、包围盒、输入指纹及最终精选文件大小/哈希。

## 精选截图

| 文件 | 画面及覆盖 | 限制 |
| --- | --- | --- |
| `selected/01-model-top.webp` | 1600×1200；正交、上方为主殿、下方为入口；可见柱列/台基/庭院 | 仅检查场景隐藏roof材质网格；完整屋顶顶视在`local/top-roof-on.png` |
| `selected/02-model-front.webp` | 1600×1200；正交前视，三门和前后屋顶高度关系 | 原GLB关门状态，不代表展厅运行时开门；非现场照片 |
| `selected/03-model-side.webp` | 1600×1200；正交右侧视，入口在左、主殿在右 | 主要用于屋顶/山墙轮廓比较；非材质审美定稿 |
| `selected/04-model-aerial.webp` | 1600×1200；正交斜鸟瞰，完整屋顶与两廊连接 | 独立中性检查光；没有正式环境和后期，不评判正式页最终色感 |
| `selected/05-layout-comparison.webp` | 1800×1320；SVG实际浏览器渲染 | 静态浏览预览，矢量源是可编辑交付 |

五张均为实际Chrome渲染，WebP无损；最终总体积见`file-checks.json`。15个运行状态、重复视图、完整PDF页及中间图在`local/`，沿用现有`.gitignore`排除，不删除旧证据。参考图与五张运行/矢量预览精选分目录保存。

## 本轮验证

基线开始前已刷新远程分支，HEAD与远程均为`701b556cd0f118e7005f5395a3ee7ad01f73b976`。本地既有18项已跟踪修改/删除及其他未跟踪工作保留，暂存采用本目录文件白名单。

| 检查 | 结果 |
| --- | --- |
| GLB/内嵌离线副本/JSON、源等价及展厅逻辑 | 38个相关测试通过；没有重新执行会写模型的`build-model.mjs` |
| 四视图与SVG预览 | Chrome实际渲染；原始GLB83360三角形；加载/页面错误0；目视检查通过 |
| 现有V2.4-A.1功能 | 1440×900、reduced-motion；15个前进/阅读/反向稳定状态通过 |
| 相机包络 | 两段轨道共300段、7个中心/轴向偏移、双向4200条射线；0碰撞 |
| 正视停靠的场景贡献 | 墙/地投影增益均为0，符合现有回退逻辑 |
| 文件保护/语法/XML | 所有开工时已跟踪文件字节及删除状态不变；新增JS语法、SVG XML/无位图对象检查通过 |
| 归档 | 固定Tag与归档分支仍为`48f272497e86e4549c5bcd0dee275ff347171a3f` |

没有正式产品视觉/交互改动，因此不重跑四视口全站及模块B实体手势验收；本轮不能代替它们。完整动态审美、真人通道、②新路线、修复后尺寸与柱网均未因本轮测试被确认。相关日志保留在`local/unit-tests.log`、`local/browser-results.json`、`local/model-views.json`。

## 复验命令

在根目录使用已有本地HTTP服务（4186）。未运行时可执行`$env:A01_PORT='4186'; node module-a/a01/server.mjs`。项目使用原生ES模块，没有独立打包命令。

```powershell
$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
# 仅新一轮审查开工时记录；不要覆盖需保留的上一轮 before.json
node docs/validation/temple-model-audit/audit.cjs baseline
node --test shuilong-temple/model.test.mjs shuilong-temple/source-equivalence.test.mjs module-a/immersive-hybrid-v1/tests/*.test.mjs
& 'C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' docs/validation/temple-model-audit/generate-layout.py
node docs/validation/temple-model-audit/audit.cjs render
node docs/validation/temple-model-audit/browser-audit.cjs
node docs/validation/temple-model-audit/audit.cjs summarize
node docs/validation/temple-model-audit/audit.cjs verify
```

`audit-view.mjs`仅由检查脚本生成的`local/viewer.html`加载，不接入产品。静态服务器对SVG未声明MIME，检查脚本以内联原生SVG渲染预览，未为此改动服务器。`audit.cjs verify`比较开工快照与当前工作区，不把用户原有脏文件误判为本轮变化；commit/push仍只允许本目录新增白名单。
