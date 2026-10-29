// Las marcas del teclado para pantallas que recorren pasos (diseño del manual, § 5): ← y → tocan
// «anterior» y «siguiente» de la capa, `/` lleva a la caja de buscar y Esc la vacía antes de cerrar.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKeyboard } from './keyboard.ts';

const press = (key: string, target: EventTarget = window) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

function page(html: string) {
  document.body.innerHTML = html;
  const clicks: string[] = [];
  for (const button of document.querySelectorAll('button'))
    button.addEventListener('click', () => clicks.push(button.id));
  return clicks;
}

const layer = `<section data-layer data-arrows>
  <input id="search" data-slash data-clear>
  <button id="previous" data-arrow="previous">Anterior</button>
  <button id="next" data-arrow="next">Siguiente</button>
  <button id="close" data-close>×</button>
</section>`;

describe('las capas que recorren pasos', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('← y → tocan anterior y siguiente, en vez de cerrar la capa o mover la marca', () => {
    const clicks = page(`<main data-layer><button data-mark>Fondo</button></main>${layer}`);
    press('ArrowRight');
    press('ArrowLeft');
    expect(clicks).toEqual(['next', 'previous']);
  });

  it('con texto en la caja, ← y → son del cursor; con la caja vacía, pasan de paso', () => {
    const clicks = page(layer);
    const search = document.getElementById('search') as HTMLInputElement;
    search.value = 'huella';
    search.setSelectionRange(6, 6);
    press('ArrowLeft', search);
    search.value = '';
    press('ArrowRight', search);
    expect(clicks).toEqual(['next']);
  });

  it('/ lleva el cursor a la caja de buscar, salvo que ya se esté escribiendo', () => {
    page(layer);
    const search = document.getElementById('search') as HTMLInputElement;
    expect(press('/')).toBe(false);
    expect(document.activeElement).toBe(search);
    expect(press('/', search)).toBe(true);
  });

  it('Esc vacía la caja si tiene texto; vacía, cierra lo de encima', () => {
    const clicks = page(`<main data-layer></main>${layer}`);
    const search = document.getElementById('search') as HTMLInputElement;
    const typed: string[] = [];
    search.addEventListener('input', () => typed.push(search.value));
    search.value = 'huella';
    press('Escape', search);
    expect(search.value).toBe('');
    expect(typed).toEqual(['']);
    expect(clicks).toEqual([]);
    press('Escape', search);
    expect(clicks).toEqual(['close']);
  });

  it('sin data-arrows, / y Esc siguen como siempre', () => {
    const clicks = page(
      '<main data-layer><input id="box"><button id="close" data-close>×</button></main>',
    );
    expect(press('/')).toBe(true);
    press('Escape');
    expect(clicks).toEqual([]);
  });
});
