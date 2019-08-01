#!/usr/bin/env bash

# Enable auto updates
cp src/updateConfig.disabled.json src/updateConfig.json

# Build and copy
yarn build

# Publish artifacts
electron-builder --mac dmg
