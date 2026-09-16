@echo off
:: 强制将工作目录切换到当前 .bat 文件所在的文件夹，防止路径错乱
cd /d "%~dp0"

:: 启动服务
node server.js

:: 如果出错或结束，暂停窗口，等待按键才关闭
pause