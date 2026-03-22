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
import { updateInvaderShaderTime } from './entities/TonyInvader.js';
import { createBossTony }       from './entities/BossTony.js';
import { createHUD }            from '../ui/HUD.js';
import { createChiptunePlayer } from '../systems/ChiptunePlayer.js';
import { createPostProcessor }  from './renderer/PostProcessor.js';
import { createWaveManager }    from './WaveManager.js';
import { createCollisionSystem } from './CollisionSystem.js';

/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLElement}       hudElement
 */
export function createGame(canvas, hudElement) {
  // ── Three.js core ──────────────────────────────────────────────────────────
  let renderer, scene, camera, clock;

  // ── Systems ───────────────────────────────────────────────────────────────
  let gameState, inputManager, audioManager, particleSystem, hud;
  let chiptunePlayer = null;
  let _visibilityHandler = null;
  let postProcessor = null;
  let waveManager = null;
  let collisionSystem = null;

  // ── Entities ──────────────────────────────────────────────────────────────
  let player, playerBullets, enemyBullets;
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

  let animId = null;

  // ── Resize ────────────────────────────────────────────────────────────────
  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    postProcessor.onResize();
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

    // Systems
    gameState      = createGameState();
    inputManager   = createInputManager(canvas.parentElement);
    audioManager   = createAudioManager();
    particleSystem = createParticleSystem(scene);
    chiptunePlayer = createChiptunePlayer();

    hud = createHUD(hudElement, gameState, {
      onMuteToggle: (muted) => {
        chiptunePlayer.setVolume(muted ? 0 : (gameState.current === STATES.BOSS_FIGHT ? 0.25 : 0.5));
      },
    });

    // Tab visibility — pause music when hidden, resume when visible
    _visibilityHandler = () => {
      if (document.hidden) {
        chiptunePlayer.stop();
      } else if (
        gameState.current === STATES.PLAYING ||
        gameState.current === STATES.BOSS_FIGHT
      ) {
        chiptunePlayer.play();
      }
    };
    document.addEventListener('visibilitychange', _visibilityHandler);

    playerBullets = createBulletPool(scene, 30, 'player');
    enemyBullets  = createBulletPool(scene, 30, 'enemy');

    player = createPlayer(scene, gameState, { onDamage: () => postProcessor.setDamageFlash() });

    // Post-processor (also adds starfield to scene)
    postProcessor = createPostProcessor(renderer, scene, camera, {
      getBoss: () => boss,
    });

    // Wave manager
    waveManager = createWaveManager(scene, {
      gameState,
      grid,
      hud,
      audioManager,
      postProcessor,
      enemyBullets,
      onBossSpawn: () => spawnBoss(),
    });

    // Collision system
    collisionSystem = createCollisionSystem({
      player,
      getInvaders: () => waveManager.getInvaders(),
      getBoss: () => boss,
      playerBullets,
      enemyBullets,
      gameState,
      audioManager,
      particleSystem,
    });

    // Start with wave 1
    waveManager.init();
    setTimeout(() => hud.showMessage('WAVE 1', 1500), 300);

    window.addEventListener('resize', onResize);
  }

  // ── Spawn boss ────────────────────────────────────────────────────────────
  function spawnBoss() {
    waveManager.markBossSpawned();
    gameState.transition(STATES.BOSS_FIGHT);
    chiptunePlayer?.setVolume(0.25);

    boss = createBossTony(scene, {
      enemyBulletPool: enemyBullets,
      particleSystem,
      audioManager,
      hud,
      getPlayerPos:  () => player.getPosition(),
      onShockwave:   (wx, wy) => postProcessor.triggerShockwave(wx, wy),
      onTonyMode: () => activateTonyMode(),
      onDeath:       () => triggerVictory(),
    });

    hud.showBossBar(boss.hp, CONFIG.BOSS.HP);
  }

  // ── Tony Mode ─────────────────────────────────────────────────────────────
  function activateTonyMode() {
    postProcessor.setTonyMode(true);
    hud.showTonyMode();
    audioManager.startTonyLoop();
  }

  function deactivateTonyMode() {
    postProcessor.setTonyMode(false);
    hud.hideTonyMode();
    audioManager.stopTonyLoop();
  }

  // ── Game loop ─────────────────────────────────────────────────────────────
  function loop() {
    animId = requestAnimationFrame(loop);
    let delta = clock.getDelta();
    if (delta > 0.05) delta = 0.05;
    update(delta);
    postProcessor.updateEffects(delta);
    postProcessor.renderFrame(delta);
  }

  function update(delta) {
    const state = gameState.current;
    if (state !== STATES.PLAYING && state !== STATES.BOSS_FIGHT) return;

    player.update(delta, inputManager, playerBullets, audioManager);
    playerBullets.updateAll(delta);
    enemyBullets.updateAll(delta);
    particleSystem.update(delta);
    updateInvaderShaderTime(delta); // no-op with sprite approach

    if (state === STATES.PLAYING) waveManager.updateGrid(delta);

    if (state === STATES.BOSS_FIGHT && boss && boss.alive) {
      boss.update(delta);
      hud.updateBossBar(boss.hp, CONFIG.BOSS.HP);
    }

    collisionSystem.check();
    checkWinLose();
  }

  // ── Win / lose ────────────────────────────────────────────────────────────
  function checkWinLose() {
    const state = gameState.current;
    if (state === STATES.GAME_OVER || state === STATES.VICTORY) return;

    if (gameState.lives <= 0) { triggerGameOver(); return; }

    if (state === STATES.PLAYING) {
      waveManager.checkWaveClear(CONFIG.GAMEPLAY.INVADER_FLOOR_Y, triggerGameOver);
    }
    // Boss death → triggerVictory() via onDeath callback
  }

  function triggerGameOver() {
    if (gameState.current === STATES.GAME_OVER) return;
    gameState.transition(STATES.GAME_OVER);
    if (boss && boss.alive === false) { /* tony mode already off */ } else { deactivateTonyMode(); }
    chiptunePlayer?.stop();
    audioManager.playGameOver();
    hud.showMessage('GAME OVER', 1800);
    sessionStorage.setItem('tony_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('tony_invaders_result', 'game_over');
    setTimeout(() => navigate('/end'), 1800);
  }

  function triggerVictory() {
    if (gameState.current === STATES.VICTORY) return;
    gameState.transition(STATES.VICTORY);
    deactivateTonyMode();
    chiptunePlayer?.stop();
    audioManager.playVictory();
    hud.showMessage('YOU WIN!', 1800);
    hud.hideBossBar();
    sessionStorage.setItem('tony_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('tony_invaders_result', 'victory');
    setTimeout(() => navigate('/end'), 1800);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    init,

    start() {
      clock.start();
      loop();
      // Web Audio requires a user gesture before AudioContext can start.
      // Start music on the first keypress or touch.
      window.addEventListener('keydown', () => chiptunePlayer.play(), { once: true });
      canvas.addEventListener('touchstart', () => chiptunePlayer.play(), { once: true });
    },

    stop() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    },

    destroy() {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      window.removeEventListener('resize', onResize);

      if (_visibilityHandler) {
        document.removeEventListener('visibilitychange', _visibilityHandler);
        _visibilityHandler = null;
      }

      chiptunePlayer?.destroy();
      chiptunePlayer = null;

      inputManager?.destroy();
      audioManager?.destroy();
      particleSystem?.dispose();
      player?.dispose();
      playerBullets?.dispose();
      enemyBullets?.dispose();

      waveManager?.dispose();

      boss?.dispose();
      boss = null;

      hud?.dispose();

      postProcessor?.dispose();

      renderer?.dispose();
    },
  };
}
