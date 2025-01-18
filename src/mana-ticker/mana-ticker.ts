import { LabelType, ZealPipe } from '../zeal/zeal-pipes';

const manaTickFill = document.getElementById('mana-tick-fill') as HTMLElement;
const manaTickAmount = document.getElementById('tick-amount') as HTMLElement;
const castingTickMark = document.getElementById('casting-tick-mark') as HTMLElement;

type ZealWindow = Window & { zeal: { onZealPipes: (cb: (pipes: ZealPipe[]) => void) => void } };

const levelOneCharacters = new Set<string>();
const zealWindow = window as unknown as ZealWindow;

let lastMana = 0;
let lastManaTickAt = Date.now();
let manaTickInterval: any;
let castDelay = 50;
let lastCastStartedAt: number | undefined = undefined;
let lastNotCastingAt: number | undefined = undefined;

zealWindow.zeal.onZealPipes((pipes) => {
  pipes.forEach((pipe) => {
    if (pipe.type === 1) {
      handleLabelUpdates(pipe);
    } else if (pipe.type === 2) {
      handleGaugeUpdates(pipe);
    }
  });
});

const handleGaugeUpdates = (pipe: ZealPipe) => {
  // Don't update based on level 1 characters
  if (levelOneCharacters.has(pipe.character)) {
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
        lastCastStartedAt = undefined;
        lastNotCastingAt = Date.now();
      } else if (lastCastStartedAt === undefined && castingLeft > -1) {
        // Just started a cast; assume it started somewhere between the last idle pipe and this casting pipe
        if (lastNotCastingAt) {
          castDelay = (Date.now() - lastNotCastingAt) / 2;
        }
        lastCastStartedAt = Date.now() - castDelay;
      } else if (lastCastStartedAt !== undefined && castingLeft > -1) {
        // Already casting: figure out if we'll miss the mana tick, or where the cast will land on the tick bar
        const percentDone = 1000 - castingLeft;
        const timeElapsed = Date.now() - lastCastStartedAt;
        const percentLeft = castingLeft;
        const timeUntilFinishedCasting = timeElapsed * (percentLeft / percentDone);
        const willFinishCastingAt = Date.now() + timeUntilFinishedCasting;
        const nextManaTickAt = lastManaTickAt + 6_000;
        const castFinishBuffer = 100; // will prooobably miss the tick if you only have 100ms between cast finish and sitting

        // Mana tick will be missed due to the cast
        if (willFinishCastingAt + castFinishBuffer > nextManaTickAt) {
          tickWillMiss = true;
        } else if (timeElapsed > 150) {
          castingPercentOnManaTickBar = (willFinishCastingAt - lastManaTickAt) / 6000;
        }
      }
      updateCastingStatus(tickWillMiss, castingPercentOnManaTickBar);
    });
};

const handleLabelUpdates = (pipe: ZealPipe) => {
  // Don't update based on level 1 characters
  if (pipe.data.some((datum) => datum.type === LabelType.Level && datum.value === '1')) {
    levelOneCharacters.add(pipe.character);
    return;
  }

  // Mana update
  pipe.data
    .filter((datum) => datum.type === LabelType.Mana)
    .forEach((datum) => {
      const currentMana = parseInt(datum.value as string);
      if (!lastMana) {
        lastMana = currentMana;
        return;
      }
      const diff = currentMana - lastMana;
      lastMana = currentMana;
      if (diff > 0) {
        manaTickFill.classList.remove('pending');
        lastManaTickAt = Date.now();
        resetManaTick();
        resetTickAmount(diff);
        clearInterval(manaTickInterval);
        manaTickInterval = setInterval(() => {
          lastManaTickAt = Date.now();
          resetManaTick();
        }, 6_000);
      }
    });
};

const updateCastingStatus = (tickWillMiss: boolean, castingPercentOnManaTickBar: number) => {
  if (tickWillMiss) {
    manaTickFill.classList.add('tick-will-miss');
  } else {
    manaTickFill.classList.remove('tick-will-miss');
  }

  if (!castingPercentOnManaTickBar) {
    castingTickMark.classList.add('not-casting');
  } else {
    castingTickMark.classList.remove('not-casting');
  }

  const castingPosition = `${castingPercentOnManaTickBar * 100}%`;
  if (castingTickMark.style.left !== castingPosition) {
    castingTickMark.style.left = castingPosition;
  }
};

const resetTickAmount = (lastManaTickAmount: number) => {
  if (lastManaTickAmount) {
    manaTickAmount.innerHTML = `+${lastManaTickAmount}`;
    manaTickAmount.classList.remove('fade-out');
    setTimeout(() => {
      manaTickAmount.classList.add('fade-out');
    }, 25);
  }
};

const resetManaTick = () => {
  manaTickFill.style.transition = 'none';
  manaTickFill.style.width = '0';
  setTimeout(() => {
    manaTickFill.style.transition = 'width 5975ms linear';
    manaTickFill.style.width = `100%`;
  }, 25);
};
