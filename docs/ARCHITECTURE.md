# Architecture

## Overview

INVADER TONY is a single-page application with no framework. All navigation is handled by a hash-based router; the game itself runs inside a Three.js `WebGLRenderer` that is mounted and destroyed on demand.

The architecture is organised around three principles:
1. **Separation of concerns** — each module has one job and exposes a minimal API.
2. **Explicit lifecycle** — every subsystem has a `mount`/`unmount` or `init`/`destroy` pair. Nothing leaks.
3. **Zero allocations in the hot path** — object pooling and pre-allocated vectors throughout the game loop.

The codebase is fully TypeScript (strict mode). Vite handles transpilation; `tsc --noEmit` is used for type checking only.

---

## Module Map

```
main.ts
  ├── LoadingScreen (showLoadingScreen)  ← preloads all assets before anything mounts
  ├── BackgroundRenderer (init)          ← boots after load, persists across all routes
  └── router (initRouter)
        ├── #home   → HomePage
        │               ├── HomeDOM
        │               └── HomeController
        ├── #game   → GamePage
        │               └── GameOrchestrator
        │                     ├── GameState         (core/)
        │                     ├── GameLoop          (core/)
        │                     ├── SceneSetup        (core/)
        │                     ├── InputManager      (systems/)
        │                     ├── AudioManager      (systems/)
        │                     ├── ChiptunePlayer    (systems/)
        │                     ├── ParticleSystem    (systems/)
        │                     ├── CollisionSystem   (systems/)
        │                     ├── WaveManager       (systems/)
        │                     ├── GridMovement      (systems/)
        │                     ├── WaveSpawner       (systems/)
        │                     ├── PlayerEntity      (entities/)
        │                     ├── BulletPool ×2     (entities/)
        │                     ├── InvaderEntity ×N  (entities/)
        │                     ├── BossEntity        (entities/)
        │                     ├── PostProcessor     (rendering/)
        │                     ├── ShockwavePool     (rendering/)
        │                     ├── TonyModeController (orchestration/)
        │                     ├── BossSpawner       (orchestration/)
        │                     ├── EndConditions     (orchestration/)
        │                     └── HUD               (ui/)
        ├── #end    → EndPage
        │               ├── EndDOM
        │               └── EndController
        └── #leaderboard → LeaderboardPage
```

---

## Boot Sequence

```
1. app.html loads → <script type="module" src="/src/main.ts">
2. main.ts:
   a. showLoadingScreen()             — preloads JS chunks, sprites, audio
   b. BackgroundRenderer.init()       — starfield canvas inserted before #app; rAF loop starts
   c. router.initRouter()             — reads window.location.hash; navigates to #home
3. router mounts HomePage             — title screen rendered; user interacts
4. user presses PLAY                  — router.navigate('#game')
5. router unmounts HomePage           — removes DOM, cleans listeners
6. router dynamically imports GamePage — code-split chunk loads Three.js
7. GamePage.mount(container):
   a. BackgroundRenderer.pause()
   b. creates <canvas> + HUD <div>
   c. GameOrchestrator.init()  — Three.js setup, post-processing, entity creation
   d. GameOrchestrator.start() — rAF loop begins
8. game ends (game over or victory) → sessionStorage handoff → navigate('#end')
9. GamePage.unmount():
   a. GameOrchestrator.destroy()  — disposes all Three.js objects, cancels rAF
   b. BackgroundRenderer.resume()
10. EndPage renders score + name input
11. user saves → navigate('#leaderboard') or '#game'
```

---

## Routing

`src/router.ts` implements a minimal hash router:

```
window.hashchange → router.navigate(hash)
  → unmount current page (if any)
  → dynamic import(pageModule)
  → mount(container)
```

Pages export `{ mount, unmount }`. The router handles both named-export objects and bare exports.

Routes:

| Hash | Module | Purpose |
|---|---|---|
| `#home` | `pages/home/HomePage.ts` | Title screen |
| `#game` | `pages/GamePage.ts` | Game canvas |
| `#end` | `pages/end/EndPage.ts` | Score entry |
| `#leaderboard` | `pages/LeaderboardPage` | High scores |

---

## Game Loop

```
requestAnimationFrame(loop)   ← owned by GameLoop.ts
  │
  ├── delta = clock.getDelta()        (capped at 50ms)
  │
  ├── update(delta)                   ← GameOrchestrator
  │     ├── player.update()           — movement, shoot cooldown, flash timer
  │     ├── playerBullets.updateAll() — translate active bullets, deactivate OOB
  │     ├── enemyBullets.updateAll()
  │     ├── particleSystem.update()   — translate, age, deactivate particles
  │     ├── updateGrid(delta)         — GridMovement: translation, edge bounce, drop, shoot timer
  │     ├── boss.update(delta)        — entry animation, movement pattern, shoot pattern
  │     ├── collisions.check()        — AABB-ish distance checks, pooled vectors _pA/_pB
  │     └── EndConditions.check()     — wave advance / boss spawn / game over / victory
  │
  ├── updateEffects(delta)            — EffectManager: always runs regardless of game state
  │     ├── uDamageFlash fade         — 3.3 units/s decay
  │     ├── uWarpIntensity fade       — 1.25 units/s decay
  │     └── uChromaticAberration      — lerped from boss HP ratio
  │
  └── renderFrame(delta)              — PostProcessor
        ├── starfieldMaterial.uTime  += delta
        ├── Pass 1: scene → rtPingA   (game world render)
        ├── Pass 2: shockwave ping-pong (active slots only, max 5)
        └── Pass 3: scanlines → screen (composite final pass)
```

---

## Post-Processing Pipeline

The game uses a multi-pass post-processing pipeline built on `WebGLRenderTarget` ping-pong. Owned by `src/rendering/PostProcessor.ts`.

```
Three.js scene
      │
      ▼
  rtPingA  ←── Pass 1: renderer.render(scene, camera)
      │          Background starfield plane (z=-5) included here
      │
      ▼
 shockwave passes (0–5, active only)   ← ShockwavePool.ts
  src → dst   ←── each active slot runs one full-screen shockwave distortion
  dst → src   ←── ping-pong swap after each pass
      │
      ▼
 scanlines pass  ←── final composite onto screen (renderTarget = null)
      │             barrel distortion, warp, chromatic aberration,
      │             scanlines, vignette, grain, Tony Mode, damage flash
      ▼
   screen
```

All intermediate passes use `OrthographicCamera(-1,1,1,-1,0,1)` with a `PlaneGeometry(2,2)` fullscreen quad.

---

## State Machine

`src/core/GameState.ts` tracks these phases (enum `GamePhase`):

```
IDLE → PLAYING → BOSS_FIGHT → VICTORY
                            ↘ GAME_OVER
PLAYING → GAME_OVER
```

State transitions are explicit (`gameState.transition(GamePhase.X)`). The HUD subscribes to `score`, `lives`, and `wave` events via a simple `on`/`off` emitter. No polling.

---

## Wave System

Wave configuration lives entirely in `src/config.ts`:

```ts
WAVES: [
  { id, label, cols, rows, enemyTypes[], speedMultiplier, shootIntervalMin, shootIntervalMax, dropAmount },
  ...
]
```

`WaveSpawner.ts` spawns the grid from config. `GridMovement.ts` handles translation, edge bounce, drop, and speed scaling. Wave progression:

```
Wave 1 cleared → show "WAVE 2" message → triggerWarp → 2.2s pause → spawn wave 2
Wave 2 cleared → ...
Wave 4 cleared → spawnBoss() → BOSS_FIGHT state
Boss dies      → triggerVictory() → navigate('#end')
```

---

## Entity Lifecycle

Every entity follows the same pattern:

```ts
const entity = createXxx(scene, opts);
// Game loop calls:
entity.update(delta, ...);
entity.takeDamage();
// At cleanup:
entity.dispose();  // removes from scene, disposes geometries/materials
```

Shared textures (`InvaderEntity`) are an exception — they are disposed separately via `disposeInvaderResources()` when all invaders are gone, to avoid premature disposal while others are still dissolving.

---

## Object Pooling

| Pool | Size | Allocation site |
|---|---|---|
| Player bullets | 30 | `createBulletPool(scene, 30, 'player')` |
| Enemy bullets | 30 | `createBulletPool(scene, 30, 'enemy')` |
| Particles | 200 | `createParticleSystem(scene)` |
| Shockwaves | 5 | `ShockwavePool` in `rendering/ShockwavePool.ts` |

All pools pre-create meshes/materials at init. `acquire()` returns the first inactive slot or `null` (silently dropped if pool is full). Nothing is `new`'d inside the game loop.

---

## Data Flow: Score & Result Handoff

The game page cannot directly pass data to the end page (separate modules, different lifetimes). Data is passed via `sessionStorage`:

```
GameOrchestrator / EndConditions triggerGameOver():
  sessionStorage.setItem('tony_invaders_final_score', score)
  sessionStorage.setItem('tony_invaders_result', 'game_over')
  navigate('#end')

EndPage.mount():
  score  = sessionStorage.getItem('tony_invaders_final_score')
  result = sessionStorage.getItem('tony_invaders_result')
```

On `saveScore()`, the entry is written to `localStorage` via `src/services/leaderboard.ts`. This is the only file that touches storage — swapping to a REST API requires changing only that file.

---

## Background Renderer

`BackgroundRenderer` owns a separate `WebGLRenderer` and canvas element, inserted into `document.body` before `#app`. It runs an independent `requestAnimationFrame` loop.

Stacking works purely via DOM order: the background canvas is the first child of `<body>`; all page root elements (`position: fixed`) are inside `#app` which follows in document order, so they naturally paint on top without requiring explicit `z-index`.

During gameplay, `BackgroundRenderer.pause()` stops rendering (but keeps the canvas in the DOM) to avoid running two WebGL renderers simultaneously. The game scene has its own embedded starfield plane via `StarfieldBackground.ts`.

---

## Leaderboard Service Interface

`src/services/leaderboard.ts` exposes a storage-agnostic interface:

```ts
getScores()              // → ScoreEntry[]  sorted desc
saveScore(name, score)   // → ScoreEntry[]  updated array
clearScores()            // → void          debug only
```

```ts
type ScoreEntry = { name: string; score: number; date: string }
```

To migrate from `localStorage` to a REST API, only this file changes. All callers (`EndController`, `HUD`) are unaffected.

---

## TypeScript Conventions

- Factory functions (`createXxx`) are preferred over classes
- Shared interfaces in `src/types/` — `entities.ts`, `game.ts`, `rendering.ts`
- All magic numbers in `src/config.ts` — no inline literals in game logic
- Unused parameters prefixed with `_` (e.g. `_event`) to satisfy the linter
- `strict: true` in `tsconfig.json` — no implicit any, strict null checks
