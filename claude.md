# INVADER TONY — Claude Code Context

## Project Overview

A Space Invaders clone featuring Tony Pitony as the enemy aliens.
Built with Vite + TypeScript + Three.js (only for the game canvas and visual effects).
The rest of the UI (menus, leaderboard) is pure HTML/CSS.

## Stack

- Package manager: pnpm
- Bundler/dev server: Vite
- Language: TypeScript (strict mode, `noEmit` — Vite handles transpilation)
- 3D/effects: Three.js (game scene only)
- Shaders: GLSL via vite-plugin-glsl
- No frameworks — vanilla TS with ES modules
- Linting: ESLint 9 flat config with `typescript-eslint`
- Formatting: Prettier (`singleQuote`, `semi`, `trailingComma: all`, `printWidth: 100`)

## Design Bible

- Aesthetic: 90s arcade cabinet, CRT scanlines, VHS glitch, pixel art
- Font: "Press Start 2P" (Google Fonts) for all UI text
- Colors: black background, neon green/cyan/yellow/magenta accents
- Always 60fps — performance is non-negotiable
- Mobile: always force landscape mode, never portrait

## Pages / Views (SPA, no router library)

1. HOME — title screen, cabinato style, Start + Leaderboard options
2. GAME — Three.js canvas fullscreen, HUD overlay in HTML
3. GAME OVER / WIN — result screen, name input for leaderboard
4. LEADERBOARD — top 10 scores, localStorage for now (API-ready interface)

## Architecture Rules

- Each "page" is a TS module that mounts/unmounts its own DOM
- Three.js scene is created and destroyed with the game page
- All pages share a single Router (`src/router.ts`) — hash-based (#home, #game, #end, #leaderboard)
- Leaderboard data layer must be abstracted behind `src/services/leaderboard.ts` so switching from localStorage to API later requires changing only that file
- Shared TypeScript interfaces live in `src/types/` (entities.ts, game.ts, rendering.ts)

## Source Layout

```
src/
├── main.ts                      # Entry point
├── router.ts                    # Hash-based SPA router
├── config.ts                    # All magic numbers
├── vite-env.d.ts
│
├── core/                        # Engine primitives
│   ├── GameLoop.ts
│   ├── GameState.ts             # State machine + event emitter
│   └── SceneSetup.ts
│
├── entities/                    # Three.js game objects
│   ├── PlayerEntity.ts
│   ├── InvaderEntity.ts
│   ├── BulletPool.ts
│   ├── BossEntity.ts            # Final boss entry point
│   ├── BossGeometry.ts
│   ├── BossMovement.ts
│   ├── BossAttack.ts
│   └── BossPhases.ts
│
├── systems/                     # Stateless game systems
│   ├── AudioManager.ts
│   ├── ChiptunePlayer.ts
│   ├── CollisionSystem.ts
│   ├── GridMovement.ts
│   ├── InputManager.ts
│   ├── ParticleSystem.ts
│   ├── WaveManager.ts
│   └── WaveSpawner.ts
│
├── orchestration/               # Wires systems+entities together
│   ├── GameOrchestrator.ts      # Main game loop owner
│   ├── BossSpawner.ts
│   ├── EndConditions.ts
│   └── TonyModeController.ts
│
├── rendering/                   # Post-processing pipeline
│   ├── PostProcessor.ts
│   ├── EffectManager.ts
│   ├── ShockwavePool.ts
│   └── StarfieldBackground.ts
│
├── loading/                     # Asset preloading
│   ├── LoadingScreen.ts
│   ├── LoadingOverlay.ts
│   ├── AssetLoader.ts
│   └── AudioCache.ts
│
├── background/
│   └── BackgroundRenderer.ts    # Persistent starfield canvas
│
├── pages/
│   ├── GamePage.ts
│   ├── CreditsPage.ts
│   ├── home/
│   │   ├── HomePage.ts
│   │   ├── HomeDOM.ts
│   │   └── HomeController.ts
│   └── end/
│       ├── EndPage.ts
│       ├── EndDOM.ts
│       └── EndController.ts
│
├── services/
│   ├── leaderboard.ts           # API-first data layer + localStorage fallback
│   └── seo.ts
│
├── types/                       # Shared TypeScript interfaces
│   ├── entities.ts
│   ├── game.ts
│   └── rendering.ts
│
├── ui/
│   └── HUD.ts
│
├── utils/
│   ├── dom.ts
│   ├── formatScore.ts
│   ├── konamiCode.ts
│   └── scoreHash.ts
│
└── game/
    └── shaders/                 # GLSL files — imported via vite-plugin-glsl
        ├── starfield/
        ├── scanlines/
        ├── shockwave/
        └── dissolve/
```

## Code Style

- ES modules everywhere, no CommonJS
- TypeScript strict mode — no `any` unless unavoidable (triggers a warning)
- Prefer composition over classes — factory functions (`createXxx`) not classes
- All magic numbers go in `src/config.ts`
- Unused variables prefixed with `_` to suppress lint warnings

## Dev Scripts

```bash
pnpm dev            # Vite dev server (no API endpoints)
pnpm dev:vercel     # Full stack — frontend + serverless + .env.local
pnpm build          # Production bundle
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint on src/
pnpm format         # Prettier write on src/
pnpm format:check   # Prettier check (for CI)
```

## Performance Rules

- Three.js: object pooling for bullets and particles (no new allocations in game loop)
- Target: locked 60fps on mid-range mobile in landscape
- Use delta time everywhere, never assume frame rate

## Shader Files

- `.vert` and `.frag` files in `src/game/shaders/`
- Imported as strings via `vite-plugin-glsl`
- Each shader has its own subfolder with vertex + fragment
- Shaders remain in `src/game/shaders/` even after the TS migration

## What NOT to do

- Do not use React, Vue, or any component framework
- Do not use CSS frameworks (Tailwind, Bootstrap)
- Do not allocate memory in the game loop (no new Vector3() etc.)
- Do not use document.write or innerHTML for game-critical paths
- Do not break the 60fps target for visual effects
- Do not add `.js` files to `src/` — the codebase is fully TypeScript
