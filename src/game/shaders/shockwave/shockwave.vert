// Shockwave shader — vertex stage
// Passes UV and world position through; ripple displacement in fragment stage.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
