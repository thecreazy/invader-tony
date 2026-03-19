// starfield.frag — 3-layer parallax starfield with shooting star
// Rendered on a PlaneGeometry at z=-5, behind all game objects.

uniform float uTime;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Returns (distance-to-star-center, cell-hash) for a given UV and grid size.
vec2 cellSample(vec2 uv, vec2 grid) {
  vec2 scaled = uv * grid;
  vec2 cell   = floor(scaled);
  vec2 local  = fract(scaled);
  float hx     = hash(cell + vec2(1.73, 0.0));
  float hy     = hash(cell + vec2(0.0,  1.73));
  vec2  center = vec2(0.15 + hx * 0.7, 0.15 + hy * 0.7);
  return vec2(length(local - center), hash(cell));
}

void main() {
  vec3 color = vec3(0.0);

  // ── Layer 1: distant, cool blue-white, static ──────────────────────────────
  {
    vec2 s = cellSample(vUv, vec2(80.0, 45.0));
    float dist = s.x;
    float h    = s.y;
    if (h > 0.97) {
      float twinkle = 0.6 + 0.4 * sin(uTime * (1.0 + h * 3.0) + h * 6.2832);
      float core    = smoothstep(0.012, 0.0, dist);
      color += core * twinkle * vec3(0.7, 0.8, 1.0) * 0.90;
    }
  }

  // ── Layer 2: medium, warm white, gentle downward scroll + soft glow ────────
  {
    vec2 uv = vec2(vUv.x, fract(vUv.y + uTime * 0.04));
    vec2 s  = cellSample(uv, vec2(40.0, 22.0));
    float dist = s.x;
    float h    = s.y;
    if (h > 0.94) {
      float twinkle = 0.7 + 0.3 * sin(uTime * (0.8 + h * 2.0) + h * 6.2832);
      float core    = smoothstep(0.018, 0.0, dist);
      float halo    = smoothstep(0.06,  0.0, dist) * 0.25;
      color += (core + halo) * twinkle * vec3(1.0, 0.95, 0.8);
    }
  }

  // ── Layer 3: close, neon purple, fast scroll + large glow ─────────────────
  {
    vec2 uv = vec2(vUv.x, fract(vUv.y + uTime * 0.10));
    vec2 s  = cellSample(uv, vec2(20.0, 11.0));
    float dist = s.x;
    float h    = s.y;
    if (h > 0.92) {
      float twinkle = 0.65 + 0.35 * sin(uTime * (1.5 + h * 2.5) + h * 6.2832);
      float core    = smoothstep(0.025, 0.0, dist);
      float halo    = smoothstep(0.10,  0.0, dist) * 0.30;
      color += (core + halo) * twinkle * vec3(0.8, 0.6, 1.0) * 1.1;
    }
  }

  // ── Shooting star ─────────────────────────────────────────────────────────
  // 8-second cycle; active for 0.4 s (= 0.05 of cycle)
  {
    float cycleT = fract(uTime * 0.125);
    if (cycleT < 0.05) {
      float prog = cycleT / 0.05;

      vec2  A       = vec2(0.85, 0.05);
      vec2  B       = vec2(0.18, 0.78);
      vec2  dir     = normalize(B - A);
      float total   = length(B - A);
      float tailLen = 0.14;
      float headD   = prog * total;

      vec2  toP  = vUv - A;
      float along = dot(toP, dir);
      float perp  = length(toP - along * dir);

      float tailStart = max(0.0, headD - tailLen);
      float inTail    = step(tailStart, along) * step(along, headD);
      float fade      = clamp((along - tailStart) / max(tailLen, 0.0001), 0.0, 1.0);
      float streak    = inTail * smoothstep(0.006, 0.0, perp) * fade;
      float lifeFade  = 1.0 - smoothstep(0.7, 1.0, prog);

      color += mix(vec3(0.0, 0.85, 1.0), vec3(1.0), fade) * streak * lifeFade * 2.5;
    }
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
