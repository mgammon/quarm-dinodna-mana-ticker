import fs from 'fs';
import path from 'path';

import { app } from 'electron';
import { bugsnag } from '.';

export interface Config {
  manaTicker: {
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
}

const defaultConfig: Config = {
  manaTicker: {
    width: 200,
    height: 24,
  },
};

export class ConfigStore {
  private configFilePath: string;
  private saveTimeout: NodeJS.Timeout;

  private errorCount = 0;

  constructor() {
    this.configFilePath = path.join(app.getPath('userData'), 'app-config.json');
  }

  load() {
    try {
      // No config file, so use defaults
      if (!fs.existsSync(this.configFilePath)) {
        return defaultConfig;
      }

      // Load the file
      return JSON.parse(
        fs.readFileSync(this.configFilePath).toString()
      ) as Config;
    } catch (ex) {
      this.errorCount++;
      if (this.errorCount <= 5) {
        bugsnag.notify(ex);
      }
      return defaultConfig;
    }
  }

  save(config: Config) {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2));
      } catch (ex) {
        this.errorCount++;
        if (this.errorCount <= 5) {
          bugsnag.notify(ex);
        }
      }
    }, 1000);
  }
}

export const configStore = new ConfigStore();
