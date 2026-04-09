# Shader Documentation

All shaders are GLSL ES 1.00 (`WebGL 1` compatible), imported as strings via `vite-plugin-glsl` and compiled at runtime by Three.js.

Each shader pair lives in its own subfolder under `src/game/shaders/`. Vertex shaders handle geometry transformation; fragment shaders produce the final pixel colour.

> The consuming TypeScript modules import shaders with relative paths such as `../game/shaders/starfield/starfield.vert`. The shader directory is intentionally kept at `src/game/shaders/` as a stable location.

---

## Table of Contents

1. [Starfield](#1-starfield)
2. [Scanlines (CRT composite)](#2-scanlines-crt-composite)
3. [Shockwave](#3-shockwave)
4. [Dissolve](#4-dissolve)

---

## 1. Starfield

**Files:** `src/game/shaders/starfield/starfield.vert` · `starfield.frag`

**Used by:**
- `background/BackgroundRenderer.ts` — persistent canvas behind all pages (OrthographicCamera, `PlaneGeometry(2,2)`)
- `rendering/StarfieldBackground.ts` — 3D scene background plane at z = −5 (`PlaneGeometry(50,30)`, PerspectiveCamera)

### Vertex shader

Standard Three.js passthrough. No transformations beyond the camera matrices.

```glsl
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

`uv` comes directly from the `PlaneGeometry` attribute (0 → 1 in both axes).

### Fragment shader

| Uniform | Type | Description |
|---|---|---|
| `uTime` | `float` | Elapsed seconds since shader start |

The shader generates three independent star layers, composited additively, plus an occasional shooting star.

#### Layer 1 — Distant stars (static)

```
Grid:      80 × 45 cells
Threshold: hash > 0.97   (≈ 3% of cells contain a star)
Color:     vec3(0.7, 0.8, 1.0) — cool blue-white
Core size: smoothstep(0.012, 0.0, dist)
Twinkle:   0.6 + 0.4 * sin(uTime * (1 + h*3) + h*2π)
```

No scrolling. The faint, dense layer simulates a distant galaxy field.

#### Layer 2 — Mid-field stars (slow scroll)

```
Grid:      40 × 22 cells
Threshold: hash > 0.94   (≈ 6% fill)
Scroll:    uv.y += uTime * 0.04    (wraps via fract)
Color:     vec3(1.0, 0.95, 0.8)   — warm white
Core size: smoothstep(0.018, 0.0, dist)
Halo:      smoothstep(0.06,  0.0, dist) * 0.25
Twinkle:   0.7 + 0.3 * sin(...)
```

The soft halo around each star simulates atmospheric scattering.

#### Layer 3 — Near stars (fast scroll, neon)

```
Grid:      20 × 11 cells
Threshold: hash > 0.92   (≈ 8% fill)
Scroll:    uv.y += uTime * 0.10
Color:     vec3(0.8, 0.6, 1.0)   — neon purple
Core size: smoothstep(0.025, 0.0, dist)
Halo:      smoothstep(0.10,  0.0, dist) * 0.30
```

Larger, brighter, and faster. Creates a sense of depth through parallax.

#### Star placement within cells

Each cell's star is not centred — it's jittered using two secondary hashes:

```glsl
float hx = hash(cell + vec2(1.73, 0.0));
float hy = hash(cell + vec2(0.0,  1.73));
vec2 center = vec2(0.15 + hx * 0.7, 0.15 + hy * 0.7);
```

This breaks the regularity of the grid and makes the field look organic.

#### Shooting star

Fires on an 8-second cycle. Active for 0.4 s (5% of the cycle):

```glsl
float cycleT = fract(uTime * 0.125);   // period = 8 s
if (cycleT < 0.05) {                   // active window
  float prog = cycleT / 0.05;          // 0 → 1 during active window
  ...
}
```

The streak is rendered as a thin line segment in UV space from `(0.85, 0.05)` to `(0.18, 0.78)`. For each fragment:

1. Project `vUv` onto the streak direction vector to get `along` (distance along streak) and `perp` (perpendicular distance).
2. The head position advances as `prog * totalLength`.
3. Fragments within the trailing window `[headPos − tailLen, headPos]` are rendered.
4. Brightness fades from 0 at the tail root to 1 at the head (`fade` factor), creating the comet-tail falloff.
5. Perpendicular falloff: `smoothstep(0.006, 0.0, perp)` — streak is ~1px wide in UV space.
6. Color interpolates from cyan (tail) to white (head).
7. A `lifeFade` factor dims the streak as it approaches the end of its active window.

---

## 2. Scanlines (CRT composite)

**Files:** `src/game/shaders/scanlines/scanlines.vert` · `scanlines.frag`

**Used by:** `rendering/PostProcessor.ts` — final post-processing pass from the last intermediate `WebGLRenderTarget` to the screen.

### Vertex shader

Bypasses camera matrix multiplication entirely. The `PlaneGeometry(2,2)` with a `PlaneGeometry` in an `OrthographicCamera(-1,1,1,-1,0,1)` maps directly to NDC space:

```glsl
gl_Position = vec4(position.xy, 0.0, 1.0);
```

Equivalent to a fullscreen triangle trick without the matrix overhead.

### Fragment shader

Applied after all gameplay rendering. Stacks seven distinct effects in order:

| Uniform | Type | Default | Description |
|---|---|---|---|
| `uTexture` | `sampler2D` | — | Input frame from previous pass |
| `uTime` | `float` | — | Elapsed seconds |
| `uIntensity` | `float` | 0.8 | Global CRT effect strength multiplier |
| `uTonyMode` | `float` | 0.0 | 1.0 activates extreme glitch effects |
| `uResolution` | `vec2` | — | Viewport dimensions in pixels |
| `uChromaticAberration` | `float` | 0.001 | Base RGB split width (boss-reactive) |
| `uDamageFlash` | `float` | 0.0 | Red screen overlay intensity (0–1) |
| `uWarpIntensity` | `float` | 0.0 | Wave-transition UV warp (0–1) |

#### Effect 1 — Wave warp (pre-barrel)

Active only when `uWarpIntensity > 0`. Distorts `baseUv` before sampling:

```glsl
vec2 dir  = vUv - 0.5;
float dist = length(dir);
float warp = uWarpIntensity * 0.15 * (1.0 - dist);
baseUv = vUv + dir * warp * sin(uTime * 15.0 + dist * 20.0);
```

This creates a radial ripple that emanates outward from the screen centre, with a high-frequency sin modulation giving it a "jump-cut" warp feel. Applied to the UV before barrel distortion so both effects compose correctly.

#### Effect 2 — Barrel distortion

Classic CRT curve:

```glsl
vec2 cuv = baseUv - 0.5;
cuv *= 1.0 + dot(cuv, cuv) * 0.06 * uIntensity;
cuv += 0.5;
```

`dot(cuv, cuv)` is the squared distance from centre — fragments further from centre are scaled outward more, bending the image as a CRT phosphor screen would. `inBounds` masks the black area outside the distorted image.

The final `sampleUV` blends between the undistorted and distorted UV based on intensity.

#### Effect 3 — Chromatic aberration

```glsl
vec2 caOff = vec2(uChromaticAberration + edgeDist * 0.003, 0.0);
col.r = texture2D(uTexture, sampleUV + caOff).r;
col.g = texture2D(uTexture, sampleUV).g;
col.b = texture2D(uTexture, sampleUV - caOff).b;
```

The red channel is sampled offset to the right, blue to the left. The offset increases toward screen edges (`edgeDist * 0.003`) and scales with `uChromaticAberration`. During boss fights, `Game.js` ramps this uniform from `0.001` (baseline) to `0.009` as the boss loses HP, making the screen feel increasingly unstable.

#### Effect 4 — CRT scanlines

Two sub-effects stacked:

```glsl
float row  = floor(vUv.y * uResolution.y);
float line = step(0.5, fract(row * 0.5)) * 0.09 * uIntensity;
col.rgb -= line;
col.rgb -= sin(vUv.y * uResolution.y * 1.5) * 0.022 * uIntensity;
```

- `fract(row * 0.5)` creates a pattern that alternates every 2 pixels — dark bands at every even row.
- The `sin` adds a softer continuous wave on top, simulating the shadow mask of a CRT phosphor grid.

#### Effect 5 — Vignette

```glsl
vec2  v        = vUv * (1.0 - vUv.yx);
float vignette = pow(v.x * v.y * 15.0, 0.4);
col.rgb *= mix(1.0, vignette, 0.7 * uIntensity);
```

`vUv * (1.0 - vUv.yx)` produces a value that goes to 0 at all four edges and peaks at the centre. `pow(..., 0.4)` softens the falloff. This darkens the image corners like the curved glass of a CRT tube.

#### Effect 6 — Film grain

```glsl
float grain = rand(vUv + fract(uTime * 0.31));
col.rgb += (grain - 0.5) * 0.04 * uIntensity;
```

Per-frame temporal noise: the UV offset `fract(uTime * 0.31)` changes each frame, preventing the grain from being static. Centred at 0 with amplitude ±0.02.

#### Effect 7 — Tony Mode

Activated when `uTonyMode > 0.5` (set when the boss enters phase 2):

```glsl
col.rgb = hueShift(col.rgb, uTime * 2.0);            // rainbow colour rotation
col.r = texture2D(uTexture, sampleUV + vec2(0.015, 0)).r;   // extreme R offset
col.b = texture2D(uTexture, sampleUV - vec2(0.015, 0)).b;   // extreme B offset
col.rgb *= 0.85 + 0.15 * sin(uTime * 47.3);           // brightness flicker
float inv = step(0.975, fract(uTime * 3.1));
col.rgb = mix(col.rgb, 1.0 - col.rgb, inv);            // random full inversion ~7×/s
col.rgb += (rand(vUv + fract(uTime * 0.77)) - 0.5) * 0.22; // heavy grain
```

`hueShift` uses a Rodrigues rotation around the grey axis `(1/√3, 1/√3, 1/√3)` — a matrix-free hue rotation that preserves luminance.

#### Effect 8 — Damage flash

```glsl
col.rgb = mix(col.rgb, vec3(1.0, 0.0, 0.0), uDamageFlash * 0.35);
```

Blends the composited frame toward solid red at 35% weight. `uDamageFlash` decays at 3.3 units/s in `updateEffects()`, giving a ~300ms fade. Applied last so it overlays all other effects.

---

## 3. Shockwave

**Files:** `src/game/shaders/shockwave/shockwave.vert` · `shockwave.frag`

**Used by:** `rendering/ShockwavePool.ts` — ping-pong intermediate passes between the game scene render and the final scanlines pass. Up to 5 simultaneous shockwaves (pool size).

### Vertex shader

Identical to `scanlines.vert` — NDC passthrough with no matrix multiplication.

### Fragment shader

| Uniform | Type | Description |
|---|---|---|
| `uTexture` | `sampler2D` | Input frame (previous render target) |
| `uCenter` | `vec2` | Explosion origin in UV space (0–1) |
| `uProgress` | `float` | 0 → 1 over the shockwave lifetime |
| `uStrength` | `float` | Maximum UV displacement (default 0.35) |

#### Ring expansion

```glsl
float aspect = 16.0 / 9.0;
vec2  dAsp   = vec2(delta.x * aspect, delta.y);
float dist   = length(dAsp);
```

The aspect correction ensures the ring stays circular on widescreen displays (without it, the ring would be an ellipse).

```glsl
float ring      = abs(dist - uProgress * 0.55);
float intensity = smoothstep(0.06, 0.0, ring) * (1.0 - uProgress) * uStrength;
```

- `uProgress * 0.55` is the current ring radius in UV space — the ring expands outward over time.
- `abs(dist - radius)` measures how close a fragment is to the ring edge. `smoothstep(0.06, 0.0, ...)` creates a soft 0.06-UV-wide band.
- `(1.0 - uProgress)` fades the ring to zero as it reaches full expansion.

```glsl
vec2 dir   = delta / max(length(delta), 0.001);
vec2 uvDst = clamp(vUv + dir * intensity, 0.0, 1.0);
```

The UV distortion pushes pixels outward along the radial direction. The epicentre guard (`max(length, 0.001)`) prevents division-by-zero at the exact origin.

#### Epicentre flash

```glsl
float flash = smoothstep(0.12, 0.0, uProgress)
            * smoothstep(0.10, 0.0, length(delta))
            * 0.85;
col.rgb = mix(col.rgb, vec3(1.0), flash);
```

Only visible in the first ~12% of the animation (`smoothstep(0.12, 0.0, uProgress)`) and only within 0.10 UV units of the centre. Creates a brief white flash at the detonation point.

---

## 4. Dissolve

**Files:** `src/game/shaders/dissolve/dissolve.vert` · `dissolve.frag`

**Used by:** `entities/InvaderEntity.ts` — swapped onto an enemy's mesh material on `takeDamage()`.

### Vertex shader

Standard Three.js passthrough — same as the starfield vertex shader.

### Fragment shader

| Uniform | Type | Description |
|---|---|---|
| `uTexture` | `sampler2D` | The enemy's sprite texture |
| `uProgress` | `float` | 0.0 = fully visible, 1.0 = fully dissolved |
| `uTime` | `float` | Elapsed seconds since dissolve started |

`uProgress` is animated from 0 → 1 over 0.4 s in `InvaderEntity.update()` (delta × 2.5 per frame).

#### Noise dissolve threshold

```glsl
float noise = fract(sin(dot(vUv * 10.0, vec2(127.1, 311.7))) * 43758.5453);
if (noise < uProgress) discard;
```

The hash function maps each UV position to a pseudo-random value in [0, 1). As `uProgress` increases, an increasing fraction of fragments are discarded — the dissolve sweeps across the sprite in a non-uniform, noisy pattern rather than a simple wipe.

The `vUv * 10.0` scale factor controls the granularity: higher = smaller, more numerous holes. At `* 10.0`, each "pixel" of noise covers ~1/10th of the UV range, producing a mid-grain dissolve appropriate for a 0.9-unit sprite.

The noise is static (no time offset), so the same UV coordinate always dissolves in the same sequence — the pattern is deterministic and coherent frame-to-frame.

#### Edge glow

```glsl
float edge      = smoothstep(uProgress, uProgress + 0.15, noise);
float edgePulse = 1.0 + 0.4 * sin(uTime * 25.0 + vUv.x * 8.0);
vec3  edgeColor = mix(vec3(1.0, 0.35, 0.0) * edgePulse, color.rgb, edge);
```

- `smoothstep(uProgress, uProgress + 0.15, noise)` produces 0 for fragments just above the threshold (freshly exposed edge) and 1 for fragments safely inside the surviving region.
- Fragments at the edge (`edge ≈ 0`) take the orange/yellow emissive colour.
- Fragments away from the edge (`edge ≈ 1`) take the original sprite colour.
- `edgePulse` modulates the edge colour at 25 Hz with a spatial offset — the glow flickers rapidly, simulating burning pixels.
- Alpha is `color.a * edge`: edge fragments are fully opaque; the boundary fades to transparent, avoiding a hard cutoff.

---

## Utility Functions (shared patterns)

### `hash(vec2 p) → float`

Used in starfield and dissolve:

```glsl
fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453)
```

A classic low-quality but GPU-fast integer hash. The large multiplier `43758.5453` amplifies small differences in `dot(p, k)` so that adjacent inputs produce uncorrelated outputs. `fract` brings the result back into [0, 1).

### `hueShift(vec3 color, float angle) → vec3`

Used in scanlines (Tony Mode):

```glsl
float c = cos(angle); float s = sin(angle);
vec3  k = vec3(0.57735026919);  // 1/sqrt(3)
return color * c + cross(k, color) * s + k * dot(k, color) * (1.0 - c);
```

Rodrigues' rotation formula applied to RGB colour space, rotating around the neutral grey axis `(1,1,1)/√3`. This rotates hue while preserving luminance, equivalent to a 3×3 hue-rotation matrix but without the matrix multiply.

### `rand(vec2 co) → float`

Used in scanlines (grain):

```glsl
fract(sin(dot(co, vec2(127.1, 311.7))) * 43758.5453)
```

Same hash function, used with `vUv + fract(uTime * k)` as input to produce animated noise that changes every frame.
