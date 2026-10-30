@echo off
chcp 65001 >nul
pushd "%~dp0"
node preview.cjs
if errorlevel 1 pause
popd
