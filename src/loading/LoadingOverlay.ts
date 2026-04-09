// LoadingOverlay.ts: Builds and manages the loading screen DOM — progress bar, status text, animations

export interface ILoadingOverlay {
  element: HTMLElement;
  setProgress(pct: number): void;
  setStatus(text: string): void;
  fadeOut(): Promise<void>;
}

export function createLoadingOverlay(): ILoadingOverlay {
  const overlay = document.createElement('div');
  overlay.id = 'loading-screen';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '9999',
    fontFamily: '"Press Start 2P", monospace',
    color: '#39ff14',
    overflow: 'hidden',
  });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes ls-glow   { from{text-shadow:0 0 10px #ff6600,0 0 20px #ff6600} to{text-shadow:0 0 20px #ff6600,0 0 40px #ff6600,0 0 60px #ff6600} }
    @keyframes ls-march  { 0%{letter-spacing:10px} 50%{letter-spacing:14px} 100%{letter-spacing:10px} }
  `;
  overlay.appendChild(style);

  const scanlines = document.createElement('div');
  Object.assign(scanlines.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '1',
    background:
      'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)',
  });
  overlay.appendChild(scanlines);

  const vignette = document.createElement('div');
  Object.assign(vignette.style, {
    position: 'absolute',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '1',
    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.8) 100%)',
  });
  overlay.appendChild(vignette);

  const content = document.createElement('div');
  Object.assign(content.style, {
    position: 'relative',
    zIndex: '2',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '22px',
    width: 'min(90vw, 480px)',
    padding: '0 16px',
  });
  overlay.appendChild(content);

  const title = document.createElement('div');
  Object.assign(title.style, {
    fontSize: 'clamp(16px,4vw,28px)',
    color: '#ff6600',
    letterSpacing: '6px',
    textAlign: 'center',
    animation: 'ls-glow 1.5s ease-in-out infinite alternate',
  });
  title.textContent = 'INVADER TONY';
  content.appendChild(title);

  const invaderRow = document.createElement('div');
  Object.assign(invaderRow.style, {
    display: 'flex',
    gap: '18px',
    color: '#ffaa00',
    fontSize: 'clamp(10px,2vw,14px)',
    textShadow: '0 0 6px #ffaa00',
    animation: 'ls-march 2s ease-in-out infinite',
  });
  [
    '\u2588\u2584\u2588',
    '\u2584\u2588\u2584',
    '\u2588\u2584\u2588',
    '\u2584\u2588\u2584',
    '\u2588\u2584\u2588',
  ].forEach((ch) => {
    const sp = document.createElement('span');
    sp.textContent = ch;
    invaderRow.appendChild(sp);
  });
  content.appendChild(invaderRow);

  const sep = document.createElement('div');
  Object.assign(sep.style, {
    width: '100%',
    height: '2px',
    background: '#39ff14',
    boxShadow: '0 0 8px #39ff14',
  });
  content.appendChild(sep);

  const barWrap = document.createElement('div');
  Object.assign(barWrap.style, {
    width: '100%',
    height: '18px',
    border: '2px solid #39ff14',
    boxShadow: '0 0 8px #39ff14, inset 0 0 6px rgba(57,255,20,0.06)',
    position: 'relative',
    overflow: 'hidden',
  });

  const barFill = document.createElement('div');
  Object.assign(barFill.style, {
    position: 'absolute',
    left: '0',
    top: '0',
    height: '100%',
    width: '0%',
    background: '#39ff14',
    boxShadow: '0 0 14px #39ff14',
    transition: 'width 0.25s ease-out',
  });
  barWrap.appendChild(barFill);
  content.appendChild(barWrap);

  const percentEl = document.createElement('div');
  Object.assign(percentEl.style, {
    fontSize: 'clamp(12px,3vw,18px)',
    color: '#39ff14',
    textShadow: '0 0 8px #39ff14',
    letterSpacing: '4px',
  });
  percentEl.textContent = '0%';
  content.appendChild(percentEl);

  const statusEl = document.createElement('div');
  Object.assign(statusEl.style, {
    fontSize: 'clamp(6px,1.5vw,9px)',
    color: '#00ffff',
    textShadow: '0 0 6px #00ffff',
    letterSpacing: '2px',
    minHeight: '2em',
    textAlign: 'center',
  });
  statusEl.textContent = 'INITIALIZING...';
  content.appendChild(statusEl);

  const footer = document.createElement('div');
  Object.assign(footer.style, {
    fontSize: '7px',
    color: '#333',
    letterSpacing: '1px',
    textAlign: 'center',
  });
  footer.textContent = '\u00A9 1992 RICCARDO CANELLA';
  content.appendChild(footer);

  return {
    element: overlay,

    setProgress(pct) {
      barFill.style.width = `${pct}%`;
      percentEl.textContent = `${Math.round(pct)}%`;
    },

    setStatus(text) {
      statusEl.textContent = text;
    },

    fadeOut() {
      return new Promise((resolve) => {
        Object.assign(overlay.style, { transition: 'opacity 0.4s ease-out', opacity: '0' });
        setTimeout(() => {
          overlay.remove();
          resolve();
        }, 420);
      });
    },
  };
}
