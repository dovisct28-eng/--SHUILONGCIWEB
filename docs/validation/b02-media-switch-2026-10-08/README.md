# B02 无框展示与媒体互斥验收

日期：2026-10-08。开始实施前通过 `git ls-remote origin refs/heads/master` 和 `git fetch origin master` 核对：远程 master / 本地 HEAD 均为 `53222053b5597e4db5d9728d05a16051f1e2fcb3`，与任务审查基线一致。

## 修改清单

| 文件 | 修复前的问题 | 修复后实现 |
|---|---|---|
| `Mural-Exhibition/public/index.html` | 图片以 opacity 叠层切换，视频下保留静态色稿；按钮提前选中；下载完成可能仍未解码 | 复用四个媒体节点，以 `commitGalleryMedia` 先全部隐藏再显示一个；离屏加载、解码、版本/取消校验后提交；缓存只认已解码图源；保留旧图、等待状态、错误重试；视频独占/结束恢复/失败回退/资源释放；更新左下文案 |
| `Mural-Exhibition/public/b03.css` | 共享样式给 B02 增加固定边框和 opacity 过渡 | 保留 B03 的原边框/过渡值并限定于 `body.track-cyber`；删除重复的共用图片过渡声明；没有修改体感舞台样式 |
| `Mural-Exhibition/public/gallery.css` | B02 显示框与素材比例不一致 | `body.track-gallery` 限定无边框/底板/伪元素、自然尺寸与最大宽高约束、双轴居中、contain、hidden 和无过渡；保留两栏和控制区位置；等待按钮只标记 busy |
| `Mural-Exhibition/b02.test.cjs` | 没有验证提交可见性不变量 | 提取生产提交函数验证每次隐藏/显示操作最多一个媒体可见，覆盖静态图、视频、none 和按钮选中状态 |
| `Mural-Exhibition/b02-browser-check.cjs` | opacity 断言不反映实际渲染，测试人物写入正式 assets | 改为实际计算样式断言；标注测试使用操作系统临时目录；保留原有扫描、标注、全景、压力、内存测试并调用新媒体检查 |
| `Mural-Exhibition/b02-media-browser-check.cjs` | 缺少切换全过程、素材比例与视频错误覆盖 | 真实 Chrome 逐帧采样；36 个正式静态状态；临时比例/透明边距素材；请求及解码竞态、重试、真实 MP4 与视频故障/资源释放验证；可独立执行 |
| `docs/B02_GALLERY_AUTHORING.md` | 未明确独立展示和尺寸差异规则 | 补充无框、自然比例、互斥提交、解码/失败/视频生命周期及不裁剪、不配准规则 |

本次未改变 B01 构图/入口、全景图/热点/坐标、扫描接口、管理员标注实现，未改变 B03 WebGL、识别、多人锁定、手势、信息环、粒子、材质或摄像头预览。共享 `loadStudyImage()` 保持基线实现，解码只在 B02 切换调用处执行。未修改正式图片、视频或人物元数据。工作区原有素材移动/删除、归档启动器和其他未提交文件全部保留，不纳入提交。

## 执行命令和结果

在仓库根目录执行的等价命令如下（`npm test` 在 `Mural-Exhibition` 内执行）：

| 命令 | 结果 |
|---|---|
| `node --test Mural-Exhibition/b02.test.cjs` | PASS，5 项，包含新增互斥状态提交测试 |
| `node Mural-Exhibition/b01-check.cjs` | PASS，语法、B01 构图、受保护着色器/分类器/摄像头生命周期检查 |
| `cd Mural-Exhibition; npm test` | PASS，75 项；包括 B02、B03、环绕布局、材质、动态、NEXT、操作人归属、阅读控制、Pose 管线 |
| `node Mural-Exhibition/b02-browser-check.cjs` | PASS，四视口入口/全景/八热点、索引、图层、标注临时夹具、30/50 热点压力、30 次详情访问、完整媒体检查 |
| `node Mural-Exhibition/b02-media-browser-check.cjs` | 独立脚本已通过；最终版本由上一行完整测试再次执行，最终结果见 `media-results.json` |
| `node Mural-Exhibition/b03-gesture-browser-check.cjs` | PASS，生产回调的真实 Chrome / Three.js / GSAP 渲染，三个桌面视口，10 个完整使用循环；模拟相机画面与模型输出 |
| `node --check Mural-Exhibition/b02-browser-check.cjs` / `node --check Mural-Exhibition/b02-media-browser-check.cjs` | PASS；项目无独立构建脚本，入口模块语法检查包含于 `b01-check.cjs` |

浏览器使用本机 Chrome headless，Node v24.14.1。测试运行时以 `NODE_PATH=C:\Users\dovis\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules` 找到现有 Playwright。没有新增生产依赖或图像处理库；比例测试 PNG 由浏览器 Canvas 生成，只存操作系统临时目录，由测试路由提供，完成后清理。

## 验收覆盖

- 1280×800、1366×768、1440×900、1920×1080，正式人物 01、06、10，原图/线稿/色稿各检查一次，共 36 张真实渲染截图。静态截图测试只在测试浏览器响应中关闭可选动画，确保记录静态色稿；视频另用真实清单和真实 MP4 验证。截图等待原有面板过渡和字体加载完成。
- 计算样式确认四边框均为 0，背景透明、无阴影/outline/伪元素；图像 `contain`、无过渡；元素保持自然宽高比，完整落在原容器内，水平/垂直居中，小图不放大。
- 临时素材：240×1200 高瘦、1500×420 横宽、700×700 方形且有 250px 透明边距、120×160 小画板。每张独立适配，不进行人物配准、透明边界裁剪或 ID 专属缩放。尺寸不一致仅保留内部诊断。
- 从进入详情到快速操作全过程逐渲染帧检查实际计算样式和选中按钮；未发现双媒体可见或按钮错误。覆盖 org→line→color→org、org→color→line、加载/解码未完成时回选、人物切换后迟到请求。
- 图像 404 保留旧图、没有可见破损图标，重试成功；只有原图、缺少线稿、缺少色稿均通过；已提交图层重复查看不产生新图像请求。
- 真实 MP4 播放时静态三图均不可见；自然结束恢复静态色稿。视频 404、无效格式、play 拒绝均回退；视频延迟就绪后不能覆盖新的图层。10 次播放/释放循环保持四个媒体 DOM，视频暂停、src 与事件回调清空；切换人物也清空旧视频。
- 常规浏览无新增页面异常。错误场景仅产生两条刻意注入的 404 控制台记录，非正常浏览错误；原始记录完整保留。

## 精选截图

精选原尺寸 PNG 全部来自浏览器，不使用合成效果图。完整 36 个静态状态、其他回归截图、先前失败尝试和临时检查保留 `local/` 并由现有 `.gitignore` 排除。`selected/` 仅提交下列有独立验收意义的状态；精确数量与体积见 `evidence-manifest.json`。

| 文件 | 状态/意义 |
|---|---|
| `real-01-org-1440x900.png` | 1440×900 默认原图，无显示边框，原两栏关系 |
| `real-01-line-1440x900.png` | 高清线稿独立展示 |
| `real-01-color-1440x900.png` | 数字色稿独立展示 |
| `real-01-org-1280x800.png` | 最小指定视口完整画板和控制区 |
| `real-06-line-1366x768.png` | 翻坛张五郎，较低桌面视口与另一人物构图 |
| `real-10-color-1920x1080.png` | 上层猖兵宽幅群像/不同大画板及大桌面留白 |
| `fixture-org.png` | 临时高瘦画板，明确为显示测试图形 |
| `fixture-line.png` | 临时横宽画板，明确为显示测试图形 |
| `fixture-color.png` | 临时方形画板、大透明边距，保持作者画板规则 |
| `fixture-small-original-only.png` | 小画板不强制放大、缺失按钮禁用 |
| `real-video-exclusive.png` | 真实视频独占，三静态图均隐藏 |
| `image-failure-retained.png` | 注入图像失败后保留旧图、可重试、状态优先 |

## 验证限制与执行问题

- 正式 org/line/color 含完整壁画背景或作者画板，并非全部是透明人物剪影。本次不改变这种构图，也不借助裁剪把人物强制填满。高瘦/横宽/大透明边距极端情况用明确标记的测试图形证明显示规则，不能把测试图形当作文物素材。
- JS 堆、DOM 和视频生命周期观察不能证明浏览器进程/GPU/解码图像内存绝无泄漏。30 次详情访问后 GC 的 JS 堆变化及视频释放结果见 `gallery-results.json` / `media-results.json`；本次未发现媒体节点持续增加或旧视频源/回调残留。
- B03 相机/模型边界为模拟输入；实体摄像头、真实多人遮挡/低照度验收未执行，仍需现场测试。没有把模拟回归称为硬件通过。
- 本次未运行其他仍使用 B02 `style.opacity` 或旧“配准警告”断言的 B01/B03 浏览器脚本。这些断言不兼容本次独立媒体模式，未标记通过。自动审批拒绝批量改动 B01/B03 测试文件，理由为超出 B02 范围，故保持这些文件原样；实际 B01 入口/全景回归由 B02 浏览器测试及 B01 源码检查覆盖，体感回归由原有 B03 单元测试和手势浏览器脚本覆盖。
- 初次普通沙箱测试 mkdir 报 EPERM，使用获批的验收命令运行；测试夹具曾遇跨盘硬链接 EXDEV，已改为临时副本；测试定位器重复匹配和延迟路由清理竞态已修复并重跑。新增提交函数测试的首次 mock 计数误包含 wrapper，已修正。前期失败结果留在 `local/`，不称为通过。

最终交付 commit 和远程 master 核实值在交付消息中记录；提交只包含本阶段明确文件及精选证据。
