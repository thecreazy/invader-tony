/**
 * Player entity — the ship the player controls at the bottom of the screen.
 * Handles movement, shooting cooldown, and collision geometry.
 */

/**
 * Creates the player entity and adds it to the given Three.js scene.
 * @param {import('three').Scene} scene
 * @returns {{ mesh: import('three').Object3D, update: (dt: number, input: object) => void, dispose: () => void }}
 */
export function createPlayer(scene) {
  // TODO: implement

  return {
    mesh: null,

    /**
     * Updates the player for the current frame.
     * @param {number} dt - Delta time in seconds.
     * @param {object} input - Current input snapshot from InputManager.
     */
    update(dt, input) {
      // TODO: implement
    },

    /** Removes the player mesh from the scene and frees geometry/material. */
    dispose() {
      // TODO: implement
    },
  };
}
