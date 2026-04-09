// ChiptunePlayer.ts: Background OGG music player using blob URL preloaded by AudioCache

import { getAudioUrl } from '../loading/AudioCache.ts';
import type { IChiptunePlayer } from '../types/game.ts';

export function createChiptunePlayer(): IChiptunePlayer {
  let audio: HTMLAudioElement | null = null;

  return {
    play() {
      if (!audio) {
        audio = new Audio(getAudioUrl());
        audio.loop = true;
        audio.volume = 0.5;
      }
      return audio.play();
    },

    stop() {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    },

    setVolume(v) {
      if (audio) audio.volume = Math.max(0, Math.min(1, v));
    },

    get isPlaying() {
      return audio ? !audio.paused : false;
    },

    destroy() {
      if (audio) {
        audio.pause();
        audio.src = '';
        audio = null;
      }
    },
  };
}
