// CollisionSystem.ts: Bullet-invader, bullet-boss, and bullet-player collision detection

import * as THREE from 'three';
import { GamePhase } from '../core/GameState.ts';
import type { IGameState, IBulletPool, IAudioManager, IParticleSystem } from '../types/game.ts';
import type { IPlayer, IInvader, IBoss } from '../types/entities.ts';

const _pA = new THREE.Vector3();
const _pB = new THREE.Vector3();

export interface CollisionSystemOpts {
  player: IPlayer;
  getInvaders: () => IInvader[];
  getBoss: () => IBoss | null;
  playerBullets: IBulletPool;
  enemyBullets: IBulletPool;
  gameState: IGameState;
  audioManager: IAudioManager;
  particleSystem: IParticleSystem;
}

export function createCollisionSystem(opts: CollisionSystemOpts) {
  const {
    player,
    getInvaders,
    getBoss,
    playerBullets,
    enemyBullets,
    gameState,
    audioManager,
    particleSystem,
  } = opts;

  return {
    check(): void {
      const state = gameState.current;
      const pbArr = playerBullets.getActive();
      const ebArr = enemyBullets.getActive();
      const boss = getBoss();
      const invaders = getInvaders();

      // Player bullets vs invaders
      if (state === GamePhase.PLAYING) {
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
      if (state === GamePhase.BOSS_FIGHT && boss && boss.alive) {
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
    },
  };
}
