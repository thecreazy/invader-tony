/**
 * Shared DOM utilities.
 */

/**
 * Creates an element with optional className and textContent.
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text]
 * @returns {HTMLElement}
 */
export function el(tag, className = '', text = '') {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

/**
 * Injects a <style> tag into document.head.
 * @param {string} css
 * @returns {HTMLStyleElement}
 */
export function injectStyle(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

/**
 * Removes a <style> element from document.head.
 * @param {HTMLStyleElement | null} styleElement
 */
export function removeStyle(styleElement) {
  if (styleElement && styleElement.parentNode) {
    styleElement.parentNode.removeChild(styleElement);
  }
}
