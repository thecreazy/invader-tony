// dom.ts: Shared DOM utilities — element creation, style injection and removal

export function el(tag: string, className = '', text = ''): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

export function injectStyle(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

export function removeStyle(styleElement: HTMLStyleElement | null): void {
  if (styleElement?.parentNode) styleElement.parentNode.removeChild(styleElement);
}
