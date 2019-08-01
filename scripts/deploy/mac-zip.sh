#!/usr/bin/env bash

# Disable auto updates
cp src/updateConfig.disabled.json src/updateConfig.json

# Build and copy
yarn build

# Publish artifacts
electron-builder --mac zip
