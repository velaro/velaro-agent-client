import * as electron from "electron";
import * as log from "electron-log";

const notifications: any[] | Notification[] = [];
const NOTIFICATION_WIDTH = 280;
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
  public notificationWindow: electron.BrowserWindow;
  public height: number = 0;

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
function repositionAll() {
  notifications.forEach(setPosition);
}

/**
 * Sets the position of a single notification depending on its
 * order in the notifications array. Notifications are stacked
 * bottom to top.
 */
const setPosition = (notification: Notification) => {
  const index = notifications.indexOf(notification);
  const yOffset = (notification.height + NOTIFICATION_MARGIN) * (index + 1);
  const x = notification.notificationWindow.getPosition()[0];
  const y = workAreaSize.height - yOffset;
  notification.notificationWindow.setPosition(x, y);
};

const show = (notification: Notification) => {
  const notificationWindow = new electron.BrowserWindow({
    width: NOTIFICATION_WIDTH,
    height: notification.height,
    x: workAreaSize.width - NOTIFICATION_WIDTH - NOTIFICATION_MARGIN,

    // Initially position the notification off the screen. Once we know
    // the height of the notification, we'll set its position.
    y: -10000,

    // setting transparent to true seems to cause issues in windows 7
    // https://github.com/electron/electron/issues/2170
    transparent: false,

    frame: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    titleBarStyle: "hidden",
    show: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (process.platform === "darwin") {
    notificationWindow.setWindowButtonVisibility(false);
  }

  notification.notificationWindow = notificationWindow;

  notificationWindow.loadURL(
    "file://" + __dirname + "/assets/notification.html"
  );

  notificationWindow.webContents.on("did-finish-load", () => {
    notificationWindow.showInactive();

    notificationWindow.webContents.send("notification-props", {
      notification: {
        id: notification.id,
        message: notification.message,
        engagementId: notification.engagementId,
        queueStart: notification.queueStart,
        queueIncomingRequests: notification.queueIncomingRequests,
        isNewLineNotification: notification.isNewLineNotification,
      },
    });
  });

  // notificationWindow.webContents.openDevTools();
};

/**
 * Display a new notification
 */
export function notify(opts: Opts) {
  log.info("show notification", opts);
  const notification = new Notification(opts);
  notifications.push(notification);
  show(notification);
  return notification;
}

/**
 * Removes all notification windows
 */
export function removeAllNotifications() {
  notifications.forEach(remove);
}

function getNotification(id: number): Notification {
  return notifications.find((notification: Notification) => {
    return notification.id === id;
  });
}

/**
 * Remove a single notification
 */
const remove = (notification: Notification) => {
  notification.notificationWindow.close();
  notification.notificationWindow = null;
  const index = notifications.indexOf(notification);
  notifications.splice(index, 1);
  repositionAll();
};

/**
 * Called on an interval, removes all expired notifications.
 */
const removeExpiredNotifications = () => {
  notifications.forEach((notification: Notification) => {
    if (notification.isExpired()) {
      remove(notification);
      log.info("notification expired", notification);
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
electron.ipcMain.on("removeNotification", (e: any, args: { id: any }) => {
  const notification = getNotification(args.id);

  if (!notification) {
    return;
  }

  remove(notification);
});

electron.ipcMain.on(
  "removeNotificationByEngagementId",
  (e: any, args: { engagementId: string }) => {
    const engagementId = args.engagementId;

    const notification = notifications.find((notification: Notification) => {
      return notification.engagementId === engagementId;
    });

    if (!notification) {
      return;
    }

    remove(notification);
  }
);

/**
 * When rendering is complete, we'll receive the height of the notification.
 * We'll use this to set the height of the BrowserWindow and then reposition
 * all notifications.
 */
electron.ipcMain.on(
  "renderComplete",
  (event: any, props: { notificationId: number; scrollHeight: number }) => {
    const notification = getNotification(props.notificationId);

    if (!notification) {
      return;
    }

    notification.height = props.scrollHeight;

    notification.notificationWindow.setSize(
      NOTIFICATION_WIDTH,
      props.scrollHeight
    );

    repositionAll();
  }
);
