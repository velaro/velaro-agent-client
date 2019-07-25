import * as electron from "electron";

const notifications: any[] | Notification[] = [];
const NOTIFICATION_HEIGHT = 120;
const NOTIFICATION_WIDTH = 440;
const NOTIFICATION_MARGIN = 10;

let workAreaSize: electron.Size;

electron.app.on("ready", () => {
  workAreaSize = electron.screen.getPrimaryDisplay().workAreaSize;
});

interface Opts {
  message: any;
  engagementId: any;
  queueStart: any;
  queueIncomingRequests: any;
  isNewLineNotification: any;
  autoHide: boolean;
  autoHideDelay: number;
  buttons: any[];
}

class Notification {
  public id: number;
  public createdAt: number;
  public autoHide: boolean;
  public message: any;
  public engagementId: any;
  public queueStart: any;
  public queueIncomingRequests: any;
  public isNewLineNotification: any;
  public autoHideDelay: number;
  public buttons: any[];
  public notificationWindow: any;

  constructor(opts: Opts) {
    this.id = Date.now();
    this.createdAt = Date.now();
    this.autoHide = false;
    this.message = opts.message;
    this.engagementId = opts.engagementId;
    this.queueStart = opts.queueStart;
    this.queueIncomingRequests = opts.queueIncomingRequests;
    this.isNewLineNotification = opts.isNewLineNotification;

    if (opts.autoHide !== undefined) {
      this.autoHide = opts.autoHide;
    }

    this.autoHideDelay = opts.autoHideDelay || 10000;
    this.buttons = opts.buttons || [];
  }

  public isExpired() {
    if (this.autoHide === false) {
      return false;
    }

    return this.createdAt + this.autoHideDelay < Date.now();
  }
}

/**
 * reposition all notifications
 */
const repositionAll = () => {
  notifications.forEach(setPosition);
};

/**
 * Sets the position of a single notification depending on it's
 * order in the notifications array. Notifications are stacked
 * bottom to top.
 */
const setPosition = (notification: Notification) => {
  const index = notifications.indexOf(notification);
  const yOffset = (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN) * (index + 1);

  const x = notification.notificationWindow.getPosition()[0];
  const y = workAreaSize.height - yOffset;

  notification.notificationWindow.setPosition(x, y);
};

const show = (notification: Notification, yOffset: number) => {
  const notificationWindow = new electron.BrowserWindow({
    width: NOTIFICATION_WIDTH,
    height: NOTIFICATION_HEIGHT,
    x: workAreaSize.width - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN,
    y: workAreaSize.height - yOffset,
    frame: false,
    // setting transparent to true seems to cause issues in windows 7
    // https://github.com/electron/electron/issues/2170
    transparent: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    titleBarStyle: "hidden",
    show: false,
    resizable: false
  });

  notification.notificationWindow = notificationWindow;

  notificationWindow.loadURL(
    "file://" + __dirname + "/assets/notification.html"
  );

  notificationWindow.webContents.on("did-finish-load", () => {
    notificationWindow.showInactive();
    notificationWindow.webContents.send("notification-props", { notification });
  });

  // notificationWindow.webContents.openDevTools()
};

/**
 * Display a new notification
 */
const notify = (opts: Opts) => {
  const notification = new Notification(opts);

  notifications.push(notification);
  const yOffset =
    (NOTIFICATION_HEIGHT + NOTIFICATION_MARGIN) * notifications.length;

  show(notification, yOffset);
  return notification;
};

/**
 * Removes all notification windows
 */
const removeAll = () => {
  notifications.forEach(remove);
};

/**
 * Remove a single notification
 */
const remove = (notification: Notification) => {
  notification.notificationWindow.close();
  notification.notificationWindow = null;
  const index = notifications.indexOf(notification);
  notifications.splice(index, 1);
};

/**
 * Called on an interval, removes all expired notifications.
 */
const removeExpiredNotifications = () => {
  notifications.forEach((notification: Notification) => {
    if (notification.isExpired()) {
      remove(notification);
      repositionAll();
    }
  });
};

setInterval(removeExpiredNotifications, 1000);

/**
 * Listen for the remove notification event. This is called from the
 * notification UI, typically when the user clicks a button such assets
 * Reject, Accept, Ignore, etc.
 */
electron.ipcMain.on("removeNotification", (e: any, args: { id: any; }) => {
  const notificationId = args.id;

  const notification = notifications.find((notification: Notification) => {
    return notification.id === notificationId;
  });

  if (!notification) {
    return;
  }

  remove(notification);
});

electron.ipcMain.on("removeNotificationByEngagementId", (e: any, args: { engagementId: string; }) => {
  const engagementId = args.engagementId;

  const notification = notifications.find((notification: Notification) => {
    return notification.engagementId === engagementId;
  });

  if (!notification) {
    return;
  }

  remove(notification);
});

module.exports = {
  notify,
  removeAllNotifications: removeAll
};
