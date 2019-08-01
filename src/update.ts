import * as log from "electron-log";
import { autoUpdater } from "electron-updater";
import * as storage from "./storage";
import * as config from "./updateConfig.json";

let updateDownloaded = false;
let initialized = false;

const settings = storage.get("settings") || {};

function updatesEnabled() {
  // NSIS and DMG are the only targets compatible with auto updates.
  // Portable (zip) versions of the application will have auto updates
  // disabled by our build process. Electron builder doesn't give a nice
  // way to detect or pass target as a parameter so our build scripts
  // copy updateConfig.enabled.json or updateConfig.disabled.json to
  // updateConfig.json depending on what is being built.
  if (config.enabled === false) {
    log.info("config.enabled is false");
    return false;
  }

  if (settings.autoUpdatesEnabled === false) {
    log.info("settings.autoUpdatesEnabled is false");
    return false;
  }

  if (process.env.VELARO_AUTO_UPDATE === "false") {
    log.info("env VELARO_AUTO_UPDATE is false");
    return false;
  }

  return true;
}

export function initUpdater() {
  if (!updatesEnabled()) {
    return;
  }

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
