## Mana Ticker for Project Quarm (*[Zeal](https://github.com/iamclint/Zeal) is required!*)
Auto-syncing mana tick bar with tick amount, coloring to let you know if a cast will take longer than the next tick, and a cast finish time marker.  The mana tick bar is draggable and resizeable.  Once you get a mana tick, it should automatically sync.
#### Demo
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[https://www.youtube.com/watch?v=FmZEWCTDMsM](https://www.youtube.com/watch?v=FmZEWCTDMsM)

### Install
- Download the Windows installer from the [releases page](https://github.com/mgammon/quarm-dinodna-mana-ticker/releases)

### Troubleshooting
- If you're chilling at 100% mana, it won't sync; you actually need to regen a point of mana.
- You may need to restart the mana ticker after the initial install and restart the EverQuest client to start picking up mana ticks.
- Manastone, bard mana pulse, necro twitches will reset the bar, putting it out of sync.  It'll sync back on your next server based mana tick.
- [Zeal](https://github.com/iamclint/Zeal) is required!  Make sure the version isn't ancient.
- If you get a janky cursor after dragging or resizing the bar on top of the EQ Client, tab out and back in.
- Level 1 characters will not sync.  This is to prevent mules from messing up syncs on your actual character.
- If your syncs are way off, check your Zeal /pipedelay; the lower it is, the more accurate you'll be (100 is a good value!)

### Build (requires NodeJS, but not >= 23)
    git clone https://github.com/mgammon/quarm-dinodna-mana-ticker.git
    cd quarm-dinodna-mana-ticker
    npm install
    npm run make
