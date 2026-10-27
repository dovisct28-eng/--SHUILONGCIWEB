const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),out=path.join(root,'docs/validation/immersive-hybrid-v2-2'),assets=path.join(root,'module-a/immersive-hybrid-v1/assets/hybrid-v2-2'),read=f=>JSON.parse(fs.readFileSync(path.join(out,f)));
const build=read('build-results.json'),browser=read('browser-results.json'),motion=read('motion-evidence.json');assert.ok(build.pass&&browser.pass&&motion.pass);
const video=read('video-metadata.json');assert.equal(video.pass,true);assert.equal(video.sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(out,video.file))).digest('hex'));
const manifest=JSON.parse(fs.readFileSync(path.join(assets,'layers.json'))),files=fs.readdirSync(path.join(out,'selected')).map(file=>({file,bytes:fs.statSync(path.join(out,'selected',file)).size}));assert.equal(files.length,9);
const rows=browser.viewports[0].rows,first=rows[0].stats,last=rows.at(-1).stats;
const table=browser.performance.map(r=>`| ${r.state} | ${r.metrics.samples} | ${r.metrics.p50.toFixed(2)} | ${r.metrics.p95.toFixed(2)} | ${r.metrics.max.toFixed(2)} |`).join('\n');
const regression=browser.regression.map(r=>`| ${r.chapter} | ${r.difference.mean.toFixed(6)} | ${r.structuralDifference.mean.toFixed(6)} | ${r.exactLayoutAndSource?'一致':'不一致'} |`).join('\n');
const text=`# V2.2 实测摘要

主要实施与验收2026-10-26，收尾复核2026-10-27。本机 Headless Chrome；不是弱GPU、物理设备或用户最终审图结论。

- 单元测试11/11；构建/保护检查通过；三个桌面视口均通过九节点、正反向与五次往返。
- 同一个Renderer、iframe内一个Canvas、父页面0个Canvas、每次加载仅1次GLB请求。新增2张1024纹理，Web传输共${manifest.textures.reduce((n,t)=>n+t.bytes,0)}字节。
- 首次/首次融合后GPU对象：纹理${first.memory.textures}→${last.memory.textures}，几何${first.memory.geometries}→${last.memory.geometries}；每视口五次往返后计数不变。增强仅3个表面层、18个三角形。
- 新增纹理未压缩估计${(last.hybrid.textureBytesEstimate/1048576).toFixed(2)}MiB，含mipmap；实际显存未测。加载/解码/着色器预编译耗时逐项在browser-results.json的stats.hybrid.decode。
- 新增轨道3000采样、15000方向射线检查，半径偏移0.065，未发现碰撞。它不是连续人体体积或现场尺度认证。
- 原图、GLB、壁画锚点、V2.1五停靠逐样本、V1和固定归档受保护。
- 正常导航无运行错误；记录${browser.warnings.length}条匹配历史基线的ANGLE X3595警告。503测试的预期错误单列，不混入正常错误。

## 普通运动帧间隔（无录像）

| 状态 | 样本 | P50 ms | P95 ms | 最大 ms |
| --- | ---: | ---: | ---: | ---: |
${table}

最大值同样保留，P95不代表无单帧停顿。RAF间隔不是GPU耗时或显示器最终播放帧率。

## 实际录像与深度

录像1440×900、VP8/WebM、25fps，完整浏览器视口，包括原UI和CSS环境，时长${video.duration.toFixed(2)}秒；约在${((motion.motionStartOffsetMs??0)/1000).toFixed(2)}秒开始右廊运动，前面保留实际加载/门内准备。正反向均为普通运动，右廊段每方向约5秒。录像状态P50/P95/最大值：正向 ${motion.forwardMetrics.p50.toFixed(2)}/${motion.forwardMetrics.p95.toFixed(2)}/${motion.forwardMetrics.max.toFixed(2)} ms，反向 ${motion.reverseMetrics.p50.toFixed(2)}/${motion.reverseMetrics.p95.toFixed(2)}/${motion.reverseMetrics.max.toFixed(2)} ms。录制会增加负载，不能与无录像测量混同。录像经过完整Blob加载、实际解码抽查和帧差检查，SHA绑定在video-metadata.json。

连续融合相邻帧${motion.adjacentFrames}张保留local；实际GPU ${motion.gpu.renderer}。同机位原场景/增强深度最大差${motion.maxDepthDifference}设计单位，检查容差${motion.depthTolerance}（共面三角形和RGB24/Float32栅格量化容差）。不声称逐浮点值完全相同。

## 正式A01–A08回归

| 章节 | 原像素平均通道差（0–255） | 2px高斯后平均通道差（0–255） | 文案/素材/布局 |
| --- | ---: | ---: | --- |
${regression}

部分高频纹理有跨上下文栅格差异，独立复采曾得到0差异；底层原因未确证。不将全部截图报告为逐像素一致。验证同时要求素材源、文字、图像尺寸/变换/显隐与标题几何完全一致、2px低频结构均值小于0.3，原始像素差异完整保留。正式产品源码未为此修改。

## 精选清单

| 文件 | 字节 |
| --- | ---: |
${files.map(r=>`| ${r.file} | ${r.bytes} |`).join('\n')}

精选共${files.length}件，${files.reduce((n,f)=>n+f.bytes,0)}字节；完整回归与61张连续检查帧留local且不提交。模型匹配RGB/机器深度另作为可复用素材保存，不属于临时截图。

## 当前边界

已实现：V2.1保留、真实右转、原表面图像合成、实时遮挡、同轨反向、资源失败回退与重试、有限推进、调试与导出。视觉候选：室内材料丰富程度、光影观感及运动节奏。未验证：物理设备与弱GPU、最终人类动态审图。后续范围：第一幅壁画停靠和高清展开、更多机位/更精细室内素材。
`;
fs.writeFileSync(path.join(out,'measurement-summary.md'),text);fs.writeFileSync(path.join(out,'selected-manifest.json'),JSON.stringify({files,totalBytes:files.reduce((n,f)=>n+f.bytes,0)},null,2));console.log('PASS: complete evidence reports; 9 selected artifacts,',files.reduce((n,f)=>n+f.bytes,0),'bytes');
