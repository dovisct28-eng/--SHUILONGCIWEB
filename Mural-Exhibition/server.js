// 引入必需的 Node.js 模块
const express = require('express');
const fs = require('fs');
const path = require('path');

// 初始化 Express 应用
const app = express();
// 设置本地服务器的端口号
const PORT = 3000;

// ==========================================
//  0. 模块 A：水龙祠叙事引导页（项目入口）
//  注意：必须注册在 express.static 之前，
//  否则静态中间件会默认把 / 指向 index.html。
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// 告诉 Express 将 'public' 文件夹作为静态资源目录
app.use(express.static('public'));


// ==========================================
//  1. 页面路由：快捷访问移动端叙事长卷
// ==========================================
app.get('/m', (req, res) => {
    // 当访问 http://localhost:3000/m 时，正确返回手机端网页
    res.sendFile(path.join(__dirname, 'public', 'gallery.html'));
});


// ==========================================
//  2. 数据接口：动态扫描本地壁画数据资产
// ==========================================
app.get('/api/scan-assets', (req, res) => {
    // 定义 assets 文件夹的完整路径
    const assetsDirectory = path.join(__dirname, 'public', 'assets');
    const seriesList = [];

    try {
        // 1. 判断 assets 目录是否存在
        if (!fs.existsSync(assetsDirectory)) {
            return res.json({
                success: true,
                data: [] // 如果文件夹不存在，优雅返回空数组，不让系统崩溃
            });
        }

        // 2. 读取 assets 目录下的所有文件和文件夹名称
        const items = fs.readdirSync(assetsDirectory);

        // 3. 遍历每一个项目
        items.forEach(item => {
            const itemPath = path.join(assetsDirectory, item);

            // 4. 判断当前项目是不是一个“文件夹”
            if (fs.statSync(itemPath).isDirectory()) {
                // 如果是文件夹，说明这是一个“壁画系列”
                seriesList.push({
                    folderName: item,                       // 文件夹名称，例如 "01_南门何五猖"
                    orgPath: `/assets/${item}/org.png`,     // 原图路径
                    linePath: `/assets/${item}/line.png`,   // 线稿路径
                    colorPath: `/assets/${item}/color.png`, // 上色路径
                    infoPath: `/assets/${item}/info.txt`    // 文本路径
                });
            }
        });

        // 5. 按文件夹名称字母顺序排序，确保画幅顺序不乱
        seriesList.sort((a, b) => a.folderName.localeCompare(b.folderName));

        // 6. 将扫描成功的数据以 JSON 格式发送给前端
        res.json({
            success: true,
            data: seriesList
        });

    } catch (error) {
        console.error("扫描文件夹失败:", error);
        res.status(500).json({
            success: false,
            message: "读取文件夹失败，请检查 public/assets 目录。"
        });
    }
});


// 启动服务器
app.listen(PORT, () => {
    console.log('==================================================');
    console.log(`  水龙祠全息展厅后台服务已成功启动！`);
    console.log(`  👉 模块 A 叙事引导: http://localhost:${PORT}/`);
    console.log(`  👉 模块 B 展厅大屏体感版 (WebGL): http://localhost:${PORT}/index.html`);
    console.log(`  👉 移动端叙事长卷版 (VNG): http://localhost:${PORT}/m`);
    console.log('  温馨提示: 按 Ctrl+C 可以关闭本地服务');
    console.log('==================================================');
});
