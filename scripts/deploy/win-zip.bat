@echo off
setlocal

:: Disable auto updates
copy src\updateConfig.disabled.json src\updateConfig.json

electron-builder --win zip --x64 --ia32

endlocal
exit /b %errorlevel%
