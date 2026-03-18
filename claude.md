# Cage Invaders — Claude Code Context

## Project Overview

A Space Invaders clone featuring Nicholas Cage as the enemy aliens.
Built with Vite + vanilla JS + Three.js (only for the game canvas and visual effects).
The rest of the UI (menus, leaderboard) is pure HTML/CSS.

## Stack

- Package manager: pnpm
- Bundler/dev server: Vite
- 3D/effects: Three.js (game scene only)
- Shaders: GLSL via vite-plugin-glsl
- No frameworks — vanilla JS with ES modules

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

- Each "page" is a JS module that mounts/unmounts its own DOM
- Three.js scene is created and destroyed with the game page
- All pages share a single Router (src/router.js) — hash-based (#home, #game, #end, #leaderboard)
- Leaderboard data layer must be abstracted behind src/services/leaderboard.js so switching from localStorage to API later requires changing only that file

## Code Style

- ES modules everywhere, no CommonJS
- No TypeScript (plain JS with JSDoc comments for types)
- Prefer composition over classes where possible
- All magic numbers go in src/config.js

## Performance Rules

- Three.js: object pooling for bullets and particles (no new allocations in game loop)
- Target: locked 60fps on mid-range mobile in landscape
- Use delta time everywhere, never assume frame rate

## Shader Files

- .vert and .frag files in src/shaders/
- Imported as strings via vite-plugin-glsl
- Each shader has its own subfolder with vertex + fragment

## What NOT to do

- Do not use React, Vue, or any component framework
- Do not use CSS frameworks (Tailwind, Bootstrap)
- Do not allocate memory in the game loop (no new Vector3() etc.)
- Do not use document.write or innerHTML for game-critical paths
- Do not break the 60fps target for visual effects
