/**
 * CageInvader entity — a single Nicholas Cage alien in the grid.
 * Renders a Cage face texture on a billboard mesh.
 * Handles per-invader shoot timers and death animation.
 */

/**
 * Creates a CageInvader entity and adds it to the scene.
 * @param {import('three').Scene} scene
 * @param {{ col: number, row: number }} gridPos - Initial grid position.
 * @returns {{ mesh: import('three').Object3D, update: (dt: number) => void, dispose: () => void, alive: boolean }}
 */
export function createCageInvader(scene, gridPos) {
  // TODO: implement

  return {
    mesh: null,
    alive: true,

    /**
     * Updates the invader for the current frame.
     * @param {number} dt - Delta time in seconds.
     */
    update(dt) {
      // TODO: implement
    },

    /** Removes the invader mesh from the scene and frees resources. */
    dispose() {
      // TODO: implement
    },
  };
}
