// scanlines.vert — fullscreen passthrough for post-processing quad
// PlaneGeometry(2,2) covers NDC [-1,1], bypassing all matrix transforms.

varying vec2 vUv;

void main() {
  vUv         = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
