import { app, BrowserWindow } from 'electron';
import path from 'path';
import { configStore } from './store';
import ZealPipeReader from './zeal/zeal-pipe-reader';
import { updateElectronApp } from 'update-electron-app';

export const bugsnag = require('@bugsnag/electron/main');

bugsnag.start({
  apiKey: 'c5c20ef5037379620c309d3650064d0b',
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

class App {
  private mainWindow: BrowserWindow;
  private config = configStore.load();
  constructor() {
    this.createManaTickWindow();
    new ZealPipeReader([this.mainWindow]);
  }

  private createManaTickWindow() {
    this.mainWindow = new BrowserWindow({
      width: this.config.manaTicker.width,
      height: this.config.manaTicker.height,
      x: this.config.manaTicker.x || undefined,
      y: this.config.manaTicker.y || undefined,
      frame: false,
      transparent: true,
      autoHideMenuBar: true,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    const url = app.isPackaged
      ? `file://${path.join(
          __dirname,
          'dinodna-widgets',
          'browser',
          'index.html'
        )}`
      : `http://localhost:4200`;
    this.mainWindow.loadURL(url);
    this.mainWindow.setAlwaysOnTop(true, 'screen-saver');

    // Open the DevTools.
    // this.mainWindow.webContents.openDevTools();
    // this.mainWindow.setSize(800, 800);

    // Listeners
    this.mainWindow.on('move', () => {
      const [x, y] = this.mainWindow.getPosition();
      this.config.manaTicker.x = x;
      this.config.manaTicker.y = y;
      configStore.save(this.config);
    });
    this.mainWindow.on('resize', () => {
      const [width, height] = this.mainWindow.getSize();
      this.config.manaTicker.width = width;
      this.config.manaTicker.height = height;
      configStore.save(this.config);
    });
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

app.on('ready', () => new App());

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
    new App();
  }
});

// Update the app, but don't pop up a notification to restart, I'm not trying to get anyone killed
updateElectronApp({ notifyUser: false });
