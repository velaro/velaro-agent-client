import { ipcRenderer } from "electron";
import { createBadgeData } from "./badge";

let ON_ACCEPT: any;
let ON_REJECT: any;
let ON_IGNORE: any;
let ON_INFO: any;
let ON_VIEW: any;
let manuallySetUnavailabe = false;

ipcRenderer.send("push-sender");

(window as any).desktop = {
  /**
   * Has nothing to do with the version in package.json. See
   * comments in desktop-version.js in Client.ConsoleNew project
   * to understand how to use this version to force users to
   * update their desktop client.
   */
  getDesktopVersion() {
    // make sure this stays in sync with the value of
    // `webVersion` or bad things will happen.
    return 2;
  },

  notify(options: any) {
    ipcRenderer.send("desktop-notify", options);
  },

  removeNotification(engagementId: string) {
    ipcRenderer.send("removeNotificationByEngagementId", { engagementId });
  },

  updateTrayIcon(isLoggedIn: boolean) {
    ipcRenderer.send("update-tray-icon", isLoggedIn);
  },

  onChangeAvailability(available: boolean) {
    ipcRenderer.send("update-tray-availability", available);
  },

  onAccept(callback: any) {
    ON_ACCEPT = callback;
  },

  onView(callback: any) {
    ON_VIEW = callback;
  },

  onReject(callback: any) {
    ON_REJECT = callback;
  },

  onIgnore(callback: any) {
    ON_IGNORE = callback;
  },

  onInfo(callback: any) {
    ON_INFO = callback;
  },

  openExternalLink(url: string) {
    ipcRenderer.send("open-external-link", url);
  },

  missedMessage(count: number) {
    const text = count.toString();
    const badgeData = createBadgeData(text);
    ipcRenderer.send("set-flash-frame", true);
    ipcRenderer.send("set-badge", { badgeData, text });
  },

  clearMissedMessages() {
    ipcRenderer.send("set-flash-frame", false);
    ipcRenderer.send("set-badge", null);
  }
};

ipcRenderer.removeAllListeners("idle");

ipcRenderer.on("idle", () => {
  if (!(window as any).App || !(window as any).App.user) {
    return;
  }

  if ((window as any).App.user.get("Available") === false) {
    manuallySetUnavailabe = true;
    return;
  } else {
    manuallySetUnavailabe = false;
  }

  (window as any).App.user.set("Available", false);
  (window as any).App.user.changeAvailability();
});

ipcRenderer.removeAllListeners("active");

ipcRenderer.on("active", () => {
  if (!(window as any).App || !(window as any).App.user) {
    return;
  }

  if (manuallySetUnavailabe) {
    return;
  }

  (window as any).App.user.set("Available", true);
  (window as any).App.user.changeAvailability();
});

ipcRenderer.on("accept", (event: any, args: any) => {
  ON_ACCEPT(args);
});

ipcRenderer.on("view", (event: any, args: any) => {
  ON_VIEW(args);
});

ipcRenderer.on("reject", (event: any, args: any) => {
  ON_REJECT(args);
});

ipcRenderer.on("ignore", (event: any, args: any) => {
  ON_IGNORE(args);
});

ipcRenderer.on("info", (event: any, args: any) => {
  ON_INFO(args);
});
