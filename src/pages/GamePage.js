/**
 * Game page — mounts the Three.js canvas and HTML HUD, then boots the game.
 */

import { createGame }      from '../game/Game.js';
import { pause, resume }   from '../background/BackgroundRenderer.js';

/** @type {HTMLElement | null} */
let _container = null;

/** @type {HTMLElement | null} */
let _wrapper = null;

/** @type {ReturnType<typeof createGame> | null} */
let _game = null;

/**
 * @param {HTMLElement} container
 */
export function mount(container) {
  _container = container;

  // Wrapper — positions canvas and HUD in the same stacking context
  _wrapper = document.createElement('div');
  _wrapper.style.cssText = `
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  `;

  // Three.js render target
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';

  // HTML HUD overlay (pointer-events:none so clicks pass through to canvas)
  const hudEl = document.createElement('div');
  hudEl.id = 'game-hud';
  hudEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';

  _wrapper.appendChild(canvas);
  _wrapper.appendChild(hudEl);
  _container.appendChild(_wrapper);

  pause(); // background renderer not needed — game has its own starfield

  _game = createGame(canvas, hudEl);
  _game.init();
  _game.start();
}

export function unmount() {
  resume(); // restore background starfield for non-game pages

  _game?.destroy();
  _game = null;

  if (_wrapper && _container) {
    _container.removeChild(_wrapper);
  }
  _wrapper   = null;
  _container = null;
}

export const GamePage = { mount, unmount };
