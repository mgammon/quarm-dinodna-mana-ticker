import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ManaTickerComponent } from './app/mana-ticker/mana-ticker.component';

bootstrapApplication(ManaTickerComponent, appConfig).catch((err) =>
  console.error(err)
);
