// EndConditions.ts: Writes session data to sessionStorage and routes to the end page

import { navigate } from '../router.ts';
import { GamePhase } from '../core/GameState.ts';
import type { IGameState, IChiptunePlayer, IAudioManager } from '../types/game.ts';

export interface EndConditionsOpts {
  gameState: IGameState;
  chiptunePlayer: IChiptunePlayer;
  audioManager: IAudioManager;
  onDeactivateTonyMode: () => void;
  getSessionToken: () => string | null;
  getScoreHash: () => string;
}

export function createEndConditions(opts: EndConditionsOpts) {
  const {
    gameState,
    chiptunePlayer,
    audioManager,
    onDeactivateTonyMode,
    getSessionToken,
    getScoreHash,
  } = opts;

  function writeSession(result: string): void {
    sessionStorage.setItem('tony_invaders_final_score', String(gameState.score));
    sessionStorage.setItem('tony_invaders_result', result);
    sessionStorage.setItem('cage_invaders_session_token', getSessionToken() ?? '');
    sessionStorage.setItem('cage_invaders_score_hash', getScoreHash());
  }

  return {
    triggerGameOver(): void {
      if (gameState.current === GamePhase.GAME_OVER) return;
      gameState.transition(GamePhase.GAME_OVER);
      onDeactivateTonyMode();
      chiptunePlayer.stop();
      audioManager.playGameOver();
      writeSession('game_over');
      setTimeout(() => navigate('/end'), 1800);
    },

    triggerVictory(): void {
      if (gameState.current === GamePhase.VICTORY) return;
      gameState.transition(GamePhase.VICTORY);
      onDeactivateTonyMode();
      chiptunePlayer.stop();
      audioManager.playVictory();
      writeSession('victory');
      setTimeout(() => navigate('/end'), 1800);
    },
  };
}
