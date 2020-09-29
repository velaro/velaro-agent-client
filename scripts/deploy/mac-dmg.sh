#!/usr/bin/env bash

# Enable auto updates
cp src/updateConfig.enabled.json src/updateConfig.json

# Build and copy
yarn build

# Publish artifacts
electron-builder --mac dmg
