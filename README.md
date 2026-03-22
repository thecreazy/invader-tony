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
- **Leaderboard** — top 10 scores persisted to Supabase via Vercel Serverless Functions, with localStorage as offline fallback; protected by signed session tokens and server-side anti-cheat validation
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
| Backend | Vercel Serverless Functions (Node.js ESM) |
| Database | Supabase (PostgreSQL via REST API) |
| Deploy | Vercel |

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
# Frontend only — no API endpoints available
pnpm dev

# Full stack — frontend + serverless functions + .env.local vars
pnpm dev:vercel   # alias for: vercel dev
```

Opens at `http://localhost:3000` (vercel dev) or `http://localhost:5173` (vite only).

> Use `pnpm dev:vercel` when working on anything that touches `/api/*`.
> Plain `pnpm dev` does not run serverless functions.

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

## Backend

### Environment variables

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

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/session/start` | Issue a signed game session token |
| `GET`  | `/api/scores` | Fetch top 10 scores (cacheable, `s-maxage=10`) |
| `POST` | `/api/scores/submit` | Validate and insert a new score |
| `GET`  | `/api/cleanup` | Delete expired sessions (Vercel Cron, hourly) |

---

### Score submission pipeline

`POST /api/scores/submit` runs these checks in order and short-circuits on the first failure:

1. Method must be `POST`
2. `Content-Type: application/json` required
3. Body must be a valid JSON object
4. `name` and `score` fields must be present
5. `score` must be a finite integer
6. IP rate limit — **3 requests/minute** per IP (in-memory, resets on cold start)
7. Score bounds — **10 ≤ score ≤ 4500** (game physical max + 20% buffer)
8. Name sanitization — uppercase, alphanumeric + space, max 8 chars
9. Name validity — not all-same-character (`AAAAAAAA`), not in blocked list
10. Profanity filter — checked against built-in word list
11. Session token verification — signature + expiry + one-time use (skipped if `GAME_SECRET` not set)
12. Global DB rate limit — max **30 inserts/minute** across all IPs (circuit breaker)
13. Duplicate guard — same name + score in the last 30 s → silent 200, no insert
14. Supabase insert → return updated top-10 leaderboard

**Error codes returned to the client:**

| Code | HTTP | Shown to player |
|------|------|-----------------|
| `NICKNAME_PROFANITY` | 400 | "NAME NOT ALLOWED" |
| `INVALID_NAME` | 400 | "INVALID NAME" |
| `RATE_LIMIT` | 429 | "SLOW DOWN!" |
| `MISSING_TOKEN` | 400 | "PLAY THE GAME FIRST" |
| `INVALID_TOKEN` | 401 | "INVALID SESSION" |
| `TOKEN_EXPIRED` | 401 | "SESSION EXPIRED" |
| `SESSION_ALREADY_USED` | 401 | "SESSION ALREADY USED" |
| `INVALID_SCORE` | 400 | silent — local fallback |
| `SERVER_ERROR` | 500 | silent — local fallback |

---

### Session token system

Prevents fake scores from being submitted without actually playing the game.

**Flow:**

```
Game starts
  └─> POST /api/session/start
        ├─ Generates UUID session ID
        ├─ Signs it with HMAC-SHA256 using GAME_SECRET
        ├─ Persists to game_sessions table (used: false, expires in 30 min)
        └─ Returns { token: "<base64url>.<hmac-sig>" }

Game ends (win or game over)
  └─> sessionStorage stores: token + score hash

Player submits score (End screen, on Enter)
  └─> POST /api/scores/submit { name, score, sessionToken, scoreHash }
        ├─ Verify HMAC signature → 401 INVALID_TOKEN if wrong
        ├─ Check expiry (30 min TTL) → 401 TOKEN_EXPIRED if past
        ├─ Look up session in DB → 401 SESSION_NOT_FOUND if missing
        ├─ Check used=false → 401 SESSION_ALREADY_USED if already consumed
        ├─ Mark session used=true (atomic one-time consumption)
        └─> Insert score
```

**What this prevents:**

| Attack | Protected |
|--------|-----------|
| `curl` with arbitrary score | Yes — no valid token |
| Replaying the same token | Yes — marked used after first submit |
| Expired token | Yes — 30-min server-side TTL |
| Forged token signature | Yes — HMAC-SHA256 with secret only the server knows |

**Dev mode:** if `GAME_SECRET` is not set, token verification is skipped with a console warning. The game works fully in local development without it.

---

### Score hash chain

During gameplay, `src/utils/scoreHash.js` builds a hash chain over every score increment using a djb2-style algorithm:

```
hash₀ = '0'
hashₙ = djb2(hashₙ₋₁ + ":" + points + ":" + source + ":" + total)
```

The final hash is sent with the submission. Currently stored for future server-side replay verification — not yet enforced.

---

### Client-side data layer

`src/services/leaderboard.js` is the single abstraction over all score I/O:

- `getScores()` — async, hits `/api/scores`, caches to localStorage on success, falls back to cache on error
- `saveScore(name, score, meta)` — saves locally first (sync, never lost), then posts to `/api/scores/submit` with `sessionToken` and `scoreHash` from `meta`
- `getLocalScores()` — sync read from `invadertony_scores_local` localStorage key
- `LeaderboardError(code)` — thrown for user-visible API rejections; EndPage catches it, shows the message and a shake animation on the name input

---

### Supabase setup

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

### Cleanup cron

`GET /api/cleanup` deletes `game_sessions` rows with `expires_at` older than 2 hours.

- Runs hourly — configured in `vercel.json → crons`
- Protected by `Authorization: Bearer <CRON_SECRET>` — Vercel injects this automatically for cron calls
- Returns 401 for any unauthenticated request

---

## Project Structure

```
/
├── api/                             # Vercel Serverless Functions
│   ├── scores.js                    # GET  /api/scores
│   ├── scores/
│   │   └── submit.js                # POST /api/scores/submit
│   ├── session/
│   │   └── start.js                 # POST /api/session/start
│   └── cleanup.js                   # GET  /api/cleanup (Vercel Cron)
│
├── public/                          # Static HTML pages (SEO-indexable)
│   ├── index.html                   # Landing page
│   ├── leaderboard.html             # Leaderboard (calls /api/scores)
│   ├── credits.html
│   └── how-to-play.html
│
├── src/
│   ├── main.js                      # Entry point: boots background renderer + router
│   ├── config.js                    # All magic numbers (speeds, HP, wave definitions)
│   ├── router.js                    # SPA router — /home /game /end
│   │
│   ├── background/
│   │   └── BackgroundRenderer.js    # Persistent fullscreen starfield (all pages)
│   │
│   ├── pages/
│   │   ├── HomePage.js / .css       # Title screen
│   │   ├── GamePage.js              # Mounts Three.js canvas + HUD
│   │   └── EndPage.js / .css        # Game Over / Victory + name entry + score submit
│   │
│   ├── game/
│   │   ├── Game.js                  # Main orchestrator, game loop, session token fetch
│   │   ├── GameState.js             # State machine + event emitter
│   │   ├── CollisionSystem.js
│   │   ├── WaveManager.js
│   │   │
│   │   ├── entities/
│   │   │   ├── Player.js
│   │   │   ├── Bullet.js            # Object-pooled projectiles
│   │   │   ├── TonyInvader.js       # Grid enemies (basic + elite)
│   │   │   └── BossTony.js          # Final boss
│   │   │
│   │   └── shaders/
│   │       ├── starfield/
│   │       ├── scanlines/
│   │       ├── shockwave/
│   │       └── dissolve/
│   │
│   ├── systems/
│   │   ├── AudioManager.js
│   │   ├── InputManager.js
│   │   ├── ParticleSystem.js
│   │   └── ChiptunePlayer.js
│   │
│   ├── ui/
│   │   └── HUD.js / .css
│   │
│   ├── services/
│   │   └── leaderboard.js           # API-first data layer + localStorage fallback
│   │
│   └── utils/
│       ├── dom.js                   # injectStyle / removeStyle
│       ├── formatScore.js
│       └── scoreHash.js             # djb2 hash chain for score verification
│
├── vercel.json                      # SPA rewrites + hourly cron
└── vite.config.js
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
