/**
 * Particle system — pooled VFX particles for explosions, hit sparks, and death bursts.
 * Uses BufferGeometry with a Points mesh for zero per-frame allocations.
 */

/**
 * Creates the particle system and adds it to the scene.
 * @param {import('three').Scene} scene
 * @param {number} maxParticles - Total particle budget (pre-allocated).
 * @returns {{ burst: (x: number, y: number, color: string, count: number) => void, update: (dt: number) => void, dispose: () => void }}
 */
export function createParticleSystem(scene, maxParticles) {
  // TODO: implement

  return {
    /**
     * Spawns a burst of particles at world position (x, y).
     * @param {number} x
     * @param {number} y
     * @param {string} color - Hex color string.
     * @param {number} count - Number of particles to emit.
     */
    burst(x, y, color, count) {
      // TODO: implement
    },

    /**
     * Advances all live particles by dt seconds and recycles dead ones.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
      // TODO: implement
    },

    /** Removes the particles mesh from the scene and frees GPU resources. */
    dispose() {
      // TODO: implement
    },
  };
}
