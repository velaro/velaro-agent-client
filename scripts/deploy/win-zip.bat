@echo off

:: Disable auto updates
copy src\updateConfig.disabled.json src\updateConfig.json

:: Build and copy
call yarn build

:: Publish artifacts
call electron-builder --win zip --x64 --ia32
