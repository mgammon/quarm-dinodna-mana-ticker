import { app, BrowserWindow } from 'electron';
import path from 'path';
import ZealPipeReader from './zeal/zeal-pipe-reader';
// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = (): void => {
  const manaTickWindow = new BrowserWindow({
    width: 200,
    height: 24,
    frame: false,
    transparent: true,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    },
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    icon: path.join(__dirname, "dino-icon.ico"),
  });
  manaTickWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  manaTickWindow.setAlwaysOnTop(true, "screen-saver");
  new ZealPipeReader([manaTickWindow]);

  // Open the DevTools.
  // manaTickWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});