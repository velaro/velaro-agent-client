import { ipcRenderer } from "electron";
import * as $ from "jquery";
import config from "../config";

const settings = ipcRenderer.sendSync("get-settings") || {};
const version = ipcRenderer.sendSync("get-version") || {};
const $idleSeconds = $("#idleSeconds");
const $idleTimeEnabled = $("#idleTimeEnabled");
const $autoUpdatesEnabled = $("#autoUpdatesEnabled");

if (settings.autoUpdatesEnabled === undefined) {
  settings.autoUpdatesEnabled = true;
}

$idleSeconds.val(settings.idleSeconds || 300);

if (settings.idleTimeEnabled !== false) {
  $idleTimeEnabled.attr("checked", "checked");
} else {
  $idleSeconds.prop("disabled", true);
}

if (settings.autoUpdatesEnabled) {
  $autoUpdatesEnabled.attr("checked", "checked");
}

$idleTimeEnabled.off("click");

$idleTimeEnabled.on("click", (e: any) => {
  $idleSeconds.prop("disabled", !$idleTimeEnabled.prop("checked"));
});

$("form").on("submit", (e: any) => {
  e.preventDefault();
  settings.idleSeconds = Number(e.target.idleSeconds.value);
  settings.idleTimeEnabled = Boolean(e.target.idleTimeEnabled.checked);
  settings.autoUpdatesEnabled = Boolean(e.target.autoUpdatesEnabled.checked);
  ipcRenderer.sendSync("save-settings", settings);
  window.close();
});

$("#version").text(version);
$("#endpoint").text(config.consoleUrl);
