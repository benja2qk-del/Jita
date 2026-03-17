# Shattered Dominion — Fantasy Conquest

A browser-based single-player fantasy conquest game built with HTML5 Canvas and vanilla JavaScript.

## How to Run

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge).
2. No build tools, dependencies, or server required.

Alternatively, run a local server for best results:
```
npx serve .
```
Then open `http://localhost:3000`.

## Controls

### Menus & Campaign
- **Mouse Click** — Select nodes, buttons, and interact with all UI

### Battle
| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move hero |
| Space | Basic attack |
| Q | Skill 1 |
| W | Skill 2 |
| E | Skill 3 |
| 1 | Army Order: Hold |
| 2 | Army Order: Push |
| 3 | Army Order: All-Out |
| P / Escape | Pause |

## Game Flow

1. **Main Menu** → New Game or Continue
2. **Character Creation** → Pick Race, Class, Name, Kingdom, Banner Color
3. **Campaign Map** → Select nodes on district maps
4. **Battle** → Side-view auto-battle with hero control
5. **Buildings** → Blacksmith, Barracks, Tavern, Healer, Market
6. **Events** → Random choice encounters
7. **Boss Fight** → Defeat Warlord Grimtusk to win
8. **Victory / Game Over**

## Races

| Race | Strength | Trade-off |
|------|----------|-----------|
| Human | +20% gold, balanced stats | No special combat bonus |
| Elf | +15% speed, ranged accuracy | Lower HP |
| Dragonkin | +15% armor, fire bonus | Slower recruitment, higher upkeep |

## Classes

| Class | Style | Skills |
|-------|-------|--------|
| Warrior | Frontline tank | Cleave, Charge, Guard Stance |
| Samurai | Agile duelist | Dash Slash, Parry Stance, Crescent Strike |
| Ninja | Backline assassin | Shadow Step, Smoke Bomb, Chain Attack |

## Architecture

```
Game/
├── index.html              # Entry HTML
├── main.js                 # Game loop & initialization
├── css/style.css           # All styles
├── core/                   # Engine modules
│   ├── utils.js            # Math, drawing, helpers
│   ├── state.js            # Central game state
│   ├── input.js            # Keyboard + mouse
│   ├── renderer.js         # Canvas setup
│   ├── screenManager.js    # Screen transitions
│   └── audio.js            # Audio stub
├── data/                   # Data definitions
│   ├── races.js
│   ├── classes.js
│   ├── units.js
│   ├── weapons.js
│   ├── districts.js
│   └── events.js
├── systems/                # Game logic
│   ├── saveSystem.js
│   ├── campaignSystem.js
│   ├── battleSystem.js
│   ├── upgradeSystem.js
│   └── lootSystem.js
└── screens/                # UI screens
    ├── mainMenu.js
    ├── characterCreation.js
    ├── campaignMap.js
    ├── battleScreen.js
    ├── blacksmith.js
    ├── barracks.js
    ├── tavern.js
    ├── healer.js
    ├── market.js
    ├── reward.js
    ├── eventScreen.js
    ├── codex.js
    ├── gameOver.js
    └── victory.js
```

## Extending the Game

- **New races**: Add entries to `data/races.js`
- **New classes**: Add entries to `data/classes.js`
- **New units**: Add to `data/units.js` (allied or enemy)
- **New weapons**: Add templates to `data/weapons.js`
- **New districts**: Add to `data/districts.js`
- **New events**: Add to `data/events.js`
- **New screens**: Create in `screens/`, register in `main.js`

All content is data-driven. No engine changes needed to add races, classes, units, or districts.

## Save System

Game auto-saves after battles and building visits. Uses `localStorage`. Click the save button on the campaign map. Use "Continue" on the main menu to resume.
