/**
 * Main game orchestrator.
 * Creates and owns the Three.js renderer, scene, camera, and the game loop.
 * Delegates to GameState, entity systems, and input/audio managers.
 */

/**
 * Creates a new Game instance bound to the given canvas container.
 * @param {HTMLElement} container - Element to append the Three.js canvas into.
 * @returns {{ start: () => void, stop: () => void, dispose: () => void }}
 */
export function createGame(container) {
  // TODO: implement

  return {
    /** Starts the game loop. */
    start() {
      // TODO: implement
    },

    /** Stops the game loop without disposing resources. */
    stop() {
      // TODO: implement
    },

    /** Tears down the Three.js renderer and frees all GPU resources. */
    dispose() {
      // TODO: implement
    },
  };
}
