/**
 * BossCage entity — the final boss, a massive Nicholas Cage face.
 * Has multiple HP phases that trigger visual/behaviour changes.
 * Appears after all regular invaders are cleared.
 */

import { CONFIG } from '../../config.js';

/**
 * Creates the BossCage entity and adds it to the scene.
 * @param {import('three').Scene} scene
 * @returns {{ mesh: import('three').Object3D, update: (dt: number) => void, takeDamage: () => void, dispose: () => void, alive: boolean }}
 */
export function createBossCage(scene) {
  // TODO: implement

  return {
    mesh: null,
    alive: true,

    /**
     * Updates the boss for the current frame.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
      // TODO: implement
    },

    /** Registers a hit and triggers phase transitions if HP thresholds are crossed. */
    takeDamage() {
      // TODO: implement
    },

    /** Removes the boss mesh from the scene and frees resources. */
    dispose() {
      // TODO: implement
    },
  };
}
