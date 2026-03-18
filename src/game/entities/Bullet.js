/**
 * Bullet entity — pooled projectile used by both the player and enemies.
 * Object pooling means NO new allocations in the game loop; bullets are
 * activated/deactivated rather than created/destroyed.
 */

/**
 * @typedef {{ mesh: import('three').Object3D, active: boolean, velocity: import('three').Vector3, activate: (x: number, y: number, vy: number) => void, deactivate: () => void, update: (dt: number) => void }} Bullet
 */

/**
 * Creates a pool of reusable bullet objects and adds their meshes to the scene.
 * @param {import('three').Scene} scene
 * @param {number} poolSize - Number of bullets to pre-allocate.
 * @returns {{ acquire: () => Bullet | null, updateAll: (dt: number) => void, dispose: () => void }}
 */
export function createBulletPool(scene, poolSize) {
  // TODO: implement

  return {
    /**
     * Returns an inactive bullet from the pool, or null if all are in use.
     * @returns {Bullet | null}
     */
    acquire() {
      // TODO: implement
      return null;
    },

    /**
     * Updates all active bullets and deactivates out-of-bounds ones.
     * @param {number} dt - Delta time in seconds.
     */
    updateAll(dt) {
      // TODO: implement
    },

    /** Removes all bullet meshes from the scene and frees GPU resources. */
    dispose() {
      // TODO: implement
    },
  };
}
