// dissolve.frag — noise-threshold pixel dissolve with burning-edge glow
// uProgress: 0.0 = fully visible, 1.0 = fully dissolved

uniform sampler2D uTexture;
uniform float     uProgress;
uniform float     uTime;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(uTexture, vUv);

  // Discard transparent sprite pixels early
  if (color.a < 0.1) discard;

  // High-frequency per-pixel noise (static — tied to UV, not time)
  float noise = fract(sin(dot(vUv * 10.0, vec2(127.1, 311.7))) * 43758.5453);

  // Dissolve: discard pixels whose noise falls below the sweep threshold
  if (noise < uProgress) discard;

  // Edge glow — pixels near the dissolve boundary burn orange/yellow
  float edge      = smoothstep(uProgress, uProgress + 0.15, noise);
  float edgePulse = 1.0 + 0.4 * sin(uTime * 25.0 + vUv.x * 8.0);
  vec3  edgeColor = mix(vec3(1.0, 0.35, 0.0) * edgePulse, color.rgb, edge);

  gl_FragColor = vec4(edgeColor, color.a * edge);
}
