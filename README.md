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

---

## AI Asset Generation Pipeline

The `tools/` folder contains a Python pipeline that generates game art (unit sprites and portrait cards) using the OpenAI Images API (DALL-E-3).

### Setup

1. **Install Python dependencies** (Python 3.10+ required):
   ```bash
   pip install openai python-dotenv
   ```

2. **Create your `.env` file** from the provided example:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and paste your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...your-key-here...
   ```
   The `.env` file is git-ignored and never committed.

### Quickstart

```bash
cd tools

# Preview what would be generated (no API calls, free):
python generate_assets.py --dry-run

# Generate all core portraits (18 combos: 3 races × 6 classes):
python generate_assets.py --preset core_portraits

# Generate one specific asset:
python generate_assets.py --race human --class warrior --pose idle

# Re-generate an asset you already have:
python generate_assets.py --race human --class warrior --pose idle --overwrite

# Verbose output (shows prompt previews and debug info):
python generate_assets.py --dry-run --verbose
```

### Output Structure

```
assets/generated/
├── manifest.json                       ← tracks every generation
├── units/
│   ├── human/
│   │   ├── warrior/
│   │   │   ├── idle_basic.png
│   │   │   ├── attack_basic.png
│   │   │   └── idle_basic_forest.png   ← biome variant
│   │   └── mage/
│   │       └── idle_basic.png
│   ├── elf/
│   └── dragonkin/
└── portraits/
    ├── human/
    │   └── warrior/
    │       └── portrait_basic.png
    ├── elf/
    └── dragonkin/
```

### Batch Presets

Presets are defined in `tools/unit_definitions.json` under `batch_presets`:

| Preset name | Description |
|-------------|-------------|
| `core_portraits` | All 18 race/class portrait cards (basic tier, no biome) |
| `core_battle` | All 18 race/class idle sprites |
| `human_warrior_poses` | Attack + hurt poses for Human Warrior only |

### Pipeline Files

| File | Purpose |
|------|---------|
| `tools/unit_definitions.json` | All races, classes, poses, tiers, biomes, and prompting descriptors |
| `tools/prompt_builder.py` | Builds deterministic prompts from structured definitions |
| `tools/openai_image_client.py` | API client with retry, backoff, timeout, and atomic save |
| `tools/asset_manifest.py` | Persistent JSON manifest — tracks all generations, enables skip-existing |
| `tools/generate_assets.py` | Main entry point with CLI flags, concurrency, and summary report |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(required)* | Your OpenAI secret key |
| `OPENAI_ORG_ID` | *(optional)* | Your OpenAI organization ID |
| `OPENAI_IMAGE_MODEL` | `dall-e-3` | Image model to use |
| `OPENAI_IMAGE_SIZE` | `1024x1024` | Output image dimensions |
| `OPENAI_IMAGE_QUALITY` | `standard` | `standard` or `hd` (hd costs 2× more) |
| `OPENAI_MAX_CONCURRENCY` | `3` | Max parallel API requests |
| `OPENAI_TIMEOUT_SECONDS` | `60` | Per-request timeout |

### Previewing a Prompt

You can inspect the exact prompt that will be sent to OpenAI before spending credits:

```bash
python tools/prompt_builder.py --race dragonkin --class mage --pose portrait --tier elite --biome volcanic
```

### Inspecting the Manifest

```bash
# See all generated assets
python tools/asset_manifest.py

# Filter by status or race
python tools/asset_manifest.py --status failed
python tools/asset_manifest.py --race elf --class archer
```
