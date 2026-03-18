/**
 * Centralised game state store with a minimal event emitter.
 * Everything that changes score, lives, wave, or game phase goes through here.
 */

import { CONFIG } from '../config.js';

export const STATES = {
  MENU:       'MENU',
  PLAYING:    'PLAYING',
  PAUSED:     'PAUSED',
  BOSS_FIGHT: 'BOSS_FIGHT',
  GAME_OVER:  'GAME_OVER',
  VICTORY:    'VICTORY',
};

/**
 * @returns {{
 *   current: string, score: number, lives: number, wave: number,
 *   transition(s:string):void, addScore(n:number):void, loseLife():number,
 *   setWave(n:number):void, on(e:string,cb:Function):void,
 *   off(e:string,cb:Function):void, get():object, reset():void
 * }}
 */
export function createGameState() {
  /** @type {Record<string, Function[]>} */
  const listeners = {};

  let _current = STATES.PLAYING;
  let _score   = 0;
  let _lives   = CONFIG.PLAYER.LIVES;
  let _wave    = 1;

  function emit(event, data) {
    const cbs = listeners[event];
    if (cbs) for (const cb of cbs) cb(data);
  }

  return {
    get current() { return _current; },
    get score()   { return _score;   },
    get lives()   { return _lives;   },
    get wave()    { return _wave;    },

    transition(newState) {
      _current = newState;
      emit('stateChanged', newState);
    },

    addScore(points) {
      _score += points;
      emit('score', _score);
    },

    /** @returns {number} remaining lives */
    loseLife() {
      _lives = Math.max(0, _lives - 1);
      emit('lives', _lives);
      return _lives;
    },

    setWave(n) {
      _wave = n;
      emit('wave', n);
    },

    on(event, cb) {
      (listeners[event] ??= []).push(cb);
    },

    off(event, cb) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(fn => fn !== cb);
    },

    get() {
      return { current: _current, score: _score, lives: _lives, wave: _wave };
    },

    reset() {
      _current = STATES.PLAYING;
      _score   = 0;
      _lives   = CONFIG.PLAYER.LIVES;
      _wave    = 1;
    },
  };
}
