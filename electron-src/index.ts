// Native
import { join } from "path";
import { format } from "url";

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, Menu } from "electron";
import isDev from "electron-is-dev";
import prepareNext from "electron-next";

//Updater
import log from 'electron-log';
import { autoUpdater } from "electron-updater";

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
log.transports.file.level = 'info';
autoUpdater.logger = log;
log.info('App starting...');

//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template: Electron.MenuItemConstructorOptions[] = []
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}

let win: BrowserWindow | null;

function sendStatusToWindow(text: string) {
  log.info(text);
  if (win) {
    win.webContents.send('message', text);
  }
}

function createDefaultWindow(): BrowserWindow {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: join(__dirname, "preload.js"),
    }
  });
  // win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  // win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  const url = isDev
    ? "http://localhost:8000/"
    : format({
      pathname: join(__dirname, "../renderer/out/index.html"),
      protocol: "file:",
      slashes: true,
    });

  win.loadURL(url);
  return win;
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  console.log("update-available : " + info);
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  console.log("update-not-available : " + info);
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  console.log("update-downloaded : " + info);

  sendStatusToWindow('Update downloaded');
});

// Prepare the renderer once the app is ready
app.on("ready", async () => {
  await prepareNext("./renderer");

  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createDefaultWindow();
  autoUpdater.checkForUpdatesAndNotify();
});

// Quit the app once all windows are closed
app.on("window-all-closed", app.quit);

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on("message", (event: IpcMainEvent, message: any) => {
  console.log(message);
  setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});
