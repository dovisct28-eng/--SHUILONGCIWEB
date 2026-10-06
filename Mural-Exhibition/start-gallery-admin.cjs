// Explicit local authoring switch. Ordinary npm start cannot write metadata.
process.env.GALLERY_ADMIN = '1';
const { createApp } = require('./server.js');
const port = Number(process.env.PORT || 3000);
createApp().listen(port, 'localhost', () => console.log(`本地标注管理已启用：http://localhost:${port}/index.html\n进入图鉴后点击右下角「标注管理」。`));
