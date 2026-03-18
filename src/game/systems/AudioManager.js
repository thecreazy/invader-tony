/**
 * Audio manager — wraps the Web Audio API for sound effects and music.
 * Procedurally generates retro beeps/blasts so no audio assets are required.
 */

/**
 * Creates the audio manager backed by a Web Audio context.
 * @returns {{ play: (sound: string) => void, setMuted: (muted: boolean) => void, dispose: () => void }}
 */
export function createAudioManager() {
  // TODO: implement

  return {
    /**
     * Plays a named sound effect.
     * @param {string} sound - Sound key e.g. 'shoot', 'explosion', 'hit', 'boss'.
     */
    play(sound) {
      // TODO: implement
    },

    /**
     * Mutes or unmutes all audio.
     * @param {boolean} muted
     */
    setMuted(muted) {
      // TODO: implement
    },

    /** Closes the Web Audio context and frees resources. */
    dispose() {
      // TODO: implement
    },
  };
}
