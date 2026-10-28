# V2.4-B0 · 独立建筑模型候选

状态：**建筑模型优化候选，等待用户视觉确认**。基线为功能分支`35a566c5ef25d40e18fc0d10a89c8967ad76079d`，开工前已fetch并核实远程相同。未替换正式模型、未修改A01–A08、模块B、原材质/壁画/AI资产、正式镜头或阅读状态机，不合并master。

## 查看

已有本地服务：<http://127.0.0.1:4186/docs/validation/temple-model-v2/model-comparison.html>

服务未启动时，在项目根目录运行：

```powershell
$env:A01_PORT='4186'
node module-a/a01/server.mjs
```

用HTTP打开页面，不能直接双击HTML。运行预览不需安装新依赖、不调用外部服务。所有候选共用原建筑纹理与固定灯光/曝光，关闭旧AI投影。Baseline读取原正式GLB；其余9个GLB位于`models/`，没有重复拷贝一份Baseline。

页面支持10种模型、12个固定机位、候选居中机位、构件线框、PNG截图、独立候选路线播放与停止，以及真实第一幅原图查看。居中开关用于固定机位；整段路线播放始终使用该候选的重新校准轨道，画面有独立预览标记。原图弹窗不代表正式2.5D阅读已整合。

## 成果入口

- [候选对照报告](CANDIDATE_COMPARISON.md)：宽度口径、戏台/屋顶取舍、推荐方案与整合成本。
- `candidate-config.json`：A/B/C、两组戏台、两组屋顶及两套组合的可编辑参数。
- `src/baseline-model.js`：原源文件的逐字节冻结副本；`src/candidate-model.mjs`复用其几何帮助函数，局部替换候选构件。
- `src/glb-writer.mjs`：复用原`build-model.mjs`的导出主体，仅返回候选数据，不执行其正式文件写入或A01线稿生成。
- `model-manifest.json`：每个模型的三角形、文件字节、参数、包围盒和SHA-256。
- `camera-manifest.json`：固定对照/重新居中两种实际矩阵、FOV、实际画布aspect及路线节点，为模型确认后的新室内场景保留依据。
- `test-results.json`：验收汇总；详细数据分别在`browser-results.json`、`camera-results.json`、`ui-results.json`、`video-results.json`和`corridor-motion-results.json`。
- `protection-results.json`：开工时所有已跟踪文件字节/删除状态与归档引用保护结果。

## 精选留档

| 文件 | 覆盖与口径 |
| --- | --- |
| `selected/01-original-corridor.webp` | Baseline相同世界坐标/居中双列对照；各原捕获1440×900 |
| `selected/02-corridor-A.webp` | A同机位/居中双列对照 |
| `selected/03-corridor-B.webp` | B同机位/居中双列对照 |
| `selected/04-corridor-C.webp` | C同机位/居中双列对照 |
| `selected/05-stage-comparison.webp` | 原戏台/Stage A/B，均配Corridor B；正面与鸟瞰两行 |
| `selected/06-roof-comparison.webp` | 原主殿屋顶/Roof A/B，侧面与鸟瞰两行 |
| `selected/07-combined-a.webp` | Combined A整体鸟瞰 |
| `selected/08-combined-b.webp` | Combined B整体鸟瞰 |
| `selected/09-mural-front.webp` | Baseline/A/B按相同台基边缘余量求得正视机位，FOV相同；真实图像比例不变 |
| `selected/10-route-preview.webm` | 实际浏览器：穿门→绕台→新走廊→①正视→反向返回，独立候选路线 |
| `selected/11-corridor-motion-comparison.webm` | Baseline/A/B/C同一世界轨道与居中轨道，共8段实际浏览器动态对照 |

WebP为无损编码；展板仅调整排列、添加外部标题并等比缩小部分原截图，没有合成建筑或修饰差异。整批三视口截图、路线关键帧、完整录屏源和重复诊断留`local/`，由已有`.gitignore`排除。最终精选数量、大小、哈希见`test-results.json`；没有迁移或清理历史证据。

## 复现与验证

Node.js可直接运行原生ES模块。Playwright/Sharp只用于验收脚本，取本机Codex运行时，不是预览网页的运行依赖。视频解码检查使用Playwright自带FFmpeg，其他机器可设置`FFMPEG`为其路径。

```powershell
$env:NODE_PATH='C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
node docs/validation/temple-model-v2/scripts/build-candidates.mjs all
node --test docs/validation/temple-model-v2/scripts/geometry.test.mjs shuilong-temple/model.test.mjs shuilong-temple/source-equivalence.test.mjs module-a/immersive-hybrid-v1/tests/*.test.mjs
node docs/validation/temple-model-v2/scripts/browser-check.cjs
node docs/validation/temple-model-v2/scripts/camera-check.cjs
node docs/validation/temple-model-v2/scripts/ui-check.cjs
node docs/validation/temple-model-v2/scripts/evidence.cjs
node docs/validation/temple-model-v2/scripts/record-route.cjs
node docs/validation/temple-model-v2/scripts/video-check.cjs
node docs/validation/temple-model-v2/scripts/corridor-motion.cjs
node docs/validation/temple-model-v2/scripts/protect.cjs
node docs/validation/temple-model-v2/scripts/final-check.cjs
```

构建器支持`corridor`、`stage`、`roof`、`combined`分阶段生成；`all`只生成所列9个候选，不做参数笛卡尔积。若正式源模型已变化，冻结副本一致性检查会停止构建，防止误用旧基线；需另行明确更新候选基线。

初次记录保护基线才运行`protect.cjs baseline`，复验不要覆盖原`local/before.json`。本轮全部原有脏文件保持开工时字节/删除状态，只暂存本目录新增文件。

## 资料与适用边界

资料沿用[阶段一报告](../temple-model-audit/MODEL_AUDIT.md)和[图6原图提取](../temple-model-audit/references/figure-6-plan.webp)，结合本地修复后航拍、左右侧、戏台/庭院、门内照片。2016文献是修复前调查，照片的完整拍摄日期/作者未独立核实；未引入生成图作为现场证据，没有复制修复前过廊残损。

三个视口均检查实际运行、布局和切换。包络是离散相机通行检查；模型构造是数字展示简化；性能是本机Chrome记录。用户视觉确认、现场测绘、实体设备/真人通行，以及正式A01–A08和2.5D状态机整合不在本轮完成结论内。
