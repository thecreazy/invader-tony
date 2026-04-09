// GameState.ts: Centralised game state store with a typed minimal event emitter

import { CONFIG } from '../config.ts';
import type { IGameState, GamePhase as GamePhaseType } from '../types/game.ts';
import { GamePhase } from '../types/game.ts';

export { GamePhase };

type Listener = (data: unknown) => void;

export function createGameState(): IGameState {
  const listeners: Record<string, Listener[]> = {};

  let _current: GamePhaseType = GamePhase.PLAYING;
  let _score = 0;
  let _lives = CONFIG.PLAYER.LIVES;
  let _wave = 1;

  function emit(event: string, data: unknown): void {
    const cbs = listeners[event];
    if (cbs) for (const cb of cbs) cb(data);
  }

  return {
    get current() {
      return _current;
    },
    get score() {
      return _score;
    },
    get lives() {
      return _lives;
    },
    get wave() {
      return _wave;
    },

    transition(newState) {
      _current = newState;
      emit('stateChanged', newState);
    },

    addScore(points) {
      _score += points;
      emit('score', _score);
    },

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
      listeners[event] = listeners[event].filter((fn) => fn !== cb);
    },

    get() {
      return { current: _current, score: _score, lives: _lives, wave: _wave };
    },

    reset() {
      _current = GamePhase.PLAYING;
      _score = 0;
      _lives = CONFIG.PLAYER.LIVES;
      _wave = 1;
    },
  };
}
