// EndController.ts: Name input state machine and async score submission logic

import { saveScore, LeaderboardError } from '../../services/leaderboard.ts';
import type { EndDOMRefs } from './EndDOM.ts';

const ERROR_MESSAGES: Record<string, string> = {
  NICKNAME_PROFANITY: 'NAME NOT ALLOWED',
  INVALID_NAME: 'INVALID NAME',
  RATE_LIMIT: 'SLOW DOWN!',
  MISSING_TOKEN: 'PLAY THE GAME FIRST',
  INVALID_TOKEN: 'INVALID SESSION',
  TOKEN_EXPIRED: 'SESSION EXPIRED',
  SESSION_ALREADY_USED: 'SESSION ALREADY USED',
  DEFAULT: 'SAVE FAILED',
};

export function createEndController(
  refs: EndDOMRefs,
  score: number,
  meta: { sessionToken: string; scoreHash: string },
): { cleanup: () => void } {
  const {
    nameDisplayEl,
    cursorEl,
    hintEl,
    savedMsg,
    nameInputWrap,
    nameForm,
    nameRealInput,
    saveBtn,
  } = refs;

  let name = '';
  let submitting = false;

  function renderName(): void {
    nameDisplayEl.textContent = name.padEnd(8, '_');
  }
  renderName();

  // Single exit point from the end screen: save, then hand off to the leaderboard page
  // (which already offers "play again"), so no Enter-key flow needs to be discovered.
  async function submitScore(): Promise<void> {
    if (submitting) return;
    submitting = true;
    saveBtn.disabled = true;
    cursorEl.style.display = 'none';
    savedMsg.textContent = 'SAVING...';
    savedMsg.className = 'end-saved-msg';
    try {
      await saveScore(name.trim() || 'AAA', score, meta);
      nameInputWrap.style.borderColor = '#39ff14';
      nameInputWrap.style.boxShadow = '0 0 8px #39ff14';
      savedMsg.textContent = 'SCORE SAVED!';
      window.location.href = '/leaderboard';
    } catch (err) {
      submitting = false;
      saveBtn.disabled = false;
      cursorEl.style.display = '';
      const msg =
        err instanceof LeaderboardError
          ? (ERROR_MESSAGES[err.code] ?? ERROR_MESSAGES['DEFAULT'])
          : ERROR_MESSAGES['DEFAULT'];
      savedMsg.textContent = msg;
      savedMsg.className = 'end-saved-msg end-save-error';
      hintEl.textContent = 'TRY AGAIN';
      nameInputWrap.classList.add('end-shake');
      nameInputWrap.addEventListener(
        'animationend',
        () => nameInputWrap.classList.remove('end-shake'),
        { once: true },
      );
    }
  }

  // Real <input> drives the actual typing — required for mobile to raise the on-screen
  // keyboard at all (see EndDOM.ts). Sanitised/uppercased here, mirrored onto the
  // pixel-font display so the arcade look is unchanged.
  function onNameInput(): void {
    if (submitting) return;
    const sanitized = nameRealInput.value
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, '')
      .slice(0, 8);
    if (sanitized !== nameRealInput.value) nameRealInput.value = sanitized;
    name = sanitized;
    renderName();
  }

  nameRealInput.addEventListener('input', onNameInput);
  nameInputWrap.addEventListener('click', () => nameRealInput.focus());
  // Native form submit (keyboard "Go"/Enter inside the input) just mirrors the SALVA button.
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    void submitScore();
  });
  saveBtn.addEventListener('click', () => void submitScore());

  // Auto-focus so desktop players can type immediately without clicking first — mobile
  // browsers ignore script-triggered focus for opening the keyboard, so this is a no-op
  // there and a tap is still required, as expected.
  nameRealInput.focus();

  return { cleanup() {} };
}
