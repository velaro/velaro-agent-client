@echo off
setlocal

:: Enable auto updates
copy src\updateConfig.enabled.json src\updateConfig.json

electron-builder --win nsis --x64 --ia32

endlocal
exit /b %errorlevel%
