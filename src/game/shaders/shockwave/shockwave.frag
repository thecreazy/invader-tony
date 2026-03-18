// Shockwave shader — fragment stage (stub)
// Outputs solid magenta so unimplemented shaders are immediately obvious.

varying vec2 vUv;
uniform float uTime;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uStrength;

void main() {
  // TODO: implement expanding radial shockwave ripple
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
