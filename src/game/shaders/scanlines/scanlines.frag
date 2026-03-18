// Scanlines shader — fragment stage (stub)
// Outputs solid magenta so unimplemented shaders are immediately obvious.

varying vec2 vUv;
uniform float uTime;
uniform sampler2D uTexture;

void main() {
  // TODO: implement CRT scanlines overlay
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
