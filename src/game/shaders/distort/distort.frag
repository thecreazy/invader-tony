// distort.frag — procedural Nicholas Cage face shader
// Draws a stylised face entirely from math. No textures.
// Applied to the head sphere of each CageInvader / BossCage.

uniform vec3  uColor;          // base skin tone
uniform float uTime;
uniform float uGlitchIntensity; // 0 = normal, 1 = full chaos
uniform float uPhase;           // 0, 1, 2  — boss phase tint

varying vec2 vUv;

// ── SDF helpers ──────────────────────────────────────────────────────────────

float sdRect(vec2 p, vec2 center, vec2 half) {
  vec2 d = abs(p - center) - half;
  return max(d.x, d.y);
}

float ellipseD(vec2 p, vec2 center, vec2 radius) {
  vec2 d = (p - center) / radius;
  return dot(d, d);
}

// ── Face construction ─────────────────────────────────────────────────────────
// UV space: sphere front maps U 0.25→0.75, V 0→1.
// We remap so p.x ∈ [-0.5, 0.5], p.y ∈ [-0.5, 0.5]
// (multiply uv.x - 0.5 by 2 to compensate for spherical U range).

vec3 buildFace(vec2 uv) {
  vec2 p;
  p.x = (uv.x - 0.5) * 2.0; // normalise spherical U range
  p.y =  uv.y - 0.5;

  vec3 col = uColor;

  // ── Hair (dark cap on top) ─────────────────────────────────────────────
  float hairMask = smoothstep(0.28, 0.34, p.y);
  col = mix(col, vec3(0.06, 0.03, 0.0), hairMask);

  // ── Forehead shading ───────────────────────────────────────────────────
  col *= 1.0 - 0.08 * smoothstep(0.10, 0.28, p.y);

  // ── Eyebrows ───────────────────────────────────────────────────────────
  float lBrow = step(0.0, -sdRect(p, vec2(-0.22, 0.17), vec2(0.12, 0.028)));
  float rBrow = step(0.0, -sdRect(p, vec2( 0.22, 0.17), vec2(0.12, 0.028)));
  col = mix(col, vec3(0.07, 0.03, 0.0), max(lBrow, rBrow));

  // ── Eyes ──────────────────────────────────────────────────────────────
  float lEye = 1.0 - smoothstep(0.85, 1.0, ellipseD(p, vec2(-0.22, 0.07), vec2(0.11, 0.07)));
  float rEye = 1.0 - smoothstep(0.85, 1.0, ellipseD(p, vec2( 0.22, 0.07), vec2(0.11, 0.07)));
  col = mix(col, vec3(0.10, 0.05, 0.01), max(lEye, rEye));

  // Iris (slightly lighter brown ring)
  float lIris = 1.0 - smoothstep(0.5, 0.75, ellipseD(p, vec2(-0.22, 0.07), vec2(0.07, 0.045)));
  float rIris = 1.0 - smoothstep(0.5, 0.75, ellipseD(p, vec2( 0.22, 0.07), vec2(0.07, 0.045)));
  col = mix(col, vec3(0.22, 0.12, 0.04), max(lIris, rIris) * max(lEye, rEye));

  // Pupils
  float lPup = 1.0 - smoothstep(0.3, 0.5, ellipseD(p, vec2(-0.22, 0.06), vec2(0.038, 0.028)));
  float rPup = 1.0 - smoothstep(0.3, 0.5, ellipseD(p, vec2( 0.22, 0.06), vec2(0.038, 0.028)));
  col = mix(col, vec3(0.02, 0.01, 0.0), max(lPup, rPup));

  // Highlights
  float lHL = 1.0 - smoothstep(0.3, 0.6, ellipseD(p, vec2(-0.17, 0.10), vec2(0.022, 0.018)));
  float rHL = 1.0 - smoothstep(0.3, 0.6, ellipseD(p, vec2( 0.27, 0.10), vec2(0.022, 0.018)));
  col = mix(col, vec3(1.0), max(lHL, rHL));

  // ── Nose bridge ──────────────────────────────────────────────────────
  float nose = step(0.0, -sdRect(p, vec2(0.0, -0.02), vec2(0.06, 0.09)));
  col = mix(col, uColor * 0.72, nose);
  // Nostrils
  float lNos = 1.0 - smoothstep(0.7, 1.0, ellipseD(p, vec2(-0.07, -0.10), vec2(0.042, 0.03)));
  float rNos = 1.0 - smoothstep(0.7, 1.0, ellipseD(p, vec2( 0.07, -0.10), vec2(0.042, 0.03)));
  col = mix(col, uColor * 0.55, max(lNos, rNos));

  // ── Mouth ────────────────────────────────────────────────────────────
  float mouth = step(0.0, -sdRect(p, vec2(0.02, -0.22), vec2(0.22, 0.042)));
  col = mix(col, vec3(0.05, 0.01, 0.01), mouth);

  // Teeth (4 rects inside mouth)
  float t0 = step(0.0, -sdRect(p, vec2(-0.14, -0.217), vec2(0.038, 0.026)));
  float t1 = step(0.0, -sdRect(p, vec2(-0.05, -0.217), vec2(0.038, 0.026)));
  float t2 = step(0.0, -sdRect(p, vec2( 0.05, -0.217), vec2(0.038, 0.026)));
  float t3 = step(0.0, -sdRect(p, vec2( 0.14, -0.217), vec2(0.038, 0.026)));
  float teeth = max(max(t0, t1), max(t2, t3)) * mouth;
  col = mix(col, vec3(0.96, 0.94, 0.88), teeth);

  // ── Jaw / chin shadow ────────────────────────────────────────────────
  col *= 1.0 - 0.10 * smoothstep(-0.42, -0.28, p.y);

  return col;
}

// ── Glitch ────────────────────────────────────────────────────────────────────

vec3 buildFaceGlitched(vec2 uv, float intensity) {
  // Horizontal glitch bands
  float bandRng   = fract(sin(floor(uv.y * 18.0) + uTime * 8.0) * 43758.5453);
  float bandMask  = step(1.0 - intensity * 0.6, bandRng) * intensity;

  vec2 uvR = vec2(uv.x + intensity * 0.04 + bandMask * 0.08, uv.y);
  vec2 uvB = vec2(uv.x - intensity * 0.04 - bandMask * 0.08, uv.y);

  vec3 baseCol = buildFace(uv);
  vec3 rCol    = buildFace(uvR);
  vec3 bCol    = buildFace(uvB);

  vec3 split = vec3(rCol.r, baseCol.g, bCol.b);
  return mix(baseCol, split, intensity);
}

// ── Main ─────────────────────────────────────────────────────────────────────

void main() {
  vec3 col = buildFaceGlitched(vUv, uGlitchIntensity);

  // Phase tint: gradually redder as boss gets angrier
  float p1 = step(1.0, uPhase);
  float p2 = step(2.0, uPhase);
  col = mix(col, mix(col, vec3(1.0, 0.0, 0.0), 0.18), p1);
  col = mix(col, mix(col, vec3(1.0, 0.0, 0.0), 0.40), p2);

  // Phase 2: boost contrast
  col = mix(col, (col - 0.45) * 1.5 + 0.45, p2 * 0.6);
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
