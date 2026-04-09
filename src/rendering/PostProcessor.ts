// PostProcessor.ts: Render pipeline — scene→RT, shockwave ping-pong passes, scanlines→screen

import * as THREE from 'three';
import { CONFIG } from '../config.ts';
import scanlinesVert from '../game/shaders/scanlines/scanlines.vert';
import scanlinesFrag from '../game/shaders/scanlines/scanlines.frag';
import type { IPostProcessor } from '../types/game.ts';
import type { IBoss } from '../types/entities.ts';
import { createShockwavePool } from './ShockwavePool.ts';
import { createEffectManager } from './EffectManager.ts';
import { createStarfieldBackground } from './StarfieldBackground.ts';

export interface PostProcessorOpts {
  getBoss?: () => IBoss | null;
}

export function createPostProcessor(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: PostProcessorOpts = {},
): IPostProcessor {
  const { getBoss } = opts;

  const w = window.innerWidth;
  const h = window.innerHeight;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  function makeRT(tw: number, th: number): THREE.WebGLRenderTarget {
    return new THREE.WebGLRenderTarget(tw, th, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
  }

  let rtPingA = makeRT(w * DPR, h * DPR);
  let rtPingB = makeRT(w * DPR, h * DPR);

  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const screenScene = new THREE.Scene();
  const quadGeom = new THREE.PlaneGeometry(2, 2);

  const scanlinesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: null },
      uTime: { value: 0 },
      uIntensity: { value: 0.8 },
      uTonyMode: { value: 0 },
      uResolution: { value: new THREE.Vector2(w, h) },
      uChromaticAberration: { value: 0.001 },
      uDamageFlash: { value: 0.0 },
      uWarpIntensity: { value: 0.0 },
    },
    vertexShader: scanlinesVert,
    fragmentShader: scanlinesFrag,
    depthTest: false,
  });

  const screenQuad = new THREE.Mesh(quadGeom, scanlinesMaterial);
  screenScene.add(screenQuad);

  const swScene = new THREE.Scene();
  const swQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  swQuad.frustumCulled = false;
  swScene.add(swQuad);

  const shockwavePool = createShockwavePool();
  const effectManager = createEffectManager(scanlinesMaterial);
  const starfield = createStarfieldBackground(scene);

  return {
    renderFrame(delta) {
      starfield.update(delta);

      renderer.setRenderTarget(rtPingA);
      renderer.clear();
      renderer.render(scene, camera);

      const { src } = shockwavePool.applyPasses(
        delta,
        renderer,
        screenCamera,
        rtPingA,
        rtPingB,
        swScene,
        swQuad as THREE.Mesh<THREE.BufferGeometry, THREE.Material>,
      );

      scanlinesMaterial.uniforms['uTexture'].value = src.texture;
      scanlinesMaterial.uniforms['uTime'].value += delta;
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(screenScene, screenCamera);
    },

    triggerShockwave(worldX, worldY) {
      shockwavePool.triggerAt(worldX, worldY, camera);
    },

    onResize() {
      const rw = window.innerWidth;
      const rh = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rtPingA.dispose();
      rtPingB.dispose();
      rtPingA = makeRT(rw * dpr, rh * dpr);
      rtPingB = makeRT(rw * dpr, rh * dpr);
      scanlinesMaterial.uniforms['uResolution'].value.set(rw, rh);
    },

    setTonyMode(active) {
      effectManager.setTonyMode(active);
    },
    setDamageFlash() {
      effectManager.setDamageFlash();
    },
    setWarpIntensity(v) {
      effectManager.setWarpIntensity(v);
    },

    updateEffects(delta) {
      const boss = getBoss ? getBoss() : null;
      const bossHpRatio = boss && boss.alive ? boss.hp / CONFIG.BOSS.HP : null;
      effectManager.updateUniforms(delta, bossHpRatio);
    },

    dispose() {
      rtPingA?.dispose();
      rtPingB?.dispose();
      scanlinesMaterial?.dispose();
      shockwavePool.dispose();
      screenQuad?.geometry.dispose();
      swQuad?.geometry.dispose();
      starfield.dispose(scene);
    },
  };
}
