/**
 * Main game orchestrator — INVADER TONY.
 * Owns the Three.js renderer, scene, clock, and the requestAnimationFrame loop.
 * Coordinates all systems: input, audio, particles, entities, HUD.
 * Post-processing: game renders to RenderTarget → shockwave passes → scanlines → screen.
 * Wave system: 4 progressive waves before the boss.
 */

import * as THREE from 'three';

import { CONFIG }               from '../config.js';
import { navigate }             from '../router.js';
import { createGameState, STATES } from './GameState.js';
import { createInputManager }   from '../systems/InputManager.js';
import { createAudioManager }   from '../systems/AudioManager.js';
import { createParticleSystem } from '../systems/ParticleSystem.js';
import { createPlayer }         from './entities/Player.js';
import { createBulletPool }     from './entities/Bullet.js';
import { createTonyInvader, disposeInvaderResources, updateInvaderShaderTime } from './entities/TonyInvader.js';
import { createBossTony }       from './entities/BossTony.js';
import { createHUD }            from '../ui/HUD.js';

import scanlinesVert from './shaders/scanlines/scanlines.vert';
import scanlinesFrag from './shaders/scanlines/scanlines.frag';
import shockwaveVert from './shaders/shockwave/shockwave.vert';
import shockwaveFrag from './shaders/shockwave/shockwave.frag';

// Pre-allocated vectors for collision detection — never new'd in the game loop
const _pA = new THREE.Vector3();
const _pB = new THREE.Vector3();

const EDGE_RIGHT      = 5.5;
const EDGE_LEFT       = -5.5;
const INVADER_FLOOR_Y = -6.5;
const SHOCKWAVE_POOL  = 5;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement}       hudElement
 */
export function createGame(canvas, hudElement) {
  // ── Three.js core ──────────────────────────────────────────────────────────
  let renderer, scene, camera, clock;

  // ── Post-processing ────────────────────────────────────────────────────────
  let rtPingA, rtPingB;
  let screenScene, screenCamera, screenQuad;
  let scanlinesMaterial;
  const shockwavePool = [];
  let tonyModeActive = false;

  // ── Systems ───────────────────────────────────────────────────────────────
  let gameState, inputManager, audioManager, particleSystem, hud;

  // ── Entities ──────────────────────────────────────────────────────────────
  let player, playerBullets, enemyBullets;
  let invaders = [];
  let boss = null;

  // ── Grid / wave state ─────────────────────────────────────────────────────
  const grid = {
    offsetX:          0,
    offsetY:          0,
    direction:        1,
    speed:            CONFIG.ENEMY.BASE_SPEED,
    shootTimer:       2.0,
    speedMultiplier:  1.0,
    shootIntervalMin: CONFIG.ENEMY.SHOOT_INTERVAL_MIN,
    shootIntervalMax: CONFIG.ENEMY.SHOOT_INTERVAL_MAX,
    currentDropAmount: 0.28,
  };

  let currentWaveIndex  = 0;
  let waveTransitioning = false;
  let animId            = null;
  let bossSpawned       = false;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function makeRenderTarget(w, h) {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format:    THREE.RGBAFormat,
    });
  }

  // ── Resize ────────────────────────────────────────────────────────────────
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    rtPingA.dispose();
    rtPingB.dispose();
    rtPingA = makeRenderTarget(w, h);
    rtPingB = makeRenderTarget(w, h);
    if (scanlinesMaterial) {
      scanlinesMaterial.uniforms.uResolution.value.set(w, h);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 1);
    renderer.sortObjects = true;

    camera = new THREE.PerspectiveCamera(CONFIG.CANVAS.FOV, w / h, CONFIG.CANVAS.NEAR, CONFIG.CANVAS.FAR);
    camera.position.z = 12;

    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // ── Post-processing setup ─────────────────────────────────────────────
    rtPingA = makeRenderTarget(w, h);
    rtPingB = makeRenderTarget(w, h);

    screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    screenScene  = new THREE.Scene();

    const quadGeom = new THREE.PlaneGeometry(2, 2);

    scanlinesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture:     { value: null },
        uTime:        { value: 0 },
        uIntensity:   { value: 0.8 },
        uTonyMode: { value: 0 },
        uResolution:  { value: new THREE.Vector2(w, h) },
      },
      vertexShader:   scanlinesVert,
      fragmentShader: scanlinesFrag,
      depthTest: false,
    });

    screenQuad = new THREE.Mesh(quadGeom, scanlinesMaterial);
    screenScene.add(screenQuad);

    for (let i = 0; i < SHOCKWAVE_POOL; i++) {
      shockwavePool.push({
        mat: new THREE.ShaderMaterial({
          uniforms: {
            uTexture:  { value: null },
            uCenter:   { value: new THREE.Vector2(0.5, 0.5) },
            uProgress: { value: 0 },
            uStrength: { value: 0.35 },
          },
          vertexShader:   shockwaveVert,
          fragmentShader: shockwaveFrag,
          depthTest: false,
        }),
        active:   false,
        progress: 0,
      });
    }

    // Systems
    gameState      = createGameState();
    inputManager   = createInputManager(canvas.parentElement);
    audioManager   = createAudioManager();
    particleSystem = createParticleSystem(scene);
    hud            = createHUD(hudElement, gameState);

    playerBullets = createBulletPool(scene, 30, 'player');
    enemyBullets  = createBulletPool(scene, 30, 'enemy');

    player = createPlayer(scene, gameState);

    // Start with wave 1
    currentWaveIndex = 0;
    spawnGrid(CONFIG.WAVES[0]);
    setTimeout(() => hud.showMessage('WAVE 1', 1500), 300);

    window.addEventListener('resize', onResize);
  }

  // ── Spawn helpers ─────────────────────────────────────────────────────────
  function spawnGrid(waveConfig) {
    for (const inv of invaders) inv.dispose();
    invaders = [];
    disposeInvaderResources();

    const {
      cols, rows, enemyTypes,
      speedMultiplier, shootIntervalMin, shootIntervalMax, dropAmount,
    } = waveConfig;

    grid.speedMultiplier   = speedMultiplier;
    grid.shootIntervalMin  = shootIntervalMin;
    grid.shootIntervalMax  = shootIntervalMax;
    grid.currentDropAmount = dropAmount;
    grid.direction         = 1;
    grid.offsetX           = 0;
    grid.offsetY           = 0;
    grid.speed             = CONFIG.ENEMY.BASE_SPEED * speedMultiplier;
    grid.shootTimer        = 2.0;

    const hSpacing = cols <= 8 ? 1.25 : 1.1;
    const vSpacing = 1.1;
    const topY     = 4.2;

    for (let row = 0; row < rows; row++) {
      const type = enemyTypes[row] || 'basic';
      for (let col = 0; col < cols; col++) {
        invaders.push(createTonyInvader(scene, { col, row, type, hSpacing, vSpacing, topY, cols }));
      }
    }

    bossSpawned = false;
  }

  function spawnBoss() {
    bossSpawned = true;
    gameState.transition(STATES.BOSS_FIGHT);

    boss = createBossTony(scene, {
      enemyBulletPool: enemyBullets,
      particleSystem,
      audioManager,
      hud,
      getPlayerPos:  () => player.getPosition(),
      onShockwave:   (wx, wy) => triggerShockwave(wx, wy),
      onTonyMode: () => activateTonyMode(),
      onDeath:       () => triggerVictory(),
    });

    hud.showBossBar(boss.hp, CONFIG.BOSS.HP);
  }

  // ── Shockwave ─────────────────────────────────────────────────────────────
  function triggerShockwave(worldX, worldY) {
    const slot = shockwavePool.find(s => !s.active);
    if (!slot) return;
    _pA.set(worldX, worldY, 0);
    _pA.project(camera);
    slot.active   = true;
    slot.progress = 0;
    slot.mat.uniforms.uCenter.value.set((_pA.x + 1) * 0.5, (_pA.y + 1) * 0.5);
    slot.mat.uniforms.uProgress.value = 0;
    slot.mat.uniforms.uStrength.value = 0.35;
  }

  // ── Tony Mode ─────────────────────────────────────────────────────────────
  function activateTonyMode() {
    tonyModeActive = true;
    if (scanlinesMaterial) scanlinesMaterial.uniforms.uTonyMode.value = 1;
    hud.showTonyMode();
    audioManager.startTonyLoop();
  }

  function deactivateTonyMode() {
    tonyModeActive = false;
    if (scanlinesMaterial) scanlinesMaterial.uniforms.uTonyMode.value = 0;
    hud.hideTonyMode();
    audioManager.stopTonyLoop();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderFrame(delta) {
    // Pass 1: render game scene to rtPingA
    renderer.setRenderTarget(rtPingA);
    renderer.clear();
    renderer.render(scene, camera);

    // Pass 2: shockwave ping-pong passes
    let src = rtPingA;
    let dst = rtPingB;

    const swMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    swMesh.frustumCulled = false;

    for (const slot of shockwavePool) {
      if (!slot.active) continue;
      slot.progress += delta * 0.9;
      if (slot.progress >= 1) { slot.active = false; continue; }

      slot.mat.uniforms.uTexture.value  = src.texture;
      slot.mat.uniforms.uProgress.value = slot.progress;
      swMesh.material = slot.mat;
      screenScene.add(swMesh);

      renderer.setRenderTarget(dst);
      renderer.clear();
      renderer.render(screenScene, screenCamera);
      screenScene.remove(swMesh);

      const tmp = src; src = dst; dst = tmp;
    }

    swMesh.geometry.dispose();

    // Pass 3: scanlines → screen
    scanlinesMaterial.uniforms.uTexture.value = src.texture;
    scanlinesMaterial.uniforms.uTime.value   += delta;
    screenQuad.material = scanlinesMaterial;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(screenScene, screenCamera);
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop() {
    animId = requestAnimationFrame(loop);
    let delta = clock.getDelta();
    if (delta > 0.05) delta = 0.05;
    update(delta);
    renderFrame(delta);
  }

  function update(delta) {
    const state = gameState.current;
    if (state !== STATES.PLAYING && state !== STATES.BOSS_FIGHT) return;

    player.update(delta, inputManager, playerBullets, audioManager);
    playerBullets.updateAll(delta);
    enemyBullets.updateAll(delta);
    particleSystem.update(delta);
    updateInvaderShaderTime(delta); // no-op with sprite approach

    if (state === STATES.PLAYING) updateGrid(delta);

    if (state === STATES.BOSS_FIGHT && boss && boss.alive) {
      boss.update(delta);
      hud.updateBossBar(boss.hp, CONFIG.BOSS.HP);
    }

    checkCollisions();
    checkWinLose();
  }

  // ── Grid movement ─────────────────────────────────────────────────────────
  function updateGrid(delta) {
    let aliveCount = 0;
    let maxBaseX   = -Infinity;
    let minBaseX   =  Infinity;

    for (const inv of invaders) {
      if (!inv.alive) continue;
      aliveCount++;
      if (inv.baseX > maxBaseX) maxBaseX = inv.baseX;
      if (inv.baseX < minBaseX) minBaseX = inv.baseX;
    }

    if (aliveCount === 0) return;

    // Speed ramps only after 70% of wave is cleared
    const aliveRatio = aliveCount / invaders.length;
    const dynamicSpeed = aliveRatio > 0.3
      ? CONFIG.ENEMY.BASE_SPEED * grid.speedMultiplier
      : CONFIG.ENEMY.BASE_SPEED * grid.speedMultiplier * (1.0 + ((0.3 - aliveRatio) / 0.3) * 2.5);
    grid.speed = dynamicSpeed;

    grid.offsetX += grid.direction * grid.speed * delta;

    const rightEdge = maxBaseX + grid.offsetX;
    const leftEdge  = minBaseX + grid.offsetX;

    if (rightEdge > EDGE_RIGHT || leftEdge < EDGE_LEFT) {
      grid.direction *= -1;
      grid.offsetY   -= grid.currentDropAmount;
      grid.offsetX   += grid.direction * 0.05;
    }

    for (const inv of invaders) {
      inv.update(delta, grid.offsetX, grid.offsetY);
    }

    // Random shooting with wave-specific intervals
    grid.shootTimer -= delta;
    if (grid.shootTimer <= 0) {
      let attempts = 0;
      while (attempts < 10) {
        const idx = Math.floor(Math.random() * invaders.length);
        if (invaders[idx].alive) {
          invaders[idx].shoot(enemyBullets);
          break;
        }
        attempts++;
      }
      const min = grid.shootIntervalMin / 1000;
      const max = grid.shootIntervalMax / 1000;
      grid.shootTimer = min + Math.random() * (max - min);
    }
  }

  // ── Collision detection ───────────────────────────────────────────────────
  function checkCollisions() {
    const state = gameState.current;
    const pbArr = playerBullets.getActive();
    const ebArr = enemyBullets.getActive();

    // Player bullets vs invaders
    if (state === STATES.PLAYING) {
      for (const pb of pbArr) {
        if (!pb.active) continue;
        _pA.copy(pb.mesh.position);
        for (const inv of invaders) {
          if (!inv.alive) continue;
          _pB.copy(inv.mesh.position);
          if (_pA.distanceTo(_pB) < 0.5) {
            const pts = inv.takeDamage();
            pb.deactivate();
            gameState.addScore(pts);
            audioManager.playExplosion();
            particleSystem.emit(_pB.x, _pB.y, 0, 12, 0xffaa00, 3.5);
            break;
          }
        }
      }
    }

    // Player bullets vs boss
    if (state === STATES.BOSS_FIGHT && boss && boss.alive) {
      _pB.copy(boss.mesh.position);
      for (const pb of pbArr) {
        if (!pb.active) continue;
        _pA.copy(pb.mesh.position);
        if (_pA.distanceTo(_pB) < 2.0) {
          boss.takeDamage();
          pb.deactivate();
          gameState.addScore(50);
        }
      }
    }

    // Enemy bullets vs player
    _pB.copy(player.getPosition());
    for (const eb of ebArr) {
      if (!eb.active) continue;
      _pA.copy(eb.mesh.position);
      if (_pA.distanceTo(_pB) < 0.5) {
        eb.deactivate();
        player.takeDamage(audioManager);
        particleSystem.emit(_pB.x, _pB.y, 0, 8, 0x00ffff, 2.5);
      }
    }
  }

  // ── Win / lose ────────────────────────────────────────────────────────────
  function checkWinLose() {
    const state = gameState.current;
    if (state === STATES.GAME_OVER || state === STATES.VICTORY) return;

    if (gameState.lives <= 0) { triggerGameOver(); return; }

    if (state === STATES.PLAYING) {
      // Invaders reached the floor
      for (const inv of invaders) {
        if (inv.alive && inv.mesh.position.y < INVADER_FLOOR_Y) {
          triggerGameOver();
          return;
        }
      }

      // Count alive invaders
      let alive = 0;
      for (const inv of invaders) { if (inv.alive) alive++; }

      if (alive === 0 && !waveTransitioning && !bossSpawned) {
        waveTransitioning = true;

        if (currentWaveIndex < CONFIG.WAVES.length - 1) {
          // Advance to next wave
          currentWaveIndex++;
          const nextWave = CONFIG.WAVES[currentWaveIndex];
          hud.showMessage(nextWave.label, 2000);
          audioManager.playWaveClear();
          setTimeout(() => {
            spawnGrid(nextWave);
            waveTransitioning = false;
            gameState.transition(STATES.PLAYING);
          }, 2200);
        } else {
          // All 4 waves cleared → boss
          spawnBoss();
          waveTransitioning = false;
        }
      }
    }
    // Boss death → triggerVictory() via onDeath callback
  }

  function triggerGameOver() {
    if (gameState.current === STATES.GAME_OVER) return;
    gameState.transition(STATES.GAME_OVER);
    if (tonyModeActive) deactivateTonyMode();
    audioManager.playGameOver();
    hud.showMessage('GAME OVER', 1800);
    sessionStorage.setItem('tony_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('tony_invaders_result', 'game_over');
    setTimeout(() => navigate('#end'), 1800);
  }

  function triggerVictory() {
    if (gameState.current === STATES.VICTORY) return;
    gameState.transition(STATES.VICTORY);
    if (tonyModeActive) deactivateTonyMode();
    audioManager.playVictory();
    hud.showMessage('YOU WIN!', 1800);
    hud.hideBossBar();
    sessionStorage.setItem('tony_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('tony_invaders_result', 'victory');
    setTimeout(() => navigate('#end'), 1800);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init,

    start() {
      clock.start();
      loop();
    },

    stop() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    },

    destroy() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      window.removeEventListener('resize', onResize);

      inputManager?.destroy();
      audioManager?.destroy();
      particleSystem?.dispose();
      player?.dispose();
      playerBullets?.dispose();
      enemyBullets?.dispose();

      for (const inv of invaders) inv.dispose();
      disposeInvaderResources();
      invaders = [];

      boss?.dispose();
      boss = null;

      hud?.dispose();

      rtPingA?.dispose();
      rtPingB?.dispose();
      scanlinesMaterial?.dispose();
      for (const slot of shockwavePool) slot.mat.dispose();
      screenQuad?.geometry.dispose();

      renderer?.dispose();
    },
  };
}
