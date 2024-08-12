"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Native
const path_1 = require("path");
const url_1 = require("url");
// Packages
const electron_1 = require("electron");
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
const electron_next_1 = __importDefault(require("electron-next"));
//Updater
const electron_log_1 = __importDefault(require("electron-log"));
const electron_updater_1 = require("electron-updater");
//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
electron_log_1.default.transports.file.level = 'info';
electron_updater_1.autoUpdater.logger = electron_log_1.default;
electron_log_1.default.info('App starting...');
//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = [];
if (process.platform === 'darwin') {
    // OS X
    const name = electron_1.app.getName();
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
                click() { electron_1.app.quit(); }
            },
        ]
    });
}
let win;
function sendStatusToWindow(text) {
    electron_log_1.default.info(text);
    if (win) {
        win.webContents.send('message', text);
    }
}
function createDefaultWindow() {
    win = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, "preload.js"),
        }
    });
    // win.webContents.openDevTools();
    win.on('closed', () => {
        win = null;
    });
    // win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
    const url = electron_is_dev_1.default
        ? "http://localhost:8000/"
        : (0, url_1.format)({
            pathname: (0, path_1.join)(__dirname, "../renderer/out/index.html"),
            protocol: "file:",
            slashes: true,
        });
    win.loadURL(url);
    return win;
}
electron_updater_1.autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
});
electron_updater_1.autoUpdater.on('update-available', (info) => {
    console.log("update-available : " + info);
    sendStatusToWindow('Update available.');
});
electron_updater_1.autoUpdater.on('update-not-available', (info) => {
    console.log("update-not-available : " + info);
    sendStatusToWindow('Update not available.');
});
electron_updater_1.autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
});
electron_updater_1.autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
});
electron_updater_1.autoUpdater.on('update-downloaded', (info) => {
    console.log("update-downloaded : " + info);
    sendStatusToWindow('Update downloaded');
});
// Prepare the renderer once the app is ready
electron_1.app.on("ready", async () => {
    await (0, electron_next_1.default)("./renderer");
    // Create the Menu
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
    createDefaultWindow();
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
});
// Quit the app once all windows are closed
electron_1.app.on("window-all-closed", electron_1.app.quit);
// listen the channel `message` and resend the received message to the renderer process
electron_1.ipcMain.on("message", (event, message) => {
    console.log(message);
    setTimeout(() => event.sender.send("message", "hi from electron"), 500);
});
