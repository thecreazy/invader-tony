// Distortion shader — fragment stage (stub)
// Outputs solid magenta so unimplemented shaders are immediately obvious.

varying vec2 vUv;

void main() {
  // TODO: implement VHS-style UV distortion
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
