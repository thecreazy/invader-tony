/**
 * CollisionSystem — collision detection between all game entities.
 */
import * as THREE from 'three';
import { STATES } from './GameState.js';

// Pre-allocated vectors — no new allocations in game loop
const _pA = new THREE.Vector3();
const _pB = new THREE.Vector3();

/**
 * @param {{
 *   player: object,
 *   getInvaders: () => object[],
 *   getBoss: () => object | null,
 *   playerBullets: object,
 *   enemyBullets: object,
 *   gameState: object,
 *   audioManager: object,
 *   particleSystem: object,
 * }} opts
 */
export function createCollisionSystem(opts) {
  const { player, getInvaders, getBoss, playerBullets, enemyBullets, gameState, audioManager, particleSystem } = opts;

  return {
    /** Run all collision checks for this frame. */
    check() {
      const state  = gameState.current;
      const pbArr  = playerBullets.getActive();
      const ebArr  = enemyBullets.getActive();
      const boss   = getBoss();
      const invaders = getInvaders();

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
    },
  };
}
