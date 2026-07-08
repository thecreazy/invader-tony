<div align="center">

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ██╗███╗  ██╗██╗   ██╗ █████╗ ██████╗ ███████╗██████╗              ║
║   ██║████╗ ██║██║   ██║██╔══██╗██╔══██╗██╔════╝██╔══██╗             ║
║   ██║██╔██╗██║╚██╗ ██╔╝███████║██║  ██║█████╗  ██████╔╝             ║
║   ██║██║╚████║ ╚████╔╝ ██╔══██║██║  ██║██╔══╝  ██╔══██╗             ║
║   ██║██║ ╚███║  ╚██╔╝  ██║  ██║██████╔╝███████╗██║  ██║             ║
║   ╚═╝╚═╝  ╚══╝   ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝             ║
║                 ████████╗ ██████╗ ███╗  ██╗██╗   ██╗                ║
║                    ██╔══╝██╔═══██╗████╗ ██║╚██╗ ██╔╝                ║
║                    ██║   ██║   ██║██╔██╗██║ ╚████╔╝                 ║
║                    ██║   ██║   ██║██║╚████║  ╚██╔╝                  ║
║                    ██║   ╚██████╔╝██║ ╚███║   ██║                   ║
║                    ╚═╝    ╚═════╝ ╚═╝  ╚══╝   ╚═╝                   ║
╠══════════════════════════════════════════════════════════════════════╣
║  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾  👾   ║
╠══════════════════════════════════════════════════════════════════════╣
║        © 1992 RICCARDO CANELLA  ·  INSERT COIN TO CONTINUE          ║
╚══════════════════════════════════════════════════════════════════════╝
```

[![License: MIT](https://img.shields.io/badge/LICENSE-MIT-39ff14?style=flat-square)](#license)
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-3178C6?style=flat-square&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/THREE.JS-000000?style=flat-square&logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/VITE-646CFF?style=flat-square&logo=vite&logoColor=fff)](https://vitejs.dev/)
[![Deployed on Vercel](https://img.shields.io/badge/VERCEL-000?style=flat-square&logo=vercel)](https://vercel.com/)

*Space Invaders clone — 4 progressive waves · 3-phase boss · CRT post-processing*  
*TypeScript + Three.js · Zero framework dependencies*

</div>

---

```
╔══════════════════════════════╗
║  ▶  SCREENSHOT               ║
╚══════════════════════════════╝
```

![Game screenshot](docs/screenshot.png)

---

```
╔══════════════════════════════╗
║  ▶  FEATURES                 ║
╚══════════════════════════════╝
```

**👾 GAMEPLAY**
- **4 progressive waves** — enemy count, speed, and fire rate escalate across waves 1–4
- **Two enemy types** — basic (suit) and elite (Elvis jumpsuit) with different scoring
- **Three-phase final boss** — Tony Pitony with fan, spiral, circle, and aimed bullet patterns; phase transitions trigger glitch effects and Tony Mode

**📺 VISUALS**
- **Full CRT post-processing pipeline** — barrel distortion, scanlines, vignette, film grain, chromatic aberration, shockwave ripples
- **Reactive shader effects** — chromatic aberration intensifies as boss HP drops; red screen flash on player hit; warp distortion on wave transition
- **Pixel dissolve death** — enemies burn away with an orange edge glow
- **Persistent starfield** — 3-layer parallax background with twinkling stars and periodic shooting stars, visible on all screens

**🔊 AUDIO**
- **Procedural SFX** — all sound effects synthesised in real-time via Web Audio API
- **Background music** — preloaded and played as a blob URL for zero-latency start

**🏆 LEADERBOARD**
- Top 10 scores persisted to Supabase via Vercel Serverless Functions
- localStorage as offline fallback
- Protected by signed session tokens and server-side anti-cheat validation

**🕹️ PLATFORM**
- Mobile support — landscape-forced layout with on-screen touch controls
- Locked 60 fps — object pooling, delta-time capped, pre-allocated vectors throughout

---

```
╔══════════════════════════════╗
║  ▶  TECH STACK               ║
╚══════════════════════════════╝
```

| CONCERN | SOLUTION |
|---|---|
| Bundler | [Vite](https://vitejs.dev/) |
| Language | TypeScript (strict, `noEmit` — Vite transpiles) |
| 3D / shaders | [Three.js](https://threejs.org/) |
| GLSL import | [vite-plugin-glsl](https://github.com/UstymUkhman/vite-plugin-glsl) |
| Linting | ESLint 9 flat config + typescript-eslint |
| Formatting | Prettier |
| Styling | Plain CSS injected per-page — no framework |
| Package manager | pnpm |
| Backend | Vercel Serverless Functions (Node.js ESM) |
| Database | Supabase (PostgreSQL via REST API) |
| Deploy | Vercel |

---

```
╔══════════════════════════════╗
║  ▶  GETTING STARTED          ║
╚══════════════════════════════╝
```

**Prerequisites**

- Node.js ≥ 18
- pnpm (`npm install -g pnpm`)

**Install**

```bash
git clone https://github.com/your-username/cage-invaders.git
cd cage-invaders
pnpm install
```

**Develop**

```bash
# Frontend only — no API endpoints available
pnpm dev

# Full stack — frontend + serverless functions + .env.local vars
pnpm dev:vercel   # alias for: vercel dev
```

Opens at `http://localhost:3000` (vercel dev) or `http://localhost:5173` (vite only).

> **⚠** Use `pnpm dev:vercel` when working on anything that touches `/api/*`.  
> Plain `pnpm dev` does not run serverless functions.

**Build**

```bash
pnpm build
```

Output in `dist/`. Chunks are code-split by route — the Three.js bundle only loads when the game page is visited.

**Preview build**

```bash
pnpm preview
```

**Code quality**

```bash
pnpm typecheck      # TypeScript type check (tsc --noEmit)
pnpm lint           # ESLint on src/
pnpm format         # Prettier — auto-fix formatting
pnpm format:check   # Prettier — check only (CI)
```

---

```
╔══════════════════════════════╗
║  ▶  CONTROLS                 ║
╚══════════════════════════════╝
```

| ACTION | KEYBOARD | TOUCH |
|---|---|---|
| Move left | `←` / `A` | Left zone tap/hold |
| Move right | `→` / `D` | Right zone tap/hold |
| Shoot | `Space` | Fire button (center) |
| Navigate menus | `↑ ↓` arrows, `Enter` | Tap |
| Back (leaderboard) | `Escape` | BACK button |

---

```
╔══════════════════════════════╗
║  ▶  BACKEND                  ║
╚══════════════════════════════╝
```

### ENVIRONMENT VARIABLES

Create `.env.local` at the root (never commit it):

```env
# Supabase — Project Settings → API
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_KEY=<secret key>

# Game session signing — generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
GAME_SECRET=<32-byte hex string>

# Vercel Cron protection — any random string
CRON_SECRET=<random string>
```

Add all five to Vercel project settings → Environment Variables for production.

---

### API ENDPOINTS

| METHOD | PATH | DESCRIPTION |
|--------|------|-------------|
| `POST` | `/api/session/start` | Issue a signed game session token |
| `GET`  | `/api/scores` | Fetch top 10 scores (cacheable, `s-maxage=10`) |
| `POST` | `/api/scores/submit` | Validate and insert a new score |
| `GET`  | `/api/cleanup` | Delete expired sessions (Vercel Cron, daily) |

---

### SCORE SUBMISSION PIPELINE

`POST /api/scores/submit` runs these checks in order and short-circuits on the first failure:

```
 1  Method must be POST
 2  Content-Type: application/json required
 3  Body must be a valid JSON object
 4  name and score fields must be present
 5  score must be a finite integer
 6  IP rate limit ─── 3 requests/minute per IP (in-memory, resets on cold start)
 7  Score bounds ──── 10 ≤ score ≤ 4500 (game physical max + 20% buffer)
 8  Name sanitization — uppercase, alphanumeric + space, max 8 chars
 9  Name validity ─── not all-same-character, not in blocked list
10  Profanity filter ─ checked against built-in word list
11  Session token ─── signature + expiry + one-time use (skipped if GAME_SECRET not set)
12  Global DB rate ── max 30 inserts/minute across all IPs (circuit breaker)
13  Duplicate guard ─ same name + score in last 30 s → silent 200, no insert
14  Supabase insert → return updated top-10 leaderboard
```

**Error codes returned to the client:**

| CODE | HTTP | SHOWN TO PLAYER |
|------|------|-----------------|
| `NICKNAME_PROFANITY` | 400 | `NAME NOT ALLOWED` |
| `INVALID_NAME` | 400 | `INVALID NAME` |
| `RATE_LIMIT` | 429 | `SLOW DOWN!` |
| `MISSING_TOKEN` | 400 | `PLAY THE GAME FIRST` |
| `INVALID_TOKEN` | 401 | `INVALID SESSION` |
| `TOKEN_EXPIRED` | 401 | `SESSION EXPIRED` |
| `SESSION_ALREADY_USED` | 401 | `SESSION ALREADY USED` |
| `INVALID_SCORE` | 400 | silent — local fallback |
| `SERVER_ERROR` | 500 | silent — local fallback |

---

### SESSION TOKEN SYSTEM

Prevents fake scores from being submitted without actually playing the game.

```
GAME STARTS
  └─▶ POST /api/session/start
        ├── Generates UUID session ID
        ├── Signs it with HMAC-SHA256 using GAME_SECRET
        ├── Persists to game_sessions table (used: false, expires in 30 min)
        └── Returns { token: "<base64url>.<hmac-sig>" }

GAME ENDS  (win or game over)
  └─▶ sessionStorage stores: token + score hash

PLAYER SUBMITS SCORE  (End screen, on Enter)
  └─▶ POST /api/scores/submit { name, score, sessionToken, scoreHash }
        ├── Verify HMAC signature ─── 401 INVALID_TOKEN if wrong
        ├── Check expiry (30 min) ─── 401 TOKEN_EXPIRED if past
        ├── Look up session in DB ─── 401 SESSION_NOT_FOUND if missing
        ├── Check used=false ──────── 401 SESSION_ALREADY_USED if consumed
        ├── Mark session used=true (atomic one-time consumption)
        └─▶ Insert score
```

| ATTACK | PROTECTED |
|--------|-----------|
| `curl` with arbitrary score | ✓ — no valid token |
| Replaying the same token | ✓ — marked used after first submit |
| Expired token | ✓ — 30-min server-side TTL |
| Forged token signature | ✓ — HMAC-SHA256, secret server-only |

> **Dev mode:** if `GAME_SECRET` is not set, token verification is skipped with a console warning. The game works fully without it.

---

### SCORE HASH CHAIN

During gameplay, `src/utils/scoreHash.ts` builds a hash chain over every score increment:

```
hash₀ = '0'
hashₙ = djb2(hashₙ₋₁ + ":" + points + ":" + source + ":" + total)
```

The final hash is sent with the submission. Stored for future server-side replay verification — not yet enforced.

---

### CLIENT-SIDE DATA LAYER

`src/services/leaderboard.ts` is the single abstraction over all score I/O:

- `getScores()` — async, hits `/api/scores`, caches to localStorage on success, falls back to cache on error
- `saveScore(name, score, meta)` — saves locally first (sync, never lost), then posts to the API with `sessionToken` and `scoreHash` from `meta`
- `getLocalScores()` — sync read from `invadertony_scores_local` localStorage key
- `LeaderboardError(code)` — thrown for user-visible API rejections; EndPage catches it and shows the message with a shake animation

---

### SUPABASE SETUP

Run in the Supabase SQL editor:

```sql
-- Scores table
CREATE TABLE scores (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text NOT NULL,
  score      integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX scores_score_idx ON scores (score DESC);
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON scores FOR SELECT USING (true);

-- Game sessions table (for token verification)
CREATE TABLE game_sessions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid NOT NULL UNIQUE,
  issued_at   timestamptz NOT NULL,
  expires_at  timestamptz NOT NULL,
  used        boolean DEFAULT false NOT NULL,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX game_sessions_session_id_idx ON game_sessions (session_id);
CREATE INDEX game_sessions_expires_idx    ON game_sessions (expires_at);
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No public access" ON game_sessions USING (false);
```

---

### CLEANUP CRON

`GET /api/cleanup` deletes `game_sessions` rows with `expires_at` older than 2 hours.

- Runs daily at midnight UTC — configured in `vercel.json → crons`
- Protected by `Authorization: Bearer <CRON_SECRET>` — Vercel injects this automatically
- Returns `401` for any unauthenticated request

---

```
╔══════════════════════════════╗
║  ▶  PROJECT STRUCTURE        ║
╚══════════════════════════════╝
```

```
/
├── api/                             # Vercel Serverless Functions
│   ├── scores.js                    # GET  /api/scores
│   ├── scores/
│   │   └── submit.js                # POST /api/scores/submit
│   ├── session/
│   │   └── start.js                 # POST /api/session/start
│   └── cleanup.js                   # GET  /api/cleanup  (Vercel Cron)
│
├── public/                          # Static HTML pages (SEO-indexable)
│   ├── index.html                   # Landing page
│   ├── leaderboard.html             # Leaderboard (calls /api/scores)
│   ├── credits.html
│   └── how-to-play.html
│
├── src/
│   ├── main.ts                      # Entry point: loading screen → bg renderer → router
│   ├── router.ts                    # Hash-based SPA router — #home #game #end
│   ├── config.ts                    # All magic numbers (speeds, HP, wave definitions)
│   ├── vite-env.d.ts
│   │
│   ├── core/                        # Engine primitives
│   │   ├── GameLoop.ts
│   │   ├── GameState.ts             # State machine + event emitter
│   │   └── SceneSetup.ts
│   │
│   ├── entities/                    # Three.js game objects
│   │   ├── PlayerEntity.ts
│   │   ├── InvaderEntity.ts         # Grid enemies (basic + elite)
│   │   ├── BulletPool.ts            # Object-pooled projectiles
│   │   ├── BossEntity.ts            # Final boss entry point
│   │   ├── BossGeometry.ts
│   │   ├── BossMovement.ts
│   │   ├── BossAttack.ts
│   │   └── BossPhases.ts
│   │
│   ├── systems/                     # Stateless game systems
│   │   ├── AudioManager.ts          # Procedural SFX via Web Audio API
│   │   ├── ChiptunePlayer.ts        # Background music (blob URL, instant playback)
│   │   ├── CollisionSystem.ts
│   │   ├── GridMovement.ts
│   │   ├── InputManager.ts
│   │   ├── ParticleSystem.ts
│   │   ├── WaveManager.ts
│   │   └── WaveSpawner.ts
│   │
│   ├── orchestration/               # Wires systems + entities together
│   │   ├── GameOrchestrator.ts      # Main loop owner, session token fetch
│   │   ├── BossSpawner.ts
│   │   ├── EndConditions.ts
│   │   └── TonyModeController.ts
│   │
│   ├── rendering/                   # Post-processing pipeline
│   │   ├── PostProcessor.ts
│   │   ├── EffectManager.ts
│   │   ├── ShockwavePool.ts
│   │   └── StarfieldBackground.ts
│   │
│   ├── loading/                     # Asset preloading
│   │   ├── LoadingScreen.ts
│   │   ├── LoadingOverlay.ts
│   │   ├── AssetLoader.ts
│   │   └── AudioCache.ts
│   │
│   ├── background/
│   │   └── BackgroundRenderer.ts    # Persistent fullscreen starfield (all pages)
│   │
│   ├── pages/
│   │   ├── GamePage.ts              # Mounts Three.js canvas + HUD
│   │   ├── CreditsPage.ts
│   │   ├── home/
│   │   │   ├── HomePage.ts
│   │   │   ├── HomeDOM.ts
│   │   │   └── HomeController.ts
│   │   └── end/
│   │       ├── EndPage.ts           # Game Over / Victory + name entry + score submit
│   │       ├── EndDOM.ts
│   │       └── EndController.ts
│   │
│   ├── types/                       # Shared TypeScript interfaces
│   │   ├── entities.ts
│   │   ├── game.ts
│   │   └── rendering.ts
│   │
│   ├── services/
│   │   ├── leaderboard.ts           # API-first data layer + localStorage fallback
│   │   └── seo.ts
│   │
│   ├── ui/
│   │   └── HUD.ts
│   │
│   ├── utils/
│   │   ├── dom.ts                   # injectStyle / removeStyle
│   │   ├── formatScore.ts
│   │   ├── konamiCode.ts
│   │   └── scoreHash.ts             # djb2 hash chain for score verification
│   │
│   └── game/
│       └── shaders/                 # GLSL — imported via vite-plugin-glsl
│           ├── starfield/
│           ├── scanlines/
│           ├── shockwave/
│           └── dissolve/
│
├── eslint.config.js                 # ESLint 9 flat config (typescript-eslint)
├── .prettierrc                      # Prettier config
├── tsconfig.json
├── vercel.json                      # SPA rewrites + daily cron
└── vite.config.js
```

For a deeper explanation of module interactions and the rendering pipeline, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).  
For shader-by-shader documentation, see [`docs/SHADERS.md`](docs/SHADERS.md).

---

```
╔══════════════════════════════╗
║  ▶  ASSETS                   ║
╚══════════════════════════════╝
```

PNG sprites expected at `public/assets/`:

| FILE | USAGE |
|---|---|
| `tony_enemy1.png` | Basic enemy (suit) |
| `tony_enemy2.png` | Elite enemy (Elvis jumpsuit) |
| `tony_boss.png` | Final boss |
| `donne_ricche.ogg` | Background music loop |

Sprites use transparency (PNG with alpha) and are rendered with `NearestFilter` to preserve pixel-art crispness.

---

```
╔══════════════════════════════╗
║  ▶  PERFORMANCE NOTES        ║
╚══════════════════════════════╝
```

- **Object pooling** — bullets (30 player + 30 enemy), particles (200), shockwaves (5) are all pre-allocated. Zero `new` calls in the game loop.
- **Pre-allocated vectors** — `_pA` and `_pB` (`THREE.Vector3`) are module-level singletons reused for every collision check.
- **Shared textures** — all `basic` enemies share one texture instance; all `elite` enemies share another. Disposed together via `disposeInvaderResources()`.
- **Delta-time capped** — clamped to 50 ms per frame to prevent the spiral-of-death on tab focus restore.
- **Background renderer pauses** during gameplay — the game scene has its own embedded starfield, so the background canvas stops its rAF loop to save GPU bandwidth.
- **Asset preloading** — JS chunks, sprites, and background music are all preloaded at startup behind the loading screen. The game starts with everything in memory.

---

```
╔══════════════════════════════╗
║  ▶  LICENSE                  ║
╚══════════════════════════════╝
```

MIT — see [LICENSE](LICENSE)

---

<div align="center">

```
  ▄   ▄   ▄   ▄   ▄   ▄   ▄   ▄   ▄   ▄
 ███ ███ ███ ███ ███ ███ ███ ███ ███ ███
▀███▀███▀███▀███▀███▀███▀███▀███▀███▀███▀

        G A M E   O V E R

  INSERT COIN  ·  PRESS START  ·  👾
```

</div>
