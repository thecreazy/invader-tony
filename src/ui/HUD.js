/**
 * HUD (Heads-Up Display) — HTML overlay drawn on top of the Three.js canvas.
 * Shows score, lives, wave number, and any in-game messages.
 * Reacts to GameState events rather than polling each frame.
 */

/**
 * Creates the HUD and appends it to the given container.
 * @param {HTMLElement} container
 * @param {ReturnType<import('../game/GameState.js').createGameState>} gameState
 * @returns {{ show: () => void, hide: () => void, dispose: () => void }}
 */
export function createHUD(container, gameState) {
  // TODO: implement

  return {
    /** Makes the HUD visible. */
    show() {
      // TODO: implement
    },

    /** Hides the HUD (e.g. during pause or end screen). */
    hide() {
      // TODO: implement
    },

    /** Removes HUD DOM nodes and unsubscribes from GameState events. */
    dispose() {
      // TODO: implement
    },
  };
}
