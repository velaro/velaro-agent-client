import * as path from "path";

import {
  app,
  session,
  BrowserWindow,
  ipcMain,
  Menu,
  MenuItem,
  nativeImage,
  shell,
  Tray,
} from "electron";

import * as log from "electron-log";
import config from "./config";
import Idle from "./idle";
import { notify, removeAllNotifications } from "./notifier";
import * as resources from "./resources";
import * as storage from "./storage";
import { initUpdater } from "./update";
import { isDev, parseQueryString } from "./utils";

interface MenuOption {
  label: string;
  accelerator?: string;
  click(): void;
}

const CLIENT_PROTOCOL = "velaro-lc";

app.commandLine.appendSwitch("--autoplay-policy", "no-user-gesture-required");
app.setAppUserModelId("com.velaro.chat");

// remove so we can register each time as we run the app.
app.removeAsDefaultProtocolClient(CLIENT_PROTOCOL);

// If we are running a non-packaged version of the app && on windows
if (isDev() && process.platform === "win32") {
  // Set the path of electron.exe and your app.
  // These two additional parameters are only available on windows.
  app.setAsDefaultProtocolClient(CLIENT_PROTOCOL, process.execPath, [
    path.resolve(process.argv[1]),
  ]);
} else {
  app.setAsDefaultProtocolClient(CLIENT_PROTOCOL);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow;
let settingsWindow: BrowserWindow;
let childWindows: any[] | BrowserWindow[] = [];
let appIcon: Tray = null;
let idle: Idle;

const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";

function createWindow() {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: [`${config.consoleUrl}/*`],
    },
    (details, callback) => {
      details.requestHeaders["Client-Protocol"] = CLIENT_PROTOCOL;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  mainWindow = new BrowserWindow({
    title: "Velaro",
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.session.clearCache();

  // context menu spellcheck suggestions

  mainWindow.webContents.on("context-menu", (event, params) => {
    const menu = new Menu();

    // Add each spelling suggestion
    for (const suggestion of params.dictionarySuggestions) {
      menu.append(
        new MenuItem({
          label: suggestion,
          click: () => mainWindow.webContents.replaceMisspelling(suggestion),
        })
      );
    }

    // Allow users to add the misspelled word to the dictionary
    if (params.misspelledWord) {
      menu.append(
        new MenuItem({
          label: "Add to dictionary",
          click: () =>
            mainWindow.webContents.session.addWordToSpellCheckerDictionary(
              params.misspelledWord
            ),
        })
      );

      menu.append(
        new MenuItem({
          type: "separator",
        })
      );
    }

    menu.append(
      new MenuItem({
        id: "cut",
        label: "C&ut",
        role: "cut",
      })
    );

    menu.append(
      new MenuItem({
        id: "copy",
        label: "&Copy",
        role: "copy",
      })
    );

    menu.append(
      new MenuItem({
        id: "paste",
        label: "&Paste",
        role: "paste",
      })
    );

    menu.popup();
  });

  mainWindow.loadURL(`file://${__dirname}/views/splash.html`);

  setTimeout(() => {
    let url = config.consoleUrl;

    // on initial load, need to check protocol.

    const protocolLink = (process.argv || []).find(
      (x) => x.indexOf(`${CLIENT_PROTOCOL}://`) >= 0
    );

    if (isLoginLink(protocolLink)) {
      url = getDesktopExchangeUrl(protocolLink);
    }

    mainWindow.loadURL(url).catch(() => {
      mainWindow.loadURL(`file://${__dirname}/views/offline.html`);
    });
  }, 5000);

  mainWindow.on("close", (e) => {
    if (isWin && shouldExit === false) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  if (isDev()) {
    mainWindow.webContents.openDevTools();
  }

  let shouldExit = false;

  appIcon = new Tray(resources.getTrayIconPath());

  /**
   * The default window close functionality is set to minimize
   * the application. Call this method if you actually want to close it.
   */

  const exit = () => {
    shouldExit = true;
    app.quit();
  };

  const logout = () => {
    mainWindow.loadURL(`${config.consoleUrl}/account/logout`);
    appIcon.setContextMenu(getTrayMenu(false));
    appIcon.setImage(resources.getTrayIconPath());
    removeAllNotifications();
  };

  /**
   * The login button doesn't do much. It visually communicates to the
   * user that they are not currently logged in. In this scenario, the
   * app will already be on the login screen, so we just need to focus the window.
   */
  const login = () => {
    mainWindow.focus();
  };

  ipcMain.on("update-tray-icon", (event: any, isLoggedIn: boolean) => {
    appIcon.setContextMenu(getTrayMenu(isLoggedIn));

    if (!isLoggedIn) {
      appIcon.setImage(resources.getTrayIconPath());
    }
  });

  ipcMain.on("update-tray-availability", (event: any, available: boolean) => {
    if (available) {
      appIcon.setImage(resources.getTrayAvailableIconPath());
    } else {
      appIcon.setImage(resources.getTrayUnavailableIconPath());
    }
  });

  const getTrayMenu = (loggedIn?: boolean) => {
    // default the value to true. On initial load, if the user
    // is already logged in, nothing happens. If the user is
    // not logged in, the login screen will load and trigger a
    // method to set this value to false.
    loggedIn = loggedIn === undefined ? true : loggedIn;

    const options: MenuOption[] = [
      {
        label: "Exit",
        accelerator: "Alt+F4",
        click() {
          exit();
        },
      },
    ];

    const loginButton = {
      label: "Login",
      click() {
        login();
      },
    };

    const logoutButton = {
      label: "Logout",
      click() {
        logout();
      },
    };

    if (loggedIn) {
      options.push(logoutButton);
    } else {
      options.push(loginButton);
    }

    return Menu.buildFromTemplate(options);
  };

  appIcon.setToolTip("Velaro Live Chat");
  appIcon.setContextMenu(getTrayMenu());

  appIcon.on("click", () => {
    if (!mainWindow) {
      return;
    }

    mainWindow.show();
  });

  function openSettingsWindow() {
    if (settingsWindow) {
      settingsWindow.focus();
      return;
    }

    settingsWindow = new BrowserWindow({
      title: "Settings",
      height: 300,
      width: 400,
      webPreferences: {
        nodeIntegration: true,
      },
    });

    settingsWindow.on("closed", () => {
      settingsWindow = null;
    });

    settingsWindow.loadURL(`file://${__dirname}/views/settings.html`);

    childWindows.push(settingsWindow);

    if (isDev()) {
      settingsWindow.webContents.openDevTools();
    }
  }

  function buildMenu() {
    if (isWin) {
      return buildWinMenu();
    }

    if (isMac) {
      return buildMacMenu();
    }
  }

  function buildWinMenu() {
    return Menu.buildFromTemplate([
      {
        label: "File",
        submenu: [
          {
            label: "Settings",
            click() {
              openSettingsWindow();
            },
          },
          {
            label: "Exit",
            accelerator: "Alt+F4",
            click() {
              exit();
            },
          },
        ],
      },
      {
        role: "editMenu",
      },
      {
        role: "viewMenu",
      },
      {
        role: "windowMenu",
      },
    ]);
  }

  function buildMacMenu() {
    return Menu.buildFromTemplate([
      {
        label: app.getName(),
        submenu: [
          { role: "about" },
          { type: "separator" },
          {
            label: "Settings",
            click() {
              openSettingsWindow();
            },
          },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        role: "editMenu",
      },
      {
        role: "viewMenu",
      },
      {
        role: "windowMenu",
      },
    ]);
  }

  const menu = buildMenu();

  Menu.setApplicationMenu(menu);

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;

    settingsWindow = null;

    childWindows.forEach((win) => {
      try {
        win.close();
      } catch (err) {
        log.error(err);
      }
    });

    childWindows = [];
    removeAllNotifications();

    appIcon.destroy();
    appIcon = null;

    if (idle !== undefined) {
      idle.dispose();
    }
  });
}

let ipcInitialized = false;

function initApplication() {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on("second-instance", (event, commandLine) => {
    // User tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
    }

    const appLink = commandLine.find(
      (x) => x.indexOf(`${CLIENT_PROTOCOL}://`) >= 0
    );

    if (appLink) {
      handleAppLink(appLink);
    }
  });

  app.on("open-url", function (event, url) {
    event.preventDefault();
    handleAppLink(url);
  });

  function handleAppLink(loginLink: string) {
    if (isLoginLink(loginLink)) {
      if (!mainWindow) {
        createWindow();
      }

      const desktopExchangeUrl = getDesktopExchangeUrl(loginLink);
      mainWindow.loadURL(desktopExchangeUrl);
    }
  }

  const settings = storage.get("settings") || {};

  ipcMain.on("push-sender", (event: { sender: any }) => {
    if (ipcInitialized) {
      return;
    }

    ipcInitialized = true;

    idle = new Idle(settings.idleSeconds || 300); // default idle time is 5 minutes
    const sender = event.sender;

    idle.on("idle", () => {
      if (settings.idleTimeEnabled !== false) {
        sender.send("idle");
      }
    });

    idle.on("active", () => {
      if (settings.idleTimeEnabled !== false) {
        sender.send("active");
      }
    });

    ipcMain.on("desktop-notify", (event: any, options: any) => {
      notify(options);
    });
  });

  ipcMain.on("get-settings", (event: { returnValue: any }) => {
    event.returnValue = storage.get("settings");
  });

  ipcMain.on("get-version", (event: { returnValue: string }) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.on(
    "save-settings",
    (
      event: { returnValue: any },
      newSettings: { idleSeconds: any; idleTimeEnabled: any }
    ) => {
      storage.set("settings", newSettings);
      idle.seconds = newSettings.idleSeconds;
      settings.idleTimeEnabled = newSettings.idleTimeEnabled;
      event.returnValue = newSettings;
    }
  );

  ipcMain.on("open-external-link", (event: any, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.on(
    "set-badge",
    (event: any, data: { badgeData: string; text: string }) => {
      try {
        if (!data) {
          mainWindow.setOverlayIcon(null, "");
          return;
        }

        const img = nativeImage.createFromDataURL(data.badgeData);
        mainWindow.setOverlayIcon(img, data.text);
      } catch (err) {
        log.error(err);
      }
    }
  );

  ipcMain.on("set-flash-frame", (event: any, val: boolean) => {
    try {
      mainWindow.flashFrame(val);
    } catch (err) {
      log.error(err);
    }
  });

  ipcMain.on("acceptEngagement", (event: any, args: any) => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("accept", args);
  });

  ipcMain.on("rejectEngagement", (event: any, args: any) => {
    mainWindow.webContents.send("reject", args);
  });

  ipcMain.on("ignoreEngagement", (event: any, args: any) => {
    mainWindow.webContents.send("ignore", args);
  });

  ipcMain.on("viewEngagement", (event: any, args: any) => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("view", args);
  });

  ipcMain.on("viewInfo", (event: any, args: any) => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("info", args);
  });

  ipcMain.on("availabilityChanged", (event: any, args: any) => {
    log.debug("event:", event);
    log.debug("args:", args);
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on("ready", createWindow);

  // Quit when all windows are closed.
  app.on("window-all-closed", () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
      createWindow();
    }
  });
}

function isLoginLink(protocolLink: string | undefined) {
  return (
    protocolLink && protocolLink.indexOf(`${CLIENT_PROTOCOL}://login`) === 0
  );
}

function getDesktopExchangeUrl(loginLink: string) {
  const qs = loginLink.split("?");
  const data = parseQueryString(`?${qs[1]}`);
  return `${config.consoleUrl}/Account/LoginDesktopExchange?token=${data.token}`;
}

initApplication();
initUpdater();
