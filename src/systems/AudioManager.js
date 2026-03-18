/**
 * Procedural audio manager using Web Audio API.
 * No audio files — all sounds are synthesised on the fly.
 * AudioContext is initialised lazily on first use (browsers require user gesture).
 */

export function createAudioManager() {
  /** @type {AudioContext | null} */
  let ctx  = null;
  /** @type {GainNode | null} */
  let master = null;

  function ensureCtx() {
    if (ctx) return;
    ctx    = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);
  }

  /**
   * Play a simple oscillator tone.
   * @param {number}  freq     Start frequency (Hz)
   * @param {string}  type     OscillatorType
   * @param {number}  duration Seconds
   * @param {number}  [freqEnd] Optional ramp target
   * @param {number}  [vol]    Volume 0-1 (default 0.5)
   */
  function tone(freq, type, duration, freqEnd, vol = 0.5) {
    try {
      ensureCtx();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(master);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          Math.max(freqEnd, 1), ctx.currentTime + duration
        );
      }
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (_) { /* blocked until first gesture */ }
  }

  /** One-shot white noise burst. */
  function noise(duration, vol = 1.0) {
    try {
      ensureCtx();
      const sampleRate = ctx.sampleRate;
      const bufLen     = Math.floor(sampleRate * duration);
      const buf        = ctx.createBuffer(1, bufLen, sampleRate);
      const data       = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

      const src  = ctx.createBufferSource();
      const gain = ctx.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      src.start(ctx.currentTime);
    } catch (_) { /* blocked */ }
  }

  return {
    init() { /* intentionally lazy */ },

    playShoot()     { tone(880, 'square',   0.08, 440); },
    playExplosion() { noise(0.15, 0.8); tone(80, 'sawtooth', 0.15, 30, 0.3); },
    playHit()       { tone(220, 'sine',    0.06); },
    playBossHit()   { tone(110, 'sawtooth', 0.10); },

    playGameOver() {
      try {
        ensureCtx();
        [440, 330, 220, 110].forEach((f, i) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(master);
          osc.type = 'square';
          osc.frequency.value = f;
          const t = ctx.currentTime + i * 0.13;
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
          osc.start(t);
          osc.stop(t + 0.14);
        });
      } catch (_) { /* blocked */ }
    },

    playVictory() {
      try {
        ensureCtx();
        [523, 659, 784, 1047].forEach((f, i) => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(master);
          osc.type = 'sine';
          osc.frequency.value = f;
          const t = ctx.currentTime + i * 0.10;
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          osc.start(t);
          osc.stop(t + 0.12);
        });
      } catch (_) { /* blocked */ }
    },

    destroy() {
      if (ctx) { ctx.close().catch(() => {}); ctx = null; }
    },
  };
}
