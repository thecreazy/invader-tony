// EndController.ts: Name input state machine and async score submission logic

import { navigate } from '../../router.ts';
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
    playAgainBtn,
    leaderboardBtn,
  } = refs;

  let name = '';
  let submitted = false;
  let submitting = false;

  function renderName(): void {
    nameDisplayEl.textContent = name.padEnd(8, '_');
  }
  renderName();

  async function submitScore(): Promise<void> {
    if (submitted || submitting) return;
    submitting = true;
    cursorEl.style.display = 'none';
    savedMsg.textContent = 'SAVING...';
    savedMsg.className = 'end-saved-msg';
    hintEl.textContent = '';
    try {
      await saveScore(name.trim() || 'AAA', score, meta);
      submitted = true;
      submitting = false;
      nameInputWrap.style.borderColor = '#39ff14';
      nameInputWrap.style.boxShadow = '0 0 8px #39ff14';
      savedMsg.textContent = 'SCORE SAVED!';
      hintEl.textContent = 'PRESS ENTER TO PLAY AGAIN';
    } catch (err) {
      submitting = false;
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

  // Global fallback — lets the "submitted" state react to Enter/Space from anywhere on
  // the page (no focused element required), and lets desktop players hit Enter to submit
  // even if focus ever leaves the input.
  function onKeyDown(e: KeyboardEvent): void {
    if (submitting) return;
    if (submitted) {
      if (e.key === 'Enter' || e.key === ' ') navigate('/game');
      return;
    }
    if (e.key === 'Enter' && document.activeElement !== nameRealInput) {
      void submitScore();
    }
  }

  window.addEventListener('keydown', onKeyDown);

  // Real <input> drives the actual typing — required for mobile to raise the on-screen
  // keyboard at all (see EndDOM.ts). Sanitised/uppercased here, mirrored onto the
  // pixel-font display so the arcade look is unchanged.
  function onNameInput(): void {
    if (submitting || submitted) return;
    const sanitized = nameRealInput.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8);
    if (sanitized !== nameRealInput.value) nameRealInput.value = sanitized;
    name = sanitized;
    renderName();
  }

  nameRealInput.addEventListener('input', onNameInput);
  nameInputWrap.addEventListener('click', () => nameRealInput.focus());
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitted) navigate('/game');
    else void submitScore();
  });

  // Auto-focus so desktop players can type immediately without clicking first — mobile
  // browsers ignore script-triggered focus for opening the keyboard, so this is a no-op
  // there and a tap is still required, as expected.
  nameRealInput.focus();

  playAgainBtn.addEventListener('click', () => {
    if (!submitted && !submitting) saveScore(name.trim() || 'AAA', score, meta).catch(() => {});
    navigate('/game');
  });
  leaderboardBtn.addEventListener('click', () => {
    if (!submitted && !submitting) saveScore(name.trim() || 'AAA', score, meta).catch(() => {});
    window.location.href = '/leaderboard';
  });

  return {
    cleanup() {
      window.removeEventListener('keydown', onKeyDown);
    },
  };
}
