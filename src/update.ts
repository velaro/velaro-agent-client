import * as log from "electron-log";
import { autoUpdater } from "electron-updater";

let updateDownloaded = false;
let initialized = false;

export function initUpdater() {
  if (initialized) {
    return;
  }

  initialized = true;
  log.transports.file.level = "debug";
  autoUpdater.logger = log;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.checkForUpdatesAndNotify();
}

export function quitAndUpdate() {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall();
  }
}

// autoUpdater.on("error", () => {
// });

// autoUpdater.on("checking-for-update", args => {
// });

// autoUpdater.on("update-not-available", args => {
// });

// autoUpdater.on("download-progress", args => {
// });

autoUpdater.on("update-downloaded", () => {
  updateDownloaded = true;
});
