@echo off

:: Enable auto updates
copy src\updateConfig.enabled.json src\updateConfig.json

:: Build and copy
call yarn build

:: Publish artifacts
call electron-builder --win nsis --x64 --ia32
