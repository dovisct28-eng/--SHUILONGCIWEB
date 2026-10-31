@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
node "module-a\a01\launch.cjs"
if errorlevel 1 (
  echo Module A failed to start. See the message above.
  pause
  exit /b 1
)
endlocal
