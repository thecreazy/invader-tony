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
  const { nameDisplayEl, cursorEl, hintEl, savedMsg, nameInputWrap, playAgainBtn, leaderboardBtn } =
    refs;

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

  function onKeyDown(e: KeyboardEvent): void {
    if (submitting) return;
    if (submitted) {
      if (e.key === 'Enter' || e.key === ' ') navigate('/game');
      return;
    }
    if (e.key === 'Backspace') {
      name = name.slice(0, -1);
      renderName();
    } else if (e.key === 'Enter') {
      void submitScore();
    } else if (e.key.length === 1 && /[a-zA-Z0-9 ]/.test(e.key) && name.length < 8) {
      name += e.key.toUpperCase();
      renderName();
    }
  }

  window.addEventListener('keydown', onKeyDown);

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
