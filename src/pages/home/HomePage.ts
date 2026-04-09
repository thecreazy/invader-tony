// HomePage.ts: Mount/unmount coordinator for the home screen — delegates DOM and input to sub-modules

import styles from '../HomePage.css?inline';
import { injectStyle, removeStyle } from '../../utils/dom.ts';
import { buildHomeDOM } from './HomeDOM.ts';
import { createHomeController } from './HomeController.ts';

let _styleEl: HTMLStyleElement | null = null;
let _root: HTMLElement | null = null;
let _container: HTMLElement | null = null;
let _controller: ReturnType<typeof createHomeController> | null = null;

export function mount(container: HTMLElement): void {
  _container = container;
  _styleEl = injectStyle(styles);

  const { root, asciiEl, menuEls, portraitOverlay } = buildHomeDOM((i) =>
    _controller?.onItemClick(i),
  );
  _root = root;

  _controller = createHomeController(menuEls, asciiEl, portraitOverlay);
  _controller.mount();

  _container.appendChild(_root);
}

export function unmount(): void {
  _controller?.unmount();
  _controller = null;
  if (_root && _container) _container.removeChild(_root);
  _root = null;
  _container = null;
  removeStyle(_styleEl);
  _styleEl = null;
}

export const HomePage = { mount, unmount };
