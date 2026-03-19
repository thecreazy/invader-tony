/**
 * BackgroundRenderer — persistent fullscreen starfield canvas.
 * Runs its own rAF loop independently of the game.
 * Inserted as the FIRST child of <body> so all page content stacks on top via DOM order.
 * Pause during the game page (which has its own starfield).
 */

import * as THREE from 'three';
import starfieldVert from '../game/shaders/starfield/starfield.vert';
import starfieldFrag from '../game/shaders/starfield/starfield.frag';

let renderer = null;
let scene    = null;
let camera   = null;
let material = null;
let animId   = null;
let _paused  = false;
let _time    = 0;
let _last    = 0;

function onResize() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function tick(now) {
  animId = requestAnimationFrame(tick);
  if (_paused) { _last = now; return; }

  const dt = Math.min((now - _last) / 1000, 0.05);
  _last = now;
  _time += dt;
  material.uniforms.uTime.value = _time;
  renderer.render(scene, camera);
}

export function init() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;display:block;';

  // Insert BEFORE #app so pages rendered inside #app stack on top via DOM order
  const app = document.getElementById('app');
  document.body.insertBefore(canvas, app);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);

  // Orthographic camera + 2×2 plane = exact full-screen coverage
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene  = new THREE.Scene();

  material = new THREE.ShaderMaterial({
    uniforms:       { uTime: { value: 0 } },
    vertexShader:   starfieldVert,
    fragmentShader: starfieldFrag,
    depthWrite:     false,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  window.addEventListener('resize', onResize);

  _last = performance.now();
  tick(_last);
}

/** Pause rendering (e.g. during game page — game has its own starfield). */
export function pause() {
  _paused = true;
}

/** Resume rendering. */
export function resume() {
  _paused = false;
  _last = performance.now();
}
