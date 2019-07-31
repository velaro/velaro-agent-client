import * as log from "electron-log";
import { autoUpdater } from "electron-updater";

let initialized = false;

export function initUpdater() {
  if (initialized) {
    return;
  }

  initialized = true;
  log.transports.file.level = "debug";
  autoUpdater.logger = log;

  // just check once at startup for now.
  autoUpdater.checkForUpdatesAndNotify();
}

// autoUpdater.on("error", () => {
// });

// autoUpdater.on("checking-for-update", args => {
// });

// autoUpdater.on("update-not-available", args => {
// });

// autoUpdater.on("download-progress", args => {
// });

// autoUpdater.on("update-downloaded", args => {
// });
