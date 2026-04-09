// EndDOM.ts: Builds the end screen DOM tree and returns element references

import { formatScore } from '../../utils/formatScore.ts';

export interface EndDOMRefs {
  root: HTMLElement;
  nameDisplayEl: HTMLSpanElement;
  cursorEl: HTMLSpanElement;
  hintEl: HTMLElement;
  savedMsg: HTMLElement;
  nameInputWrap: HTMLElement;
  playAgainBtn: HTMLButtonElement;
  leaderboardBtn: HTMLButtonElement;
}

export function buildEndDOM(score: number, isWin: boolean): EndDOMRefs {
  const root = document.createElement('div');
  root.className = 'end-root';
  root.appendChild(Object.assign(document.createElement('div'), { className: 'end-scanlines' }));
  root.appendChild(Object.assign(document.createElement('div'), { className: 'end-vignette' }));

  const content = document.createElement('div');
  content.className = 'end-content';

  const resultEl = document.createElement('div');
  resultEl.className = isWin ? 'end-result-win' : 'end-result-gameover';
  resultEl.textContent = isWin ? 'YOU WIN!' : 'GAME OVER';
  content.appendChild(resultEl);

  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'end-score-label',
      textContent: 'FINAL SCORE',
    }),
  );
  content.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'end-score-value',
      textContent: formatScore(score),
    }),
  );

  const nameSection = document.createElement('div');
  nameSection.className = 'end-name-section';
  nameSection.appendChild(
    Object.assign(document.createElement('div'), {
      className: 'end-name-label',
      textContent: 'ENTER YOUR NAME',
    }),
  );

  const nameInputWrap = document.createElement('div');
  nameInputWrap.className = 'end-name-input-wrap';
  const nameDisplayEl = document.createElement('span');
  nameDisplayEl.className = 'end-name-display';
  const cursorEl = document.createElement('span');
  cursorEl.className = 'end-cursor';
  nameInputWrap.appendChild(nameDisplayEl);
  nameInputWrap.appendChild(cursorEl);

  const hintEl = document.createElement('div');
  hintEl.className = 'end-hint';
  hintEl.textContent = 'MAX 8 CHARS — ENTER TO CONFIRM';
  nameSection.appendChild(nameInputWrap);
  nameSection.appendChild(hintEl);
  content.appendChild(nameSection);

  const savedMsg = document.createElement('div');
  savedMsg.className = 'end-saved-msg';
  content.appendChild(savedMsg);

  const buttons = document.createElement('div');
  buttons.className = 'end-buttons';
  const playAgainBtn = document.createElement('button');
  playAgainBtn.className = 'end-btn end-btn-primary';
  playAgainBtn.textContent = '► PLAY AGAIN';
  const leaderboardBtn = document.createElement('button');
  leaderboardBtn.className = 'end-btn end-btn-secondary';
  leaderboardBtn.textContent = '  HIGH SCORES';
  buttons.appendChild(playAgainBtn);
  buttons.appendChild(leaderboardBtn);
  content.appendChild(buttons);

  root.appendChild(content);
  return {
    root,
    nameDisplayEl,
    cursorEl,
    hintEl,
    savedMsg,
    nameInputWrap,
    playAgainBtn,
    leaderboardBtn,
  };
}
