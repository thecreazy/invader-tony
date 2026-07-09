// SceneSetup.ts: Creates and owns the WebGLRenderer, PerspectiveCamera, Scene, and resize handler

import * as THREE from 'three';
import { CONFIG } from '../config.ts';

export interface ISceneSetup {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  clock: THREE.Clock;
  destroy(): void;
}

const CAMERA_Z = 12;
// Reference aspect the FOV/scene was tuned against (a typical 16:9 desktop window).
const BASE_ASPECT = 16 / 9;
// Never shrink vertical world-space below this, so the ship and grid can't clip off-frame.
const MIN_HALF_HEIGHT = 6.5;

// On aspect ratios wider than BASE_ASPECT (e.g. phones in landscape, ~2.1-2.2), a fixed
// vertical FOV lets the horizontal view keep growing — the fixed-width playfield ends up
// occupying a shrinking sliver of the screen. This clamps horizontal world-space to what
// it already is at BASE_ASPECT, narrowing the vertical FOV instead so the playfield keeps
// filling the screen on ultra-wide mobile screens.
function computeFov(aspect: number): number {
  const baseHalfHeight = CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(CONFIG.CANVAS.FOV) / 2);
  if (aspect <= BASE_ASPECT) return CONFIG.CANVAS.FOV;
  const targetHalfWidth = baseHalfHeight * BASE_ASPECT;
  const halfHeight = Math.max(MIN_HALF_HEIGHT, targetHalfWidth / aspect);
  return THREE.MathUtils.radToDeg(2 * Math.atan(halfHeight / CAMERA_Z));
}

export function createSceneSetup(canvas: HTMLCanvasElement): ISceneSetup {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 1);
  renderer.sortObjects = true;

  const camera = new THREE.PerspectiveCamera(
    computeFov(w / h),
    w / h,
    CONFIG.CANVAS.NEAR,
    CONFIG.CANVAS.FAR,
  );
  camera.position.z = CAMERA_Z;

  const scene = new THREE.Scene();
  const clock = new THREE.Clock();

  function onResize(): void {
    const rw = window.innerWidth;
    const rh = window.innerHeight;
    renderer.setSize(rw, rh);
    camera.aspect = rw / rh;
    camera.fov = computeFov(camera.aspect);
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', onResize);

  return {
    renderer,
    scene,
    camera,
    clock,
    destroy() {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
