#!/usr/bin/env bash

# Disable auto updates
cp src/updateConfig.disabled.json src/updateConfig.json

electron-builder --mac zip
