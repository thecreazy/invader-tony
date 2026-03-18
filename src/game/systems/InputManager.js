/**
 * Input manager — unified keyboard + touch input.
 * Produces a normalised input snapshot each frame; consumers never
 * subscribe to raw DOM events directly.
 */

/**
 * @typedef {{ left: boolean, right: boolean, fire: boolean }} InputSnapshot
 */

/**
 * Creates the input manager and attaches DOM event listeners.
 * @returns {{ getSnapshot: () => InputSnapshot, dispose: () => void }}
 */
export function createInputManager() {
  // TODO: implement

  return {
    /**
     * Returns the current input state as a plain object.
     * Call once per frame at the top of the game loop.
     * @returns {InputSnapshot}
     */
    getSnapshot() {
      // TODO: implement
      return { left: false, right: false, fire: false };
    },

    /** Removes all DOM event listeners. */
    dispose() {
      // TODO: implement
    },
  };
}
