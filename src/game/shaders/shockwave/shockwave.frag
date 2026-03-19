// shockwave.frag — radial expanding ring distortion for explosions

uniform sampler2D uTexture;
uniform vec2      uCenter;    // UV-space origin of explosion (0..1)
uniform float     uProgress;  // 0 → 1  (time since detonation, normalised)
uniform float     uStrength;

varying vec2 vUv;

void main() {
  vec2  delta  = vUv - uCenter;

  // Aspect-correct distance so ring stays circular
  float aspect = 16.0 / 9.0;
  vec2  dAsp   = vec2(delta.x * aspect, delta.y);
  float dist   = length(dAsp);

  // Ring = thin band that travels outward
  float ring      = abs(dist - uProgress * 0.55);
  float intensity = smoothstep(0.06, 0.0, ring)
                  * (1.0 - uProgress)
                  * uStrength;

  // Push UV outward along the ring gradient
  vec2 dir   = delta / max(length(delta), 0.001);
  vec2 uvDst = clamp(vUv + dir * intensity, 0.0, 1.0);

  vec4 col = texture2D(uTexture, uvDst);

  // White flash at the epicentre when the ring first fires
  float flash = smoothstep(0.12, 0.0, uProgress)
              * smoothstep(0.10, 0.0, length(delta))
              * 0.85;
  col.rgb = mix(col.rgb, vec3(1.0), flash);

  gl_FragColor = col;
}
