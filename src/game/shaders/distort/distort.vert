// Distortion shader — vertex stage
// Passes UV and position through unmodified; distortion is done in the fragment stage.

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
