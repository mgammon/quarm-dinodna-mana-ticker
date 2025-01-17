import { ZealPipe } from "./zeal/zeal-pipes";

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld("zeal", {
    onZealPipes: (onZealPipes: (cb: (pipes: ZealPipe[]) => void) => void) => ipcRenderer.on("on-zeal-pipes", (_event, cb) => onZealPipes(cb)),
});