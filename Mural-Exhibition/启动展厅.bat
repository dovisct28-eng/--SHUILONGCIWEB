@echo off
:: 强制将工作目录切换到当前 .bat 文件所在的文件夹，防止路径错乱
cd /d "%~dp0"

:: 使用展厅端口；启动器会复用当前版本的已有服务
set "PORT=3002"
node start-exhibition.cjs

:: 如果出错或结束，暂停窗口，等待按键才关闭
pause
