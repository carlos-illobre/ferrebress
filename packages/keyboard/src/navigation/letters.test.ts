// El menú con letras propias (00 · R2.13): Alt 0 lleva la marca ahí y la letra sola toca la opción;
// con Alt, las letras no lo alcanzan.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKeyboard } from '../testing.ts';
import { startNavigation } from './navigation.ts';

const key = (code: string, extra: KeyboardEventInit = {}, target: EventTarget = window) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: code.slice(-1).toLowerCase(),
      code,
      bubbles: true,
      cancelable: true,
      ...extra,
    }),
  );

function page(html: string) {
  document.body.innerHTML = html;
  const clicks: string[] = [];
  for (const button of document.querySelectorAll('button'))
    button.addEventListener('click', () => clicks.push(button.id));
  return clicks;
}

const markedId = () => document.querySelector('.marked')?.id;
const tick = () => new Promise((resolve) => setTimeout(resolve));

const frame = `
  <div data-layer>
    <nav data-letters>
      <button id="sell" data-mark data-key="v">Vender</button>
      <button id="catalog" data-mark data-key="c" aria-current="page">Catálogo</button>
      <button id="more" data-mark data-key="m" aria-expanded="false">Más</button>
      <button id="soon" data-mark data-key="p" disabled>Depósito</button>
    </nav>
    <main><input aria-label="Buscar" /><button id="margins" data-mark data-key="m">Márgenes</button></main>
  </div>`;

describe('las letras del menú', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('app-E17b: Alt 0 marca la parte abierta y la letra sola toca su opción, sin sacar la marca', () => {
    const clicks = page(frame);
    key('Digit0', { altKey: true });
    expect(markedId()).toBe('catalog');
    key('KeyV');
    expect(clicks).toEqual(['sell']);
    expect(markedId()).toBe('catalog');
    // Una letra sin opción, o la de una apagada, no hace nada; con Ctrl tampoco.
    key('KeyX');
    key('KeyP');
    key('KeyV', { ctrlKey: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(clicks).toEqual(['sell', 'catalog']);
  });

  it('app-E17b: lo que abre algo encima se abre marcando lo primero de adentro', async () => {
    page(frame);
    const more = document.getElementById('more') as HTMLElement;
    more.addEventListener('click', () => {
      more.setAttribute('aria-expanded', 'true');
      document.body.insertAdjacentHTML(
        'beforeend',
        '<ul data-layer data-letters><li><button id="manual" data-mark data-key="l">Manual</button></li></ul>',
      );
    });
    key('Digit0', { altKey: true });
    key('KeyM');
    await tick();
    expect(markedId()).toBe('manual');
    // En Más, que es una capa con letras propias, también van sin Alt.
    const clicks: string[] = [];
    document.getElementById('manual')?.addEventListener('click', () => clicks.push('manual'));
    key('KeyL');
    expect(clicks).toEqual(['manual']);
  });

  it('app-E17c: con Alt, la letra es de la pantalla; sin la marca en el menú, o escribiendo, la letra sola no hace nada', () => {
    const clicks = page(frame);
    key('KeyM', { altKey: true });
    key('KeyV');
    key('Digit0', { altKey: true });
    key('KeyV', {}, document.querySelector('input') as HTMLInputElement);
    expect(clicks).toEqual([]);
  });

  it('sin menú, Alt 0 no hace nada; sin aria-current, marca lo primero', () => {
    page('<div data-layer><button id="a" data-mark>A</button></div>');
    key('Digit0', { altKey: true });
    expect(markedId()).toBeUndefined();
    page('<div data-layer><nav data-letters><button id="a" data-mark>A</button></nav></div>');
    key('Digit0', { altKey: true });
    expect(markedId()).toBe('a');
  });
});

describe('sin la tecla del menú', () => {
  it('Alt 0 no hace nada', () => {
    const stop = startNavigation();
    page('<div data-layer><nav data-letters><button id="a" data-mark>A</button></nav></div>');
    key('Digit0', { altKey: true });
    expect(markedId()).toBeUndefined();
    stop();
  });
});
