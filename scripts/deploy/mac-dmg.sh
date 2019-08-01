#!/usr/bin/env bash

# Enable auto updates
cp src/updateConfig.disabled.json src/updateConfig.json

electron-builder --mac dmg
