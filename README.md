# INVADER TONY

A Space Invaders clone with a 90s style and an Italian internet celebrity twist. Four waves of enemies, a three-phase final boss, procedural audio, and a full CRT post-processing pipeline — all in vanilla JavaScript and Three.js with zero framework dependencies.

![Game screenshot placeholder](docs/screenshot.png)

---

## Features

- **4 progressive waves** — increasing enemy count, speed, and fire rate across waves 1–4
- **Two enemy types** — basic (suit) and elite (Elvis jumpsuit) with different scoring and animations
- **Three-phase final boss** — Tony Pitony with fan, spiral, circle, and aimed bullet patterns; phase transitions trigger glitch effects and Tony Mode
- **Full post-processing pipeline** — barrel distortion, CRT scanlines, vignette, film grain, chromatic aberration, shockwave ripples
- **Reactive shader effects** — chromatic aberration intensifies as boss HP drops; red screen flash on player hit; warp distortion on wave transition
- **Pixel dissolve death** — enemies burn away with an orange edge glow instead of disappearing instantly
- **Procedural audio** — all sound effects and music synthesised in real-time via Web Audio API, zero audio files
- **Persistent starfield** — 3-layer parallax background with twinkling stars and a periodic shooting star, visible across all screens
- **Leaderboard** — top 10 scores persisted to localStorage (API-ready interface)
- **Mobile support** — landscape-forced layout with on-screen touch controls

---

## Tech Stack

| Concern | Solution |
|---|---|
| Bundler | [Vite](https://vitejs.dev/) |
| 3D / shaders | [Three.js](https://threejs.org/) |
| GLSL import | [vite-plugin-glsl](https://github.com/UstymUkhman/vite-plugin-glsl) |
| Language | Vanilla ES modules, no TypeScript |
| Styling | Plain CSS injected per-page, no framework |
| Package manager | pnpm |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm (`npm install -g pnpm`)

### Install

```bash
git clone https://github.com/your-username/cage-invaders.git
cd cage-invaders
pnpm install
```

### Develop

```bash
pnpm dev
```

Opens at `http://localhost:5173`. Hot-reload is active on all JS and GLSL files.

### Build

```bash
pnpm build
```

Output in `dist/`. Chunks are code-split by route — the Three.js bundle only loads when the game page is visited.

### Preview build

```bash
pnpm preview
```

---

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move left | `←` / `A` | Left zone tap/hold |
| Move right | `→` / `D` | Right zone tap/hold |
| Shoot | `Space` | Fire button (center) |
| Navigate menus | `↑ ↓` arrows, `Enter` | Tap |
| Back (leaderboard) | `Escape` | BACK button |

---

## Project Structure

```
src/
├── main.js                      # Entry point: boots background renderer + router
├── config.js                    # All magic numbers (speeds, HP, wave definitions)
├── router.js                    # Hash-based SPA router with dynamic imports
│
├── background/
│   └── BackgroundRenderer.js    # Persistent fullscreen starfield (all pages)
│
├── pages/
│   ├── HomePage.js              # Title screen
│   ├── GamePage.js              # Mounts Three.js canvas + HUD
│   ├── EndPage.js               # Game Over / Victory + score entry
│   └── LeaderboardPage.js       # Top 10 scores
│
├── game/
│   ├── Game.js                  # Main orchestrator, game loop, post-processing
│   ├── GameState.js             # State machine + event emitter
│   │
│   ├── entities/
│   │   ├── Player.js            # Player ship
│   │   ├── Bullet.js            # Object-pooled projectiles
│   │   ├── TonyInvader.js       # Grid enemies (basic + elite)
│   │   └── BossTony.js          # Final boss
│   │
│   └── shaders/
│       ├── starfield/           # Procedural parallax background
│       ├── scanlines/           # CRT post-processing composite pass
│       ├── shockwave/           # Radial explosion distortion
│       └── dissolve/            # Enemy pixel-dissolve death effect
│
├── systems/
│   ├── AudioManager.js          # Procedural Web Audio synthesis
│   ├── InputManager.js          # Keyboard + touch input
│   └── ParticleSystem.js        # Pooled VFX particles
│
├── ui/
│   └── HUD.js                   # HTML overlay (score, lives, boss bar, messages)
│
└── services/
    └── leaderboard.js           # Score persistence (localStorage, API-ready)
```

For a deeper explanation of module interactions and the rendering pipeline, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
For shader-by-shader documentation, see [`docs/SHADERS.md`](docs/SHADERS.md).

---

## Assets

PNG sprites are expected at `public/assets/`:

| File | Usage |
|---|---|
| `tony_enemy1.png` | Basic enemy (suit) |
| `tony_enemy2.png` | Elite enemy (Elvis jumpsuit) |
| `tony_boss.png` | Final boss |

Sprites should use transparency (PNG with alpha) and are rendered with `NearestFilter` to preserve pixel-art crispness.

---

## Performance Notes

- **Object pooling** — bullets (30 player + 30 enemy), particles (200), shockwaves (5) are all pre-allocated. Zero `new` calls in the game loop.
- **Pre-allocated vectors** — `_pA` and `_pB` (THREE.Vector3) are module-level singletons reused for every collision check.
- **Shared textures** — all `basic` enemies share one texture instance; all `elite` enemies share another. Disposed together via `disposeInvaderResources()`.
- **Delta-time capped** — clamped to 50ms per frame to prevent the spiral-of-death on tab focus restore.
- **Background renderer pauses** during gameplay — the game scene has its own embedded starfield, so the background canvas stops its rAF loop to save GPU bandwidth.

---

## License

MIT
