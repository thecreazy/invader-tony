/**
 * Procedural audio manager using Web Audio API.
 * No audio files — all sounds are synthesised on the fly.
 * AudioContext initialised lazily on first user gesture.
 */

export function createAudioManager() {
  let ctx    = null;
  let master = null;
  let _tonyOscLoop = null; // for Tony Mode ascending loop

  function ensureCtx() {
    if (ctx) return;
    ctx    = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);
  }

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
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (_) {}
  }

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
    } catch (_) {}
  }

  function scheduleTones(freqs, type, dur, gap, vol = 0.4) {
    try {
      ensureCtx();
      freqs.forEach((f, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);
        osc.type = type;
        osc.frequency.value = f;
        const t = ctx.currentTime + i * gap;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      });
    } catch (_) {}
  }

  return {
    init() {},

    playShoot()     { tone(880, 'square',   0.08, 440); },
    playExplosion() { noise(0.15, 0.8); tone(80, 'sawtooth', 0.15, 28, 0.3); },
    playHit()       { tone(220, 'sine', 0.06); },

    /** Two-tone simultaneous hit (330hz + 165hz) for boss */
    playBossHit() {
      tone(330, 'sawtooth', 0.12, undefined, 0.45);
      tone(165, 'sawtooth', 0.12, undefined, 0.35);
    },

    /** Low 55hz drone — plays for 2 seconds as boss enters */
    playBossEntry() {
      try {
        ensureCtx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);
        osc.type = 'sawtooth';
        osc.frequency.value = 55;
        // Fade in, then sustain
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.6, ctx.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 2.2);
      } catch (_) {}
    },

    playGameOver() {
      scheduleTones([440, 330, 220, 110], 'square', 0.11, 0.13);
    },

    playVictory() {
      scheduleTones([523, 659, 784, 1047, 1318], 'sine', 0.10, 0.10);
    },

    /** Ascending 3-note fanfare for wave clear: C5 → E5 → G5 */
    playWaveClear() {
      scheduleTones([523, 659, 784], 'sine', 0.12, 0.16, 0.5);
    },

    /** Repeating ascending fanfare loop for Tony Mode — call once, then stop with stopTonyLoop */
    startTonyLoop() {
      try {
        ensureCtx();
        const freqs = [261, 329, 392, 523, 659, 784, 1047];
        let offset = 0;
        const scheduleNext = () => {
          if (!ctx) return;
          freqs.forEach((f, i) => {
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(master);
            osc.type = 'square';
            osc.frequency.value = f;
            const t = ctx.currentTime + offset + i * 0.07;
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.start(t);
            osc.stop(t + 0.07);
          });
          offset += freqs.length * 0.07 + 0.2;
          _tonyOscLoop = setTimeout(scheduleNext, (freqs.length * 0.07 + 0.2) * 1000);
        };
        scheduleNext();
      } catch (_) {}
    },

    stopTonyLoop() {
      if (_tonyOscLoop) { clearTimeout(_tonyOscLoop); _tonyOscLoop = null; }
    },

    destroy() {
      this.stopTonyLoop();
      if (ctx) { ctx.close().catch(() => {}); ctx = null; }
    },
  };
}
