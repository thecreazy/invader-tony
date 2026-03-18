/**
 * Game page — hosts the Three.js canvas fullscreen with the HUD overlay.
 * Creates and destroys the Game instance with its own lifecycle.
 */

/** @type {HTMLElement | null} */
let root = null;

/**
 * Mounts the game page into the given container.
 * @param {HTMLElement} container
 */
export function mount(container) {
  // TODO: implement
}

/**
 * Unmounts the game page, destroys the Three.js scene, and cleans up.
 */
export function unmount() {
  // TODO: implement
}

export const GamePage = { mount, unmount };
