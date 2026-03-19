// scanlines.frag — full CRT post-processing pass
// Effects: barrel distortion, warp, scanlines, vignette, film grain,
//          chromatic aberration (boss-reactive), Tony Mode,
//          damage flash, wave-transition warp.

uniform sampler2D uTexture;
uniform float     uTime;
uniform float     uIntensity;
uniform float     uTonyMode;
uniform vec2      uResolution;
uniform float     uChromaticAberration; // 0.001 baseline → 0.009 at boss death
uniform float     uDamageFlash;         // 0.0–1.0, fades to 0 after player hit
uniform float     uWarpIntensity;       // 0.0–1.0, wave transition warp

varying vec2 vUv;

// ── Hue rotation (Rodrigues around grey axis 1/√3, 1/√3, 1/√3) ───────────────
vec3 hueShift(vec3 color, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  vec3  k = vec3(0.57735026919);
  return color * c + cross(k, color) * s + k * dot(k, color) * (1.0 - c);
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  // ── Wave-transition warp ───────────────────────────────────────────────────
  // Applied to the base UV before barrel distortion.
  vec2 baseUv = vUv;
  if (uWarpIntensity > 0.0) {
    vec2  dir  = vUv - 0.5;
    float dist = length(dir);
    float warp = uWarpIntensity * 0.15 * (1.0 - dist);
    baseUv = vUv + dir * warp * sin(uTime * 15.0 + dist * 20.0);
    baseUv = clamp(baseUv, 0.0, 1.0);
  }

  // ── Barrel distortion ─────────────────────────────────────────────────────
  vec2  cuv    = baseUv - 0.5;
  float barrel = dot(cuv, cuv) * 0.06 * uIntensity;
  cuv *= 1.0 + barrel;
  cuv += 0.5;

  float inBounds = step(0.0, cuv.x) * step(cuv.x, 1.0)
                 * step(0.0, cuv.y) * step(cuv.y, 1.0);

  vec2 sampleUV = mix(baseUv, cuv, uIntensity * 0.65);

  // ── Chromatic aberration (boss-reactive via uChromaticAberration) ──────────
  float edgeDist = length(vUv - 0.5);
  vec2  caOff    = vec2(uChromaticAberration + edgeDist * 0.003, 0.0);

  vec4 col;
  col.r = texture2D(uTexture, clamp(sampleUV + caOff, 0.0, 1.0)).r;
  col.g = texture2D(uTexture, clamp(sampleUV,         0.0, 1.0)).g;
  col.b = texture2D(uTexture, clamp(sampleUV - caOff, 0.0, 1.0)).b;
  col.a = 1.0;

  // Black outside barrel
  col.rgb *= inBounds;

  // ── CRT scanlines ─────────────────────────────────────────────────────────
  float row  = floor(vUv.y * uResolution.y);
  float line = step(0.5, fract(row * 0.5)) * 0.09 * uIntensity;
  col.rgb   -= line;
  col.rgb   -= sin(vUv.y * uResolution.y * 1.5) * 0.022 * uIntensity;

  // ── Vignette ──────────────────────────────────────────────────────────────
  vec2  v        = vUv * (1.0 - vUv.yx);
  float vignette = pow(v.x * v.y * 15.0, 0.4);
  col.rgb *= mix(1.0, vignette, 0.7 * uIntensity);

  // ── Film grain ────────────────────────────────────────────────────────────
  float grain = rand(vUv + fract(uTime * 0.31));
  col.rgb    += (grain - 0.5) * 0.04 * uIntensity;

  // ── Tony Mode ─────────────────────────────────────────────────────────────
  if (uTonyMode > 0.5) {
    col.rgb = hueShift(col.rgb, uTime * 2.0);

    vec2 ncOff = vec2(0.015, 0.0);
    col.r = texture2D(uTexture, clamp(sampleUV + ncOff, 0.0, 1.0)).r;
    col.b = texture2D(uTexture, clamp(sampleUV - ncOff, 0.0, 1.0)).b;

    col.rgb *= 0.85 + 0.15 * sin(uTime * 47.3);

    float inv = step(0.975, fract(uTime * 3.1));
    col.rgb    = mix(col.rgb, 1.0 - col.rgb, inv);

    float ncGrain = rand(vUv + fract(uTime * 0.77));
    col.rgb      += (ncGrain - 0.5) * 0.22;
  }

  // ── Damage flash ──────────────────────────────────────────────────────────
  if (uDamageFlash > 0.0) {
    col.rgb = mix(col.rgb, vec3(1.0, 0.0, 0.0), uDamageFlash * 0.35);
  }

  col.rgb = clamp(col.rgb, 0.0, 1.0);
  gl_FragColor = col;
}
