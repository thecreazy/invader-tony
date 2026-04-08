import { getAudioUrl } from '../LoadingScreen.js';

export function createChiptunePlayer() {
  let audio = null;

  return {
    play() {
      if (!audio) {
        // getAudioUrl() returns the blob URL preloaded by LoadingScreen (already in memory)
        audio = new Audio(getAudioUrl());
        audio.loop = true;
        audio.volume = 0.5;
      }
      // Return the promise so callers can detect autoplay blocks
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
