// AudioManager.ts: Web Audio API procedural SFX — all sounds synthesised, no audio files

import type { IAudioManager } from '../types/game.ts';

export function createAudioManager(): IAudioManager {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let _tonyOscLoop: ReturnType<typeof setTimeout> | null = null;

  function ensureCtx(): AudioContext {
    if (!ctx) {
      ctx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      master = ctx.createGain();
      master.gain.value = 0.3;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  function tone(
    freq: number,
    type: OscillatorType,
    duration: number,
    freqEnd?: number,
    vol = 0.5,
  ): void {
    try {
      const c = ensureCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(master!);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), c.currentTime + duration);
      }
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration + 0.01);
    } catch (_) {}
  }

  function noise(duration: number, vol = 1.0): void {
    try {
      const c = ensureCtx();
      const sampleRate = c.sampleRate;
      const bufLen = Math.floor(sampleRate * duration);
      const buf = c.createBuffer(1, bufLen, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const gain = c.createGain();
      src.buffer = buf;
      src.connect(gain);
      gain.connect(master!);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      src.start(c.currentTime);
    } catch (_) {}
  }

  function scheduleTones(
    freqs: number[],
    type: OscillatorType,
    dur: number,
    gap: number,
    vol = 0.4,
  ): void {
    try {
      const c = ensureCtx();
      freqs.forEach((f, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(master!);
        osc.type = type;
        osc.frequency.value = f;
        const t = c.currentTime + i * gap;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.start(t);
        osc.stop(t + dur + 0.01);
      });
    } catch (_) {}
  }

  return {
    init() {},

    playShoot() {
      tone(880, 'square', 0.08, 440);
    },
    playExplosion() {
      noise(0.15, 0.8);
      tone(80, 'sawtooth', 0.15, 28, 0.3);
    },
    playHit() {
      tone(220, 'sine', 0.06);
    },

    playBossHit() {
      tone(330, 'sawtooth', 0.12, undefined, 0.45);
      tone(165, 'sawtooth', 0.12, undefined, 0.35);
    },

    playBossEntry() {
      try {
        const c = ensureCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(master!);
        osc.type = 'sawtooth';
        osc.frequency.value = 55;
        gain.gain.setValueAtTime(0.001, c.currentTime);
        gain.gain.linearRampToValueAtTime(0.6, c.currentTime + 0.5);
        gain.gain.setValueAtTime(0.6, c.currentTime + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 2.1);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 2.2);
      } catch (_) {}
    },

    playGameOver() {
      scheduleTones([440, 330, 220, 110], 'square', 0.11, 0.13);
    },
    playVictory() {
      scheduleTones([523, 659, 784, 1047, 1318], 'sine', 0.1, 0.1);
    },
    playWaveClear() {
      scheduleTones([523, 659, 784], 'sine', 0.12, 0.16, 0.5);
    },

    startTonyLoop() {
      try {
        const c = ensureCtx();
        const freqs = [261, 329, 392, 523, 659, 784, 1047];
        let offset = 0;
        const scheduleNext = () => {
          if (!ctx) return;
          freqs.forEach((f, i) => {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain);
            gain.connect(master!);
            osc.type = 'square';
            osc.frequency.value = f;
            const t = c.currentTime + offset + i * 0.07;
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
      if (_tonyOscLoop) {
        clearTimeout(_tonyOscLoop);
        _tonyOscLoop = null;
      }
    },

    destroy() {
      this.stopTonyLoop();
      if (ctx) {
        ctx.close().catch(() => {});
        ctx = null;
      }
    },
  };
}
