// EndPage.ts: Mount/unmount coordinator for the end screen — reads sessionStorage, delegates to DOM + controller

import styles from '../EndPage.css?inline';
import { injectStyle, removeStyle } from '../../utils/dom.ts';
import { createPortraitGuard, type PortraitGuard } from '../../utils/portraitGuard.ts';
import { buildEndDOM } from './EndDOM.ts';
import { createEndController } from './EndController.ts';

let _styleEl: HTMLStyleElement | null = null;
let _root: HTMLElement | null = null;
let _container: HTMLElement | null = null;
let _cleanup: (() => void) | null = null;
let _portraitGuard: PortraitGuard | null = null;

export function mount(container: HTMLElement): void {
  _container = container;

  const score = parseInt(sessionStorage.getItem('tony_invaders_final_score') ?? '0', 10);
  const result = sessionStorage.getItem('tony_invaders_result') ?? '';
  const isWin = result === 'win' || result === 'victory';
  const sessionToken = sessionStorage.getItem('cage_invaders_session_token') ?? '';
  const scoreHash = sessionStorage.getItem('cage_invaders_score_hash') ?? '';

  _styleEl = injectStyle(styles);
  const refs = buildEndDOM(score, isWin);
  _root = refs.root;
  const ctrl = createEndController(refs, score, { sessionToken, scoreHash });
  _cleanup = ctrl.cleanup;
  _portraitGuard = createPortraitGuard(_root);
  _container.appendChild(_root);
}

export function unmount(): void {
  _cleanup?.();
  _cleanup = null;
  _portraitGuard?.destroy();
  _portraitGuard = null;
  if (_root && _container) _container.removeChild(_root);
  _root = null;
  _container = null;
  removeStyle(_styleEl);
  _styleEl = null;
}

export const EndPage = { mount, unmount };
