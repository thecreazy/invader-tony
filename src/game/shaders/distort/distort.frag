// distort.frag — procedural Nicolas Cage face shader
// Coordinate system: p = vUv * 2.0 - 1.0, range [-1, 1].
// Applied to a PlaneGeometry face quad on each CageInvader / BossCage.

uniform vec3  uColor;
uniform float uTime;
uniform float uGlitchIntensity;
uniform float uPhase;

varying vec2 vUv;

// ── SDF helpers ───────────────────────────────────────────────────────────────

float sdRect(vec2 p, vec2 c, vec2 h) {
  vec2 d = abs(p - c) - h;
  return max(d.x, d.y);
}

float ellD(vec2 p, vec2 c, vec2 r) {
  vec2 d = (p - c) / r;
  return dot(d, d);
}

// Rotated sdRect for angled eyebrows
float sdRectRot(vec2 p, vec2 c, vec2 h, float cosA, float sinA) {
  vec2 d = p - c;
  vec2 q = vec2(d.x * cosA + d.y * sinA, -d.x * sinA + d.y * cosA);
  vec2 e = abs(q) - h;
  return max(e.x, e.y);
}

// ── Face ──────────────────────────────────────────────────────────────────────

vec3 buildFace(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;

  // ── Skin base — warm tan ──────────────────────────────────────────────────
  vec3 col = vec3(0.85, 0.65, 0.42);

  // ── Cheek flush ──────────────────────────────────────────────────────────
  float lCheek = 1.0 - smoothstep(0.7, 1.0, ellD(p, vec2(-0.42, -0.12), vec2(0.22, 0.18)));
  float rCheek = 1.0 - smoothstep(0.7, 1.0, ellD(p, vec2( 0.42, -0.12), vec2(0.22, 0.18)));
  col += vec3(0.08, 0.02, 0.0) * max(lCheek, rCheek);

  // ── Hair — receding, thin on top, present on sides ───────────────────────
  // Side/back hair: thick strips left and right of center on top
  float sideHair = smoothstep(0.62, 0.68, p.y)
                 * smoothstep(0.50, 0.60, abs(p.x));
  col = mix(col, vec3(0.07, 0.04, 0.01), sideHair);

  // Very sparse thin wisps across the top center (receding)
  float wispMask = smoothstep(0.78, 0.82, p.y);
  col = mix(col, vec3(0.09, 0.05, 0.01), wispMask * 0.5);

  // Top hairline edge (soft)
  col = mix(col, vec3(0.07, 0.04, 0.01), smoothstep(0.88, 0.95, p.y));

  // ── Forehead shading — large brow, slight gradient ───────────────────────
  col -= 0.04 * smoothstep(0.10, 0.62, p.y);

  // ── Eyebrows — thick, dark, angled inward (intense) ──────────────────────
  // Left brow: slightly angled down toward nose
  float lBrow = step(0.0, -sdRectRot(p, vec2(-0.35, 0.24), vec2(0.19, 0.0385), 0.980, -0.199));
  // Right brow: mirror
  float rBrow = step(0.0, -sdRectRot(p, vec2( 0.35, 0.24), vec2(0.19, 0.0385), 0.980,  0.199));
  col = mix(col, vec3(0.08, 0.04, 0.01), max(lBrow, rBrow));

  // ── Eyes — droopy, wide ───────────────────────────────────────────────────
  float lEyeW = 1.0 - smoothstep(0.85, 1.0, ellD(p, vec2(-0.35, 0.05), vec2(0.22, 0.13)));
  float rEyeW = 1.0 - smoothstep(0.85, 1.0, ellD(p, vec2( 0.35, 0.05), vec2(0.22, 0.13)));
  float eyeW  = max(lEyeW, rEyeW);
  // Eye white
  col = mix(col, vec3(0.93, 0.91, 0.86), eyeW);

  // Iris — slightly large for wide-eyed "YOU DON'T SAY" look
  float lIris = 1.0 - smoothstep(0.7, 1.0, ellD(p, vec2(-0.35, 0.04), vec2(0.10, 0.12)));
  float rIris = 1.0 - smoothstep(0.7, 1.0, ellD(p, vec2( 0.35, 0.04), vec2(0.10, 0.12)));
  col = mix(col, vec3(0.28, 0.18, 0.06), max(lIris, rIris) * eyeW);

  // Pupil
  float lPup = 1.0 - smoothstep(0.4, 0.7, ellD(p, vec2(-0.35, 0.04), vec2(0.055, 0.065)));
  float rPup = 1.0 - smoothstep(0.4, 0.7, ellD(p, vec2( 0.35, 0.04), vec2(0.055, 0.065)));
  col = mix(col, vec3(0.03, 0.02, 0.01), max(lPup, rPup) * eyeW);

  // Catchlight
  float lHL = 1.0 - smoothstep(0.3, 0.7, ellD(p, vec2(-0.28, 0.10), vec2(0.030, 0.025)));
  float rHL = 1.0 - smoothstep(0.3, 0.7, ellD(p, vec2( 0.42, 0.10), vec2(0.030, 0.025)));
  col = mix(col, vec3(1.0), max(lHL, rHL) * eyeW);

  // Upper eyelid shadow — heavy droopy lid
  float lLid = step(0.0, -sdRect(p, vec2(-0.35, 0.145), vec2(0.22, 0.032))) * lEyeW;
  float rLid = step(0.0, -sdRect(p, vec2( 0.35, 0.145), vec2(0.22, 0.032))) * rEyeW;
  col = mix(col, vec3(0.32, 0.20, 0.10), max(lLid, rLid));

  // ── Nose — long, prominent, bulbous tip ──────────────────────────────────
  // Bridge
  float bridge = step(0.0, -sdRect(p, vec2(0.0, 0.09), vec2(0.07, 0.19)));
  col = mix(col, col * 0.82, bridge);

  // Bulbous tip — rounded lobe at bottom of nose
  float tipD  = length(p - vec2(0.0, -0.14));
  float tip   = smoothstep(0.20, 0.14, tipD);
  col = mix(col, col * 0.78, tip);

  // Nostrils
  float lNos = 1.0 - smoothstep(0.7, 1.0, ellD(p, vec2(-0.12, -0.22), vec2(0.065, 0.048)));
  float rNos = 1.0 - smoothstep(0.7, 1.0, ellD(p, vec2( 0.12, -0.22), vec2(0.065, 0.048)));
  col = mix(col, vec3(0.18, 0.09, 0.04), max(lNos, rNos));

  // ── Mouth — wide, thin-lipped, slightly open ──────────────────────────────
  // Dark mouth interior
  float mouthInner = step(0.0, -sdRect(p, vec2(0.0, -0.45), vec2(0.30, 0.038)));
  col = mix(col, vec3(0.12, 0.04, 0.04), mouthInner);

  // Teeth — white strip
  float teeth = step(0.0, -sdRect(p, vec2(0.0, -0.43), vec2(0.28, 0.020)));
  col = mix(col, vec3(0.96, 0.94, 0.88), teeth * mouthInner);

  // Tooth divisions — 3 thin dark vertical lines
  float td0 = step(0.0, -sdRect(p, vec2(-0.14, -0.43), vec2(0.007, 0.020))) * teeth;
  float td1 = step(0.0, -sdRect(p, vec2( 0.00, -0.43), vec2(0.007, 0.020))) * teeth;
  float td2 = step(0.0, -sdRect(p, vec2( 0.14, -0.43), vec2(0.007, 0.020))) * teeth;
  col = mix(col, vec3(0.18, 0.10, 0.08), max(max(td0, td1), td2));

  // Upper lip
  float upperLip = step(0.0, -sdRect(p, vec2(0.0, -0.395), vec2(0.38, 0.017)));
  col = mix(col, vec3(0.55, 0.25, 0.18), upperLip);

  // Lower lip
  float lowerLip = step(0.0, -sdRect(p, vec2(0.0, -0.485), vec2(0.36, 0.022)));
  col = mix(col, vec3(0.52, 0.22, 0.15), lowerLip);

  // ── Jaw / chin shadow ─────────────────────────────────────────────────────
  col *= 1.0 - 0.12 * (1.0 - smoothstep(-0.90, -0.60, p.y));

  col = clamp(col, 0.0, 1.0);
  return col;
}

// ── Glitch ────────────────────────────────────────────────────────────────────

vec3 buildFaceGlitched(vec2 uv, float intensity) {
  vec2 p = uv * 2.0 - 1.0;

  // Glitch bars: random horizontal slices shift sideways
  float bandRng  = fract(sin(floor(p.y * 15.0 + uTime * 8.0) * 43758.5453));
  float bandMask = step(0.94, bandRng) * intensity;
  float shift    = bandMask * intensity * 0.15;

  vec2 uvShifted = vec2(uv.x + shift, uv.y);

  // RGB split on shifted uv
  vec2 uvR = vec2(uvShifted.x + intensity * 0.035, uvShifted.y);
  vec2 uvB = vec2(uvShifted.x - intensity * 0.035, uvShifted.y);

  vec3 baseCol = buildFace(uvShifted);
  vec3 rCol    = buildFace(uvR);
  vec3 bCol    = buildFace(uvB);

  vec3 split = vec3(rCol.r, baseCol.g, bCol.b);
  return mix(baseCol, split, intensity);
}

// ── Main ──────────────────────────────────────────────────────────────────────

void main() {
  vec3 col = buildFaceGlitched(vUv, uGlitchIntensity);

  // Phase tint — redder as boss phases progress
  float p1 = step(1.0, uPhase);
  float p2 = step(2.0, uPhase);
  col = mix(col, mix(col, vec3(1.0, 0.0, 0.0), 0.18), p1);
  col = mix(col, mix(col, vec3(1.0, 0.0, 0.0), 0.40), p2);

  // Phase 2: boost contrast
  col = mix(col, (col - 0.45) * 1.5 + 0.45, p2 * 0.6);
  col = clamp(col, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}
