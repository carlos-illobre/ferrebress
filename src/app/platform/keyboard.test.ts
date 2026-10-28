import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from './keyboard.ts';

const press = (key: string, extra: KeyboardEventInit = {}, target: EventTarget = window) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }),
  );

function page(html: string) {
  document.body.innerHTML = html;
  const clicks: string[] = [];
  for (const button of document.querySelectorAll('button')) {
    button.addEventListener('click', () => clicks.push(button.id));
  }
  return clicks;
}

const markedId = () => document.querySelector('.marked')?.id;
const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('el teclado de la computadora', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => {
    stop();
    document.body.className = '';
    vi.unstubAllGlobals();
  });

  it('app-E11: con Alt se ven las teclas, y al soltarlo o salir de la ventana se esconden', () => {
    press('Alt');
    expect(document.body.classList.contains('show-keys')).toBe(true);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    expect(document.body.classList.contains('show-keys')).toBe(false);
    press('Alt');
    window.dispatchEvent(new Event('blur'));
    expect(document.body.classList.contains('show-keys')).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Shift' }));
  });

  it('app-E12, E13 y E14: Alt más la tecla de un botón lo toca; solo valen los de la capa de arriba', () => {
    const clicks = page(`
      <main data-layer><button id="google" data-key="g">Google</button><button id="off" data-key="o" disabled>No</button></main>
      <section data-layer><button id="cancel" data-key="c">Cancelar</button></section>`);
    press('g', { altKey: true, code: 'KeyG' });
    press('o', { altKey: true, code: 'KeyO' });
    press('c', { altKey: true, code: 'KeyC' });
    expect(clicks).toEqual(['cancel']);
    document.querySelector('section')?.remove();
    press('g', { altKey: true, code: 'KeyG' });
    press('1', { altKey: true, code: 'Digit1' });
    expect(clicks).toEqual(['cancel', 'google']);
  });

  it('app-E16: en una caja con texto, Ctrl+C, V, X, Z y A hacen lo de siempre', () => {
    document.body.innerHTML = '<main data-layer><input aria-label="Buscar" data-key="c" /></main>';
    const box = document.querySelector('input') as HTMLInputElement;
    box.focus();
    for (const key of ['c', 'v', 'x', 'z', 'a'])
      expect(press(key, { ctrlKey: true, code: `Key${key.toUpperCase()}` }, box)).toBe(true);
  });

  it('app-E09 y E10: las flechas recorren lo marcable, Enter lo toca, Esc saca la marca', () => {
    const clicks = page(`
      <main data-layer>
        <button id="a" data-mark>A</button><button id="b" data-mark>B</button>
        <button id="hidden" data-mark style="display: none">Escondido</button>
      </main>`);
    press('ArrowUp');
    expect(markedId()).toBe('b');
    press('ArrowDown');
    expect(markedId()).toBe('b');
    press('ArrowLeft');
    expect(markedId()).toBe('a');
    press('ArrowRight');
    press('Enter');
    expect(clicks).toEqual(['b']);
    press('Escape');
    expect(markedId()).toBeUndefined();
    press('Enter');
    expect(clicks).toEqual(['b']);
  });

  it('app-E14: con algo abierto encima, Esc lo cierra aunque haya algo marcado, y la marca vuelve a quien lo abrió', async () => {
    const clicks = page(`
      <main data-layer><button id="more" data-mark aria-expanded="false">Más</button></main>
      <section data-layer><button id="inside" data-mark>Adentro</button><button id="close" data-close>×</button></section>`);
    const section = document.querySelector('section') as HTMLElement;
    section.style.display = 'none';
    document.querySelector('#close')?.addEventListener('click', () => {
      section.style.display = 'none';
    });
    document.querySelector('#more')?.addEventListener('click', () => {
      section.style.display = '';
    });
    press('ArrowDown');
    press('ArrowRight');
    await tick();
    expect(markedId()).toBe('inside');
    press('Escape');
    await tick();
    expect(clicks).toEqual(['more', 'close']);
    expect(markedId()).toBe('more');
  });

  it('← cierra lo que se abrió encima; sin nada encima, mueve la marca', async () => {
    const clicks = page(`
      <main data-layer><button id="a" data-mark>A</button></main>
      <section data-layer><button id="close" data-close data-mark>×</button></section>`);
    press('ArrowDown');
    press('ArrowLeft');
    await tick();
    expect(clicks).toEqual(['close']);
    expect(markedId()).toBeUndefined();
    document.querySelector('section')?.remove();
    press('ArrowLeft');
    expect(markedId()).toBe('a');
  });

  it('Esc cierra lo de encima aunque no haya nada marcado', async () => {
    const clicks = page(`
      <main data-layer><button id="a" data-mark>A</button></main>
      <section data-layer><button id="close" data-close>×</button></section>`);
    press('Escape');
    await tick();
    expect(clicks).toEqual(['close']);
    expect(markedId()).toBeUndefined();
  });

  it('si lo que abrió la capa ya no está, al cerrarla no queda nada marcado', async () => {
    page(`
      <main data-layer><button id="more" data-mark aria-expanded="false">Más</button></main>
      <section data-layer><button id="inside" data-mark data-close>Adentro</button></section>`);
    press('ArrowDown');
    press('ArrowRight');
    await tick();
    document.querySelector('#more')?.remove();
    press('Escape');
    await tick();
    expect(markedId()).toBeUndefined();
  });

  it('avisa cada vez que la marca cambia, para el rótulo del menú', () => {
    page('<button id="a" data-mark>A</button>');
    const seen: (string | undefined)[] = [];
    const listener = (event: Event) =>
      seen.push((event as CustomEvent<HTMLElement | undefined>).detail?.id);
    document.addEventListener('mark', listener);
    press('ArrowDown');
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('mousemove'));
    document.removeEventListener('mark', listener);
    expect(seen).toEqual(['a', undefined]);
  });

  it('app-E11 con algo encima: Alt muestra solo las teclas de la capa de arriba', () => {
    page('<main data-layer></main><section data-layer></section>');
    press('Alt');
    expect(document.querySelector('section')?.classList.contains('show-keys')).toBe(true);
    expect(document.querySelector('main')?.classList.contains('show-keys')).toBe(false);
    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Alt' }));
    expect(document.querySelector('.show-keys')).toBeNull();
  });

  it('app-E15: el mouse saca la marca; sin nada marcable las flechas no hacen nada', () => {
    page('<button id="x" data-mark>X</button>');
    press('ArrowDown');
    expect(markedId()).toBe('x');
    window.dispatchEvent(new Event('mousemove'));
    expect(markedId()).toBeUndefined();
    page('<p>nada</p>');
    press('ArrowDown');
    press('Escape');
    press('Tab');
  });

  it('app-E07 y E08: en una caja con texto, ← y → mueven el cursor salvo en el principio o el final', () => {
    page('<input id="search" value="tornillo" /><button id="a" data-mark>A</button>');
    const input = document.querySelector('input') as HTMLInputElement;
    input.setSelectionRange(3, 3);
    press('ArrowRight', {}, input);
    press('ArrowLeft', {}, input);
    expect(markedId()).toBeUndefined();
    input.setSelectionRange(8, 8);
    press('ArrowRight', {}, input);
    expect(markedId()).toBe('a');
    input.setSelectionRange(0, 0);
    press('ArrowDown', {}, input);
    press('ArrowLeft', {}, input);
    expect(markedId()).toBe('a');
  });
});

describe('en el celular', () => {
  it('app-E17: no hay atajos ni marca', () => {
    vi.stubGlobal('navigator', { userAgent: 'Android', userAgentData: { mobile: true } });
    const stop = startKeyboard();
    press('Alt');
    expect(document.body.classList.contains('show-keys')).toBe(false);
    stop();
    vi.unstubAllGlobals();
  });
});
