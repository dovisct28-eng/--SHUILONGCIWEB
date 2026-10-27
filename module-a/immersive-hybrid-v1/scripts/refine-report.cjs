const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),assert=require('node:assert/strict');
const out=path.resolve(__dirname,'../../../docs/validation/immersive-hybrid-v2-2-1'),selected=path.join(out,'selected'),local=path.join(out,'local'),read=n=>JSON.parse(fs.readFileSync(path.join(out,n+'.json'))),f=n=>Number(n).toFixed(2);
(async()=>{
 const perf=read('09-performance'),browser=read('browser-results'),formal=read('formal-results'),motion=read('motion-evidence'),cache=read('cache-results'),edge=read('edge-results'),build=read('build-results');
 for(const r of [browser,formal,motion,cache,edge,build])assert.ok(r.pass);for(const r of perf.results)assert.deepEqual(r.errors,[]);
 const panes=[];for(const [i,name]of ['legacy-same-camera','hybrid-same-camera'].entries()){const thumb=await sharp(path.join(local,name+'.png')).resize(960,540).composite([{input:Buffer.from(`<svg width="960" height="540"><rect y="500" width="960" height="40" fill="#141b20"/><text x="20" y="527" font-family="Arial" font-size="22" fill="#ddd">${i?'V2.2.1 materials + light':'V2.2 original hybrid'}</text></svg>`)}]).png().toBuffer();panes.push({input:thumb,left:i*960,top:0});}
 await sharp({create:{width:1920,height:540,channels:3,background:'#141b20'}}).composite(panes).webp({quality:94}).toFile(path.join(selected,'05-lighting-before-after.webp'));
 const film=[];for(const i of [0,6,12,18,24,30])film.push({input:await sharp(path.join(local,`continuous-${String(i).padStart(2,'0')}.png`)).resize(480,270).toBuffer(),left:(i/6%3)*480,top:Math.floor(i/18)*270});await sharp({create:{width:1440,height:540,channels:3,background:'#141b20'}}).composite(film).png().toFile(path.join(local,'continuous-contact.png'));
 const timings=perf.results.filter(r=>!r.diagnostic).map((r,i)=>{const h=r.rows.find(s=>s.cycle===1&&s.state==='corridor-hybrid').metrics,second=r.rows.find(s=>s.cycle===2&&s.state==='corridor-hybrid').metrics;return `| ${i+1} | ${r.version} | ${h.samples} | ${f(h.p50)} | ${f(h.p95)} | ${f(h.max)} | ${f(second.max)} |`;}).join('\n');
 const diag=perf.results.filter(r=>r.diagnostic).map(r=>{const row=r.rows.find(s=>s.cycle===1&&s.state==='corridor-hybrid'),events=r.details.glEvents.filter(e=>e.start>=row.start&&e.start<=row.end),first=events.filter(e=>['compileShader','linkProgram','texImage2D','texSubImage2D','bufferData'].includes(e.name));return {version:r.version,interval:row,firstUseEvents:first,blockingCalls:events.filter(e=>e.ms>1),decodeEvents:r.details.decodeEvents,longTasks:r.details.longTasks,preparation:r.details.stats.hybrid.preparation};});fs.writeFileSync(path.join(out,'diagnosis.json'),JSON.stringify(diag,null,2));
 const inventory=fs.readdirSync(selected).map(name=>({file:'selected/'+name,bytes:fs.statSync(path.join(selected,name)).size}));fs.writeFileSync(path.join(out,'selected-inventory.json'),JSON.stringify({files:inventory,totalBytes:inventory.reduce((n,r)=>n+r.bytes,0)},null,2));
 const ready=perf.results.filter(r=>!r.diagnostic&&r.version==='v221').map(r=>r.details.stats.hybrid.preparation),model=browser.viewports[0].memory;
 const text=`# V2.2.1 廊道材质、光影与首次融合优化候选

2026-10-27；功能分支 \`feature/shuilongci-hybrid-gallery-v1\`。实施前 Fetch 核实本地/远程基线均为 \`933a353a569982415fb39604cf70798b6669e7b3\`。本轮不合并 master。工程验证通过；高保真视觉仍待用户结合真实截图和录像正式采用。

## 视觉与技术修改

- 墙面：原 GLB 三角面上的三尺度世界坐标噪声；上部、墙脚、柱跨附近分布不同的明暗，低密度灰泥/磨损、微弱冷暖和距离衰减颗粒。没有增加裂纹图案、文字、窗户或壁画。
- 地面：保留原底图和铺装结构，以非周期多尺度噪声、低对比磨损和粗糙度调制减弱重复；继续接收原柱墙阴影，没有烘焙额外固定柱影。
- 木构/屋面：在原网格材质链后扩展，保留 A01 材质处理；木纹顺纵向，屋面不套木纹。檐下仅加入低强度漫反射亮度补偿，使梁柱从暗面中分离。没有增加构件、实时灯光、后期 pass 或位图。
- 空间：不同表面亮度和弱距离空气形成近中远层次；没有全屏雾蒙版。既有环境、主光、阴影、ACES/AO 和镜头路径保持。
- 融合：原墙地表面增强层共18个三角形，木构直接增强原材质；统一轨道权重，关闭开关或反向退出可恢复。保留旧版完整实现/纹理；三方对照不混用新版材质。调试每250ms最多更新一次，关闭后不采集完整统计。
- 预热：资源/几何先准备；将实际增强对象以零透明度/禁止颜色写入纳入编译遍历，再用同一 Renderer 的临时64×64 HDR目标完成首绘与上传，随后销毁目标。第一步若仍在预热会等待，避免准备工作落在入门运动中；失败可纯三维继续。

完整生成逻辑及系数在 \`src/corridor-finish.mjs\`，来源见 [PROVENANCE](../../../module-a/immersive-hybrid-v1/assets/hybrid-v2-2-1/PROVENANCE.md)。未调用图像生成工具，未修改真实壁画、原GLB或建筑布局。

## 同条件无录像性能

浏览器 Chrome ${perf.browser}，1440×900，GPU ${perf.results[0].details.gpu}。同一浏览器进程，独立上下文，交替顺序，HTTP缓存对两版本均禁用。三组均保留，第三组额外reload；浏览器进程此前已使用，但驱动缓存是否命中未独立测定，不能称为HTTP缓存命中或GPU冷启动。测量为父页面RAF间隔，不是GPU耗时、显示器FPS或跨设备保证。旧版通过Git固定源码拦截，基线未改。

| 顺序 | 版本 | 首次样本 | P50 ms | P95 ms | 首次最大 ms | 第二次最大 ms |
|---|---|---:|---:|---:|---:|---:|
${timings}

完整状态数据见 [09-performance.json](09-performance.json)，原任务中117.9ms是历史环境数据，本轮重新测量不以该数代替本机基线。真实缓存单列在 [cache-results.json](cache-results.json)：WebP冷请求transferSize>0，第二次同上下文transferSize=0，GLB因原服务器no-store仍重新请求。开启调试的单独测量见 [edge-results.json](edge-results.json)。

### 峰值定位与解释边界

独立仪器运行包装WebGL编译、链接、上传/缓冲和查询，并采集Performance Long Tasks、资源时间及ImageBitmap解码。见 [diagnosis.json](diagnosis.json)。旧版虽调用compileAsync，但预载时多数增强对象尚不可见，实际首次融合仍发生程序创建/链接、纹理首次上传；新版将这条首次使用路径提前至准备期。源码路径、时间窗口和优化后对照共同支持该诊断。没有证据把峰值全部归因于GC或单一Shader编译；驱动内部编译/链接、GPU排队各自占比无法分离，历史117.9ms没有原始profile，不能逐毫秒重建。

### 启动成本与资源

预热不是免费消除成本。三次新版准备数据(ms)为：\\n${ready.map((rows,i)=>'- 第'+(i+1)+'次：'+rows.map(x=>x.id+' '+f(x.ms)).join('；')).join('\n')}

上述总时间含旧材质资源准备和等待，不等于纯GPU耗时。新增预热会增加启动等待；第一步明确等待准备状态，正式融合不在中途构建几何或材质。完整程序/解码/加载时间保留在JSON。

V2.2首次使用后45几何/24纹理；本轮稳定${model.geometries}几何/${model.textures}纹理，三个视口各五轮往返无增长。新增3个墙地代理几何，新增缓冲估算21628字节；木构复用原几何，程序数量稳定60。旧版2张1024 WebP仅用于保留对照，传输216448字节；新效果新增位图为0。两纹理含mip估计10.67MiB，不是实际VRAM。Post缓冲沿原配置，详见stats.post.targetBytes；临时64×64 HDR目标已销毁。

## 验证与证据

- Node单元13/13；构建/语法/保护检查通过，189个原场景、轨道、素材与正式模块A文件保持，固定归档引用未变。[build-results.json](build-results.json)
- 1920×1080、1440×900、1366×768：首次载入、9节点、正反向、各5轮往返、窗口缩放、减少动态、四项增强开关、三种画面、固定相机、手动/自动融合、闲置不持续重绘均通过。[browser-results.json](browser-results.json)
- 旧V2.2调试对照与Git基线的相机/灯光完全一致；跨上下文像素均值差分别为${browser.legacyComparison.map(r=>r.difference.mean.toFixed(6)).join(' / ')}，最大通道差不超过2/255。源码及旧资源精确保留，不声称所有视口逐像素完全相同。
- 同机位原3D/新Hybrid深度最大差${browser.depth.maxDifference}，容差${browser.depth.tolerance}设计单位；31个连续融合采样及真实正反向录像检查，没有新增代理屋顶或结构遮挡覆盖。[adjacent-states.json](adjacent-states.json)
- 503故障回退与重试、延迟素材等待、V1原候选及真实壁画展开通过。正常运行错误0；仅保留既有ANGLE X3595警告。
- 正式A01–A08分别实际运行；文案/素材/布局一致，2px低频结构差通过，原始栅格差全部保留。本次是两运行上下文回归，并由构建检查证明正式源码与933a353未改。[formal-results.json](formal-results.json)
- 录像实际1440×900浏览器视口，普通动态，${motion.duration.toFixed(2)}秒；完整Blob解码后检查正反向，帧差${motion.decodedFrameMeanDifferences.map(f).join(' / ')}，SHA256 \`${motion.sha256}\`。[motion-evidence.json](motion-evidence.json)。录像负载与无录像性能分开。

## 精选清单

| 文件 | 内容 | 字节 |
|---|---|---:|
${inventory.map(r=>'| ['+r.file+']('+r.file+') | '+({'01-original-v22.png':'原V2.2，同一终点机位','02-wall-detail.png':'新墙面裁切','03-wood-detail.png':'原木构/檐下裁切','04-floor-detail.png':'地面裁切','05-lighting-before-after.webp':'同机位旧/新材质与光影组合对比','06-new-hybrid.png':'新终点画面','06-hybrid-50.png':'同终点50%融合','07-three-way-comparison.webp':'原3D/旧Hybrid/新Hybrid','08-transition.webm':'实际正向、反向浏览器录像','hybrid-same-camera.png':'新终点同机位完整画面'}[path.basename(r.file)]??'浏览器画面')+' | '+r.bytes+' |').join('\n')}

精选${inventory.length}件，共${inventory.reduce((n,r)=>n+r.bytes,0)}字节。截图来自实际浏览器；三张细节是明确裁切，对照板仅缩放排列及标注。完整三视口/连续帧/回归和解码抽帧留local，不提交，不删除历史证据。

## 文件范围与使用

修改：本目录相关验收；独立展厅index.html、README.md、src/corridor-layers.mjs、entry-main.mjs、entry.css。
新增：src/corridor-finish.mjs、corridor-layers-v22.mjs（旧代码原样保留）、assets/hybrid-v2-2-1/PROVENANCE.md、tests/finish.test.mjs、scripts/refine-{build,browser,formal,edge,cache,performance,record,report}.cjs。
保留：正式A01–A08、B、原GLB、原壁画与锚点、V2.1完整入门/右转轨道、V1候选、V2.2所有素材和历史验收。工作区原有B资料、归档脚本等未提交修改不进入本轮提交。

本地启动：\`$env:A01_PORT='4186'; node module-a/a01/server.mjs\`，打开 [预览](http://127.0.0.1:4186/module-a/immersive-hybrid-v1/)。可加?debug，调试选择三种画面。继续功能分支，提交后push并读取远程SHA核实；具体最终SHA以本次Git交付元数据为准，不写入自身形成循环。

## 尚待审图与限制

墙面/地面/暗部精修、渐进融合、首次使用前置及工程验证已完成。视觉整体仍为候选；原模型屋面下表面的细碎纹理可见，已降低增亮，未改几何或伪造梁架掩盖。没有证明所有设备无卡顿；物理屏幕/弱GPU和用户最终动态审图未完成。程序旧化和空气属于设计表达。第一幅新交互、其余壁画展厅和新增历史解释均未开发。
`;
 fs.writeFileSync(path.join(out,'README.md'),text.replaceAll('\`','`').replaceAll('\\n','\n'));
 console.log('PASS reports and inventory',inventory.length,inventory.reduce((n,r)=>n+r.bytes,0));
})().catch(e=>{console.error(e);process.exitCode=1;});
