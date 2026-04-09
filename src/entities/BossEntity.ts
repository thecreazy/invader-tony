// BossEntity.ts: Assembles geometry, movement, attack, and phase modules into the IBoss interface

import { CONFIG } from '../config.ts';
import type { IBoss } from '../types/entities.ts';
import type { IBulletPool, IParticleSystem, IAudioManager, IHud } from '../types/game.ts';
import type * as THREE from 'three';
import { createBossGeometry } from './BossGeometry.ts';
import { updateBossMovement } from './BossMovement.ts';
import { createBossAttackState, doShoot } from './BossAttack.ts';
import { createBossPhaseState, showRandomQuote, setPhase, triggerDeath } from './BossPhases.ts';

const BOSS_HP = CONFIG.BOSS.HP;
const [P1, P2] = CONFIG.BOSS.PHASES;

export interface BossTonyOpts {
  enemyBulletPool: IBulletPool;
  particleSystem: IParticleSystem;
  audioManager: IAudioManager;
  hud: IHud;
  getPlayerPos: () => THREE.Vector3;
  onShockwave: (x: number, y: number) => void;
  onTonyMode: () => void;
  onDeath: () => void;
}

export function createBossEntity(scene: THREE.Scene, opts: BossTonyOpts): IBoss {
  const {
    enemyBulletPool,
    particleSystem,
    audioManager,
    hud,
    getPlayerPos,
    onShockwave,
    onTonyMode,
    onDeath,
  } = opts;

  const render = createBossGeometry(scene);
  const attackState = createBossAttackState();
  const phaseState = createBossPhaseState();

  let hp = BOSS_HP;
  let alive = true;
  let dying = false;
  let entryComplete = false;
  let entryProgress = 0;
  let moveTime = 0;
  let quoteTimer = 4.0;

  return {
    mesh: render.group,
    get alive() {
      return alive;
    },
    get hp() {
      return hp;
    },
    get phase() {
      return phaseState.phase;
    },

    update(dt) {
      if (!alive && !dying) return;
      if (dying) return;

      if (!entryComplete) {
        entryProgress = Math.min(1, entryProgress + dt / 1.5);
        const t = 1 - Math.pow(1 - entryProgress, 3);
        render.group.position.y = 8 + (3.5 - 8) * t;
        if (entryProgress >= 1) {
          entryComplete = true;
          audioManager.playBossEntry();
          hud.showMessage('BOSS INCOMING!', 2500);
          showRandomQuote(phaseState, hud);
        }
        return;
      }

      moveTime += dt;
      updateBossMovement(render.group, phaseState.phase, moveTime);

      const pulse = 1 + Math.sin(moveTime * 4) * 0.025;
      render.group.scale.set(pulse, pulse, 1);

      attackState.shootTimer -= dt;
      if (attackState.shootTimer <= 0) {
        doShoot(
          render.group,
          enemyBulletPool,
          attackState,
          phaseState.phase,
          phaseState.ncModeActive,
          getPlayerPos,
        );
      }

      quoteTimer -= dt;
      if (quoteTimer <= 0) {
        showRandomQuote(phaseState, hud);
        quoteTimer = 4.0;
      }
    },

    takeDamage() {
      if (!alive || dying) return;
      hp--;

      const prevColor = render.mat.color.getHex();
      render.mat.color.set(0xffffff);
      setTimeout(() => {
        if (alive) render.mat.color.set(prevColor);
      }, 80);

      audioManager.playBossHit();
      particleSystem.emit(render.group.position.x, render.group.position.y, 0, 8, 0xff4400, 3);
      onShockwave(render.group.position.x, render.group.position.y);

      const ratio = hp / BOSS_HP;
      const newPhase = ratio <= P2 ? 2 : ratio <= P1 ? 1 : 0;
      if (newPhase > phaseState.phase) {
        setPhase(
          newPhase,
          phaseState,
          render.mat,
          hud,
          onShockwave,
          onTonyMode,
          render.group.position,
        );
      }

      if (hp <= 0) {
        dying = true;
        alive = false;
        triggerDeath(render.group, phaseState, particleSystem, audioManager, onShockwave, onDeath);
      }
    },

    dispose() {
      if (phaseState.glitchInterval) {
        clearInterval(phaseState.glitchInterval);
        phaseState.glitchInterval = null;
      }
      render.dispose(scene);
    },
  };
}
