/**
 * ChiptunePlayer — 8-bit arrangement of "Donne Ricche" by TonyPitony.
 * Pure Web Audio API. No audio files.
 *
 * Architecture: Web Audio scheduler pattern.
 * A setInterval tick runs every SCHEDULE_INTERVAL ms and schedules notes
 * LOOK_AHEAD seconds ahead of audioContext.currentTime.
 * This decouples music timing from the render loop entirely.
 */

const LOOK_AHEAD       = 0.12;  // seconds to schedule ahead
const SCHEDULE_INTERVAL = 50;   // ms between scheduler ticks

const BPM = 118;
const BEAT = 60 / BPM;   // ~0.508s
const S    = BEAT / 2;   // eighth note
const Q    = BEAT / 4;   // sixteenth note
const LOOP_LENGTH = BEAT * 16; // 4 bars of 4/4

// ─── Note builders ────────────────────────────────────────────────────────────

function buildMelody() {
  return [
    // Bar 1 — Emaj7
    { freq: 659.25, dur: BEAT,      beat: 0 },
    { freq: 659.25, dur: S,         beat: 1 },
    { freq: 622.25, dur: S,         beat: 1.5 },
    { freq: 554.37, dur: BEAT,      beat: 2 },
    { freq: 493.88, dur: BEAT,      beat: 3 },
    // Bar 2 — F#6
    { freq: 493.88, dur: S,         beat: 4.5 },
    { freq: 554.37, dur: S,         beat: 5 },
    { freq: 622.25, dur: BEAT,      beat: 5.5 },
    { freq: 554.37, dur: BEAT,      beat: 6 },
    { freq: 493.88, dur: BEAT,      beat: 7 },
    // Bar 3 — G#m
    { freq: 554.37, dur: BEAT,      beat: 8 },
    { freq: 493.88, dur: S,         beat: 9 },
    { freq: 440.00, dur: S,         beat: 9.5 },
    { freq: 415.30, dur: BEAT,      beat: 10 },
    { freq: 415.30, dur: BEAT,      beat: 11 },
    // Bar 4 — D#m
    { freq: 440.00, dur: BEAT,      beat: 12 },
    { freq: 415.30, dur: BEAT,      beat: 13 },
    { freq: 369.99, dur: BEAT * 2,  beat: 14 },
  ];
}

function buildBass() {
  const roots = [82.41, 92.50, 103.83, 77.78]; // E2 F#2 G#2 D#2
  const notes = [];
  for (let bar = 0; bar < 4; bar++) {
    for (let beat = 0; beat < 4; beat++) {
      notes.push({ freq: roots[bar], dur: BEAT * 0.85, beat: bar * 4 + beat });
    }
  }
  return notes;
}

function buildArpeggio() {
  const chords = [
    [329.63, 415.30, 493.88, 622.25],  // Emaj7: E4 G#4 B4 D#5
    [369.99, 466.16, 554.37, 659.25],  // F#6:   F#4 A#4 C#5 E5
    [415.30, 493.88, 622.25, 415.30],  // G#m:   G#4 B4 D#5 G#4
    [311.13, 369.99, 466.16, 554.37],  // D#m:   D#4 F#4 A#4 C#5
  ];
  const notes = [];
  for (let bar = 0; bar < 4; bar++) {
    const chord = chords[bar];
    for (let s = 0; s < 16; s++) {
      notes.push({
        freq: chord[s % chord.length],
        dur:  Q * 0.8,
        beat: bar * 4 + s * 0.25,
      });
    }
  }
  return notes;
}

function buildPercussion() {
  const notes = [];
  for (let beat = 0; beat < 16; beat++) {
    if (beat % 4 === 0 || beat % 4 === 2) {
      notes.push({ type: 'kick',  beat });
    }
    if (beat % 4 === 1 || beat % 4 === 3) {
      notes.push({ type: 'snare', beat });
    }
    notes.push({ type: 'hihat', beat });
    notes.push({ type: 'hihat', beat: beat + 0.5 });
  }
  return notes;
}

// Pre-build note tables once
const MELODY_NOTES = buildMelody();
const BASS_NOTES   = buildBass();
const ARP_NOTES    = buildArpeggio();
const PERC_NOTES   = buildPercussion();

// ─── Oscillator helpers ───────────────────────────────────────────────────────

function createSquareNote(ctx, freq, startTime, duration, gain, masterGain) {
  if (freq === 0) return;
  const osc     = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.005);
  gainNode.gain.setValueAtTime(gain, startTime + duration - 0.01);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

function createTriangleNote(ctx, freq, startTime, duration, gain, masterGain) {
  if (freq === 0) return;
  const osc      = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.setValueAtTime(gain, startTime + duration - 0.02);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

function createNoiseHit(ctx, startTime, duration, filterType, filterFreq, gain, masterGain) {
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
  const buffer     = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data       = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source   = ctx.createBufferSource();
  source.buffer  = buffer;

  const filter         = ctx.createBiquadFilter();
  filter.type          = filterType;
  filter.frequency.value = filterFreq;

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGain);
  source.start(startTime);
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * @returns {{ play: () => void, stop: () => void, setVolume: (v: number) => void, destroy: () => void, get isPlaying(): boolean }}
 */
export function createChiptunePlayer() {
  /** @type {AudioContext | null} */
  let audioCtx = null;
  /** @type {GainNode | null} */
  let masterGain = null;
  /** @type {ReturnType<typeof setInterval> | null} */
  let schedulerInterval = null;
  let _isPlaying  = false;
  let startTime   = 0;
  let scheduledUpTo = 0;

  // ── Scheduler ──────────────────────────────────────────────────────────────

  function scheduleNotes() {
    if (!_isPlaying || !audioCtx || !masterGain) return;
    const now           = audioCtx.currentTime;
    const scheduleUntil = now + LOOK_AHEAD;

    if (scheduledUpTo >= scheduleUntil) return;

    // Determine which loop iterations overlap [scheduledUpTo, scheduleUntil)
    const elapsed0 = Math.max(0, scheduledUpTo - startTime);
    const elapsed1 = Math.max(0, scheduleUntil - startTime);
    const loopN0   = Math.floor(elapsed0 / LOOP_LENGTH);
    const loopN1   = Math.floor(elapsed1 / LOOP_LENGTH);

    for (let ln = loopN0; ln <= loopN1; ln++) {
      const loopStart = startTime + ln * LOOP_LENGTH;

      for (const note of MELODY_NOTES) {
        const t = loopStart + note.beat * BEAT;
        if (t >= scheduledUpTo && t < scheduleUntil) {
          createSquareNote(audioCtx, note.freq, t, note.dur, 0.18, masterGain);
        }
      }

      for (const note of BASS_NOTES) {
        const t = loopStart + note.beat * BEAT;
        if (t >= scheduledUpTo && t < scheduleUntil) {
          createTriangleNote(audioCtx, note.freq, t, note.dur, 0.22, masterGain);
        }
      }

      for (const note of ARP_NOTES) {
        const t = loopStart + note.beat * BEAT;
        if (t >= scheduledUpTo && t < scheduleUntil) {
          createSquareNote(audioCtx, note.freq, t, note.dur, 0.07, masterGain);
        }
      }

      for (const perc of PERC_NOTES) {
        const t = loopStart + perc.beat * BEAT;
        if (t >= scheduledUpTo && t < scheduleUntil) {
          if (perc.type === 'kick') {
            createNoiseHit(audioCtx, t, 0.08, 'lowpass',  200,  0.3,  masterGain);
          } else if (perc.type === 'snare') {
            createNoiseHit(audioCtx, t, 0.12, 'bandpass', 1500, 0.2,  masterGain);
          } else if (perc.type === 'hihat') {
            createNoiseHit(audioCtx, t, 0.04, 'highpass', 8000, 0.08, masterGain);
          }
        }
      }
    }

    scheduledUpTo = scheduleUntil;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    async play() {
      if (_isPlaying) return;

      if (!audioCtx) {
        audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioCtx.destination);
      }

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      _isPlaying    = true;
      startTime     = audioCtx.currentTime;
      scheduledUpTo = startTime;

      schedulerInterval = setInterval(scheduleNotes, SCHEDULE_INTERVAL);
      scheduleNotes(); // prime immediately
    },

    stop() {
      if (!_isPlaying) return;
      _isPlaying = false;

      if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
      }

      // Graceful fade-out — doesn't kill in-flight oscillators
      if (masterGain && audioCtx) {
        const now = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + 0.3);
        setTimeout(() => {
          if (masterGain) {
            masterGain.gain.cancelScheduledValues(0);
            masterGain.gain.value = 0.5;
          }
        }, 400);
      }
    },

    setVolume(v) {
      if (!masterGain) return;
      const clamped = Math.max(0, Math.min(1, v));
      if (audioCtx) {
        const now = audioCtx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(clamped, now + 0.05);
      } else {
        masterGain.gain.value = clamped;
      }
    },

    get isPlaying() {
      return _isPlaying;
    },

    destroy() {
      this.stop();
      setTimeout(() => {
        if (audioCtx) {
          audioCtx.close();
          audioCtx  = null;
          masterGain = null;
        }
      }, 450);
    },
  };
}
