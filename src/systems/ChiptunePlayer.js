export function createChiptunePlayer() {
  let audio = null;

  return {
    play() {
      if (!audio) {
        audio = new Audio('/assets/donne_ricche.ogg');
        audio.loop = true;
        audio.volume = 0.5;
        audio.preload = 'none'; // don't fetch until first play()
      }
      audio.play().catch(() => {});
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
