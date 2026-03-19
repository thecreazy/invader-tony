// distort.vert — per-mesh vertex displacement for invaders and boss
// Makes the geometry "breathe" and wobble toward the camera.

uniform float uTime;
uniform float uDistortAmount;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv     = uv;
  vNormal = normal;

  vec3 pos = position;

  // Z-axis breathing (face pulses toward camera)
  float breatheX = sin(position.x * 3.0 + uTime * 2.0);
  float breatheY = cos(position.y * 4.0 + uTime * 1.7);
  pos.z += breatheX * breatheY * uDistortAmount;

  // Subtle y-axis organic wobble
  pos.y += sin(uTime * 3.0 + position.x * 5.0) * uDistortAmount * 0.3;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
