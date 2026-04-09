// BackgroundRenderer.ts: Persistent fullscreen starfield — owns its own rAF loop, pauses during gameplay

import * as THREE from 'three';
import starfieldVert from '../game/shaders/starfield/starfield.vert';
import starfieldFrag from '../game/shaders/starfield/starfield.frag';

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.Camera | null = null;
let material: THREE.ShaderMaterial | null = null;
let animId: number | null = null;
let _paused = false;
let _time = 0;
let _last = 0;

function onResize(): void {
  renderer?.setSize(window.innerWidth, window.innerHeight);
}

function tick(now: number): void {
  animId = requestAnimationFrame(tick);
  if (_paused) {
    _last = now;
    return;
  }
  const dt = Math.min((now - _last) / 1000, 0.05);
  _last = now;
  _time += dt;
  if (material) material.uniforms['uTime'].value = _time;
  if (renderer && scene && camera) renderer.render(scene, camera);
}

export function init(): void {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:block;';

  const app = document.getElementById('app');
  document.body.insertBefore(canvas, app);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene = new THREE.Scene();
  material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: starfieldVert,
    fragmentShader: starfieldFrag,
    depthWrite: false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  window.addEventListener('resize', onResize);
  _last = performance.now();
  tick(_last);
}

export function pause(): void {
  _paused = true;
}
export function resume(): void {
  _paused = false;
  _last = performance.now();
}
