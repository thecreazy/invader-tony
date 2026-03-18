// Scanlines shader — vertex stage
// Full-screen quad passthrough; scanlines are applied per-fragment.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
