@echo off
setlocal
:: Run from the project root so relative paths stay stable.
cd /d "%~dp0"

set "PORT=4173"
set "URL=http://127.0.0.1:%PORT%/module-a/a01/?debug"

:: Start the Module A local server in a separate window.
start "Module A prototype server" cmd /k "node module-a\a01\server.mjs"

:: Allow Node a moment to start, then open the browser.
ping 127.0.0.1 -n 3 >nul
start "" "%URL%"

echo Module A prototype started: %URL%
echo Close the server window to stop the prototype.
endlocal
