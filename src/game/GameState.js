/**
 * Centralised game state store.
 * Holds score, lives, current wave, enemy grid, and phase flags.
 * Emits events when state changes so the HUD can react without polling.
 */

/**
 * @typedef {{
 *   score: number,
 *   lives: number,
 *   wave: number,
 *   paused: boolean,
 *   gameOver: boolean,
 *   won: boolean,
 * }} State
 */

/**
 * Creates a fresh, zeroed game state object with an event emitter interface.
 * @returns {{ get: () => State, reset: () => void, on: (event: string, cb: Function) => void, off: (event: string, cb: Function) => void }}
 */
export function createGameState() {
  // TODO: implement

  return {
    /** Returns a shallow copy of the current state. */
    get() {
      // TODO: implement
    },

    /** Resets state to initial values. */
    reset() {
      // TODO: implement
    },

    /**
     * Subscribes to a state change event.
     * @param {string} event
     * @param {Function} cb
     */
    on(event, cb) {
      // TODO: implement
    },

    /**
     * Unsubscribes from a state change event.
     * @param {string} event
     * @param {Function} cb
     */
    off(event, cb) {
      // TODO: implement
    },
  };
}
