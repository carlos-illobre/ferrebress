// Las reglas de las cajas y los grupos (00 · R2.2, R2.6; ADR-019): la vista marca su HTML y la
// navegación lo hace andar, sin que ninguna vista escuche teclas.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKeyboard } from '../testing.ts';

const press = (target: EventTarget, key: string, extra: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }),
  );
const tick = () => new Promise((resolve) => setTimeout(resolve));
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function page(html: string) {
  document.body.innerHTML = html;
  const clicks: string[] = [];
  for (const button of document.querySelectorAll<HTMLElement>('button, [role]'))
    button.addEventListener('click', () => clicks.push(button.id));
  return clicks;
}

describe('las cajas y los grupos', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('app-R2.6: Enter en una caja toca lo de data-default, o deja la caja si es data-commit', () => {
    const clicks = page(`<div data-layer>
      <input id="search" /><input id="margin" data-commit />
      <button id="off" data-default disabled>No</button><button id="first" data-default>Abrir</button>
    </div>`);
    press(byId('search'), 'Enter');
    expect(clicks).toEqual(['first']);
    const margin = byId<HTMLInputElement>('margin');
    margin.focus();
    press(margin, 'Enter');
    expect(document.activeElement).not.toBe(margin);
    // En un área de texto, Enter es un renglón nuevo; en una casilla, no hay nada que hacer.
    page('<div data-layer><textarea id="t"></textarea><input id="c" type="checkbox" /></div>');
    press(byId('t'), 'Enter');
    press(byId('c'), 'Enter');
  });

  it('app-R2.6: sin data-default, Enter en una caja no hace nada', () => {
    const clicks = page('<div data-layer><input id="box" /><button id="b">B</button></div>');
    press(byId('box'), 'Enter');
    expect(clicks).toEqual([]);
  });

  it('Enter en la caja de un formulario lo manda, salvo con su botón apagado; Esc toca su data-close', () => {
    const clicks = page(`<div data-layer><form id="f"><input id="name" />
      <button id="save" type="submit">Listo</button><button id="cancel" type="button" data-close>No</button>
    </form></div>`);
    const sent: string[] = [];
    byId('f').addEventListener('submit', (event) => {
      event.preventDefault();
      sent.push('sent');
    });
    press(byId('name'), 'Enter');
    expect(sent).toEqual(['sent']);
    byId<HTMLButtonElement>('save').disabled = true;
    press(byId('name'), 'Enter');
    expect(sent).toEqual(['sent']);
    press(byId('name'), 'Escape');
    expect(clicks).toEqual(['cancel']);
  });

  it('Esc en una caja de un formulario sin data-close, o fuera de un formulario, sigue como siempre', () => {
    const clicks = page(`<div data-layer><form><input id="a" /></form><input id="b" /></div>
      <section data-layer><button id="close" data-close>Cerrar</button></section>`);
    press(byId('a'), 'Escape');
    expect(clicks).toEqual(['close']);
  });

  it('R1.8: ← y → llevan el cursor por un grupo data-roving, salteando las apagadas', () => {
    page(`<div data-layer><fieldset data-roving>
      <button id="a">A</button><button id="b" disabled>B</button><button id="c">C</button>
    </fieldset><button id="out">Fuera</button></div>`);
    byId('a').focus();
    press(byId('a'), 'ArrowRight');
    expect(document.activeElement?.id).toBe('c');
    press(byId('c'), 'ArrowRight');
    expect(document.activeElement?.id).toBe('c');
    press(byId('c'), 'ArrowLeft');
    expect(document.activeElement?.id).toBe('a');
    // Fuera del grupo, las flechas son las de siempre.
    press(byId('out'), 'ArrowRight');
  });

  it('Espacio elige un renglón con role=option, row o gridcell; en lo demás no hace nada', () => {
    const clicks = page(`<div data-layer><div id="row" role="option" tabindex="-1">Uno</div>
      <div id="plain" tabindex="-1">Dos</div></div>`);
    press(byId('row'), ' ');
    press(byId('plain'), ' ');
    press(window, ' ');
    expect(clicks).toEqual(['row']);
  });

  it('app-R2.2: el cursor va a la caja data-autofocus cuando aparece, una sola vez, si no está en otra caja', async () => {
    page('<div data-layer id="layer"></div>');
    byId('layer').insertAdjacentHTML('beforeend', '<input id="main" data-autofocus />');
    await tick();
    expect(document.activeElement?.id).toBe('main');
    byId('layer').insertAdjacentHTML('beforeend', '<input id="other" data-autofocus />');
    await tick();
    expect(document.activeElement?.id).toBe('main');
  });

  it('con el cursor en una casilla de una región data-letters, su número la toca', () => {
    page(`<div data-layer><fieldset data-letters>
      <input id="one" type="checkbox" data-key="1" /></fieldset></div>`);
    const one = byId<HTMLInputElement>('one');
    press(one, '1', { code: 'Digit1' });
    expect(one.checked).toBe(true);
  });
});
