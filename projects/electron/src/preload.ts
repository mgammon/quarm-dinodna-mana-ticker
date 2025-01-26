import { ZealPipe } from './zeal/zeal-pipes';

import { contextBridge, ipcRenderer } from 'electron';

enum ContextEvents {
  ZealPipes = 'on-zeal-pipes',
}

contextBridge.exposeInMainWorld('zeal', {
  onZealPipes: (onZealPipes: (pipes: ZealPipe[]) => void) =>
    ipcRenderer.on(ContextEvents.ZealPipes, (_event, pipes) =>
      onZealPipes(pipes)
    ),
});
