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

export function createSceneSetup(canvas: HTMLCanvasElement): ISceneSetup {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 1);
  renderer.sortObjects = true;

  const camera = new THREE.PerspectiveCamera(
    CONFIG.CANVAS.FOV,
    w / h,
    CONFIG.CANVAS.NEAR,
    CONFIG.CANVAS.FAR,
  );
  camera.position.z = 12;

  const scene = new THREE.Scene();
  const clock = new THREE.Clock();

  function onResize(): void {
    const rw = window.innerWidth;
    const rh = window.innerHeight;
    renderer.setSize(rw, rh);
    camera.aspect = rw / rh;
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
