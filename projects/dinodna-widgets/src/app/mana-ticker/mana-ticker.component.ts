import { Component, ErrorHandler, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelType, ZealPipe, zealWindow } from '../zeal-window';
import { NotifiableError } from '@bugsnag/js';

import Bugsnag from '@bugsnag/js';
import { BugsnagErrorHandler } from '@bugsnag/plugin-angular';

export const bugsnagClient = Bugsnag.start({
  apiKey: 'c5c20ef5037379620c309d3650064d0b',
});

export function errorHandlerFactory() {
  return new BugsnagErrorHandler(bugsnagClient);
}

@Component({
  selector: 'app-mana-ticker',
  imports: [CommonModule],
  templateUrl: './mana-ticker.component.html',
  styleUrl: './mana-ticker.component.scss',
  providers: [{ provide: ErrorHandler, useFactory: errorHandlerFactory }],
})
export class ManaTickerComponent {
  private levelOneCharacters = new Set<string>();

  private errorCount = 0;
  private lastMana = 0;
  private lastManaTickAt = Date.now();
  private manaTickInterval: any;
  private castDelay = 50;
  private lastCastStartedAt: number | undefined = undefined;
  private lastNotCastingAt: number | undefined = undefined;

  // I switched to angular, but I'm too lazy to change this
  manaTickFill!: HTMLElement;
  manaTickAmount!: HTMLElement;
  castingTickMark!: HTMLElement;

  constructor(ngZone: NgZone) {
    zealWindow.zeal.onZealPipes((pipes) => {
      ngZone.run(() => {
        try {
          pipes.forEach((pipe) => {
            if (pipe.type === 1) {
              this.handleLabelUpdates(pipe);
            } else if (pipe.type === 2) {
              this.handleGaugeUpdates(pipe);
            }
          });
        } catch (ex) {
          this.errorCount++;
          if (this.errorCount <= 5) {
            bugsnagClient.notify(ex as NotifiableError);
          }
        }
      });
    });
  }

  ngAfterViewInit() {
    // I switched to angular, but I'm too lazy to change this
    this.manaTickFill = document.getElementById(
      'mana-tick-fill'
    ) as HTMLElement;
    this.manaTickAmount = document.getElementById('tick-amount') as HTMLElement;
    this.castingTickMark = document.getElementById(
      'casting-tick-mark'
    ) as HTMLElement;
  }

  handleGaugeUpdates = (pipe: ZealPipe) => {
    // Don't update based on level 1 characters
    if (this.levelOneCharacters.has(pipe.character)) {
      return;
    }

    // Update casting tick mark
    pipe.data
      .filter((datum) => datum.type === 7)
      .forEach((datum) => {
        const castingLeft = datum.value as number;
        let tickWillMiss = false;
        let castingPercentOnManaTickBar = 0;
        if (castingLeft === -1) {
          // Not casting
          this.lastCastStartedAt = undefined;
          this.lastNotCastingAt = Date.now();
        } else if (this.lastCastStartedAt === undefined && castingLeft > -1) {
          // Just started a cast; assume it started somewhere between the last idle pipe and this casting pipe
          if (this.lastNotCastingAt) {
            this.castDelay = (Date.now() - this.lastNotCastingAt) / 2;
          }
          this.lastCastStartedAt = Date.now() - this.castDelay;
        } else if (this.lastCastStartedAt !== undefined && castingLeft > -1) {
          // Already casting: figure out if we'll miss the mana tick, or where the cast will land on the tick bar
          const percentDone = 1000 - castingLeft;
          const timeElapsed = Date.now() - this.lastCastStartedAt;
          const percentLeft = castingLeft;
          const timeUntilFinishedCasting =
            timeElapsed * (percentLeft / percentDone);
          const willFinishCastingAt = Date.now() + timeUntilFinishedCasting;
          const nextManaTickAt = this.lastManaTickAt + 6_000;
          const castFinishBuffer = 100; // will prooobably miss the tick if you only have 100ms between cast finish and sitting

          // Mana tick will be missed due to the cast
          if (willFinishCastingAt + castFinishBuffer > nextManaTickAt) {
            tickWillMiss = true;
          } else if (timeElapsed > 150) {
            castingPercentOnManaTickBar =
              (willFinishCastingAt - this.lastManaTickAt) / 6000;
          }
        }
        this.updateCastingStatus(tickWillMiss, castingPercentOnManaTickBar);
      });
  };

  handleLabelUpdates = (pipe: ZealPipe) => {
    // Don't update based on level 1 characters
    if (
      pipe.data.some(
        (datum) => datum.type === LabelType.Level && datum.value === '1'
      )
    ) {
      this.levelOneCharacters.add(pipe.character);
      return;
    }

    // Mana update
    pipe.data
      .filter((datum) => datum.type === LabelType.Mana)
      .forEach((datum) => {
        const currentMana = parseInt(datum.value as string);
        if (!this.lastMana) {
          this.lastMana = currentMana;
          return;
        }
        const diff = currentMana - this.lastMana;
        this.lastMana = currentMana;
        if (diff > 0) {
          this.manaTickFill.classList.remove('pending');
          this.lastManaTickAt = Date.now();
          this.resetManaTick();
          this.resetTickAmount(diff);
          clearInterval(this.manaTickInterval);
          this.manaTickInterval = setInterval(() => {
            this.lastManaTickAt = Date.now();
            this.resetManaTick();
          }, 6_000);
        }
      });
  };

  updateCastingStatus = (
    tickWillMiss: boolean,
    castingPercentOnManaTickBar: number
  ) => {
    if (tickWillMiss) {
      this.manaTickFill.classList.add('tick-will-miss');
    } else {
      this.manaTickFill.classList.remove('tick-will-miss');
    }

    if (!castingPercentOnManaTickBar) {
      this.castingTickMark.classList.add('not-casting');
    } else {
      this.castingTickMark.classList.remove('not-casting');
    }

    const castingPosition = `${castingPercentOnManaTickBar * 100}%`;
    if (this.castingTickMark.style.left !== castingPosition) {
      this.castingTickMark.style.left = castingPosition;
    }
  };

  resetTickAmount = (lastManaTickAmount: number) => {
    if (lastManaTickAmount) {
      this.manaTickAmount.innerHTML = `+${lastManaTickAmount}`;
      this.manaTickAmount.classList.remove('fade-out');
      setTimeout(() => {
        this.manaTickAmount.classList.add('fade-out');
      }, 25);
    }
  };

  resetManaTick = () => {
    this.manaTickFill.style.transition = 'none';
    this.manaTickFill.style.width = '0';
    setTimeout(() => {
      this.manaTickFill.style.transition = 'width 5975ms linear';
      this.manaTickFill.style.width = `100%`;
    }, 25);
  };
}
