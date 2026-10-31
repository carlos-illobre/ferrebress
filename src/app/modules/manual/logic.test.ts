import type { SearchTask } from '@ferrebress/shared/contracts/manual';
import { describe, expect, it } from 'vitest';
import { index } from './manual-test-kit.tsx';
import { readAddress, validAddress, writeAddress } from './place/address.ts';
import { marks, normalize, searchManual } from './search.ts';
import { firstTask, reduce, startState, tasksOf } from './state.ts';

const tasks: SearchTask[] = [
  {
    chapter: 'sign-in',
    task: 'phone',
    title: 'Entrar con el celular',
    note: 'No escribís nada.',
    texts: [
      'Mirá el código.',
      'Tocá «Escanear».',
      'Poné la huella.',
      'El código cambia.',
      'Mismo Wi-Fi.',
    ],
  },
  {
    chapter: 'sign-in',
    task: 'google',
    title: 'Entrar con Google',
    texts: ['Elegí tu cuenta.', 'Listo.'],
  },
];

describe('la dirección del manual', () => {
  it('lee solo lo que tiene forma: dispositivo conocido y paso desde 1', () => {
    expect(readAddress('?d=phone&c=sign-in&t=offline&p=2')).toEqual({
      device: 'phone',
      chapter: 'sign-in',
      task: 'offline',
      step: 1,
    });
    expect(readAddress('?d=tablet&p=0')).toEqual({});
    expect(readAddress('?p=uno')).toEqual({});
  });

  it('acepta solo lo que existe en el índice para ese dispositivo; lo demás se ignora', () => {
    expect(
      validAddress({ chapter: 'sign-in', task: 'google', step: 9 }, index, 'computer'),
    ).toEqual({
      device: 'computer',
      chapter: 'sign-in',
      task: 'google',
      step: 1,
    });
    expect(validAddress({ chapter: 'sign-in', task: 'google' }, index, 'phone')).toEqual({});
    expect(validAddress({ chapter: 'sign-in', task: 'google' }, index, 'computer').step).toBe(0);
    expect(validAddress({ chapter: '../api/start', task: 'x' }, index, 'computer')).toEqual({});
    expect(validAddress({ chapter: 'sales', task: 'x' }, index, 'computer')).toEqual({});
  });

  it('escribe la dirección con el paso desde 1', () => {
    expect(writeAddress({})).toBe('/manual');
    expect(writeAddress({ device: 'phone', chapter: 'sign-in', task: 'offline', step: 0 })).toBe(
      '/manual?d=phone&c=sign-in&t=offline&p=1',
    );
  });
});

describe('el buscador', () => {
  it('sin tildes ni mayúsculas, letra por letra', () => {
    expect(normalize('Tocá «ÉSCANEAR»')).toBe('toca «escanear»');
    // Una tilde suelta (escrita aparte de su letra) no ocupa lugar.
    expect(normalize('a\u0301b')).toBe('ab');
  });

  it('app-E36: desde dos letras, con todas las palabras, una fila por tarea y al paso que coincidió', () => {
    expect(searchManual('h', index, tasks)).toBeUndefined();
    const found = searchManual('huella', index, tasks);
    expect(found?.groups).toEqual([
      {
        chapter: index.chapters[0],
        hits: [
          {
            chapter: 'sign-in',
            task: 'phone',
            title: 'Entrar con el celular',
            snippet: 'Poné la huella.',
            step: 2,
          },
        ],
      },
    ]);
    expect(searchManual('codigo cambia', index, tasks)?.groups[0]?.hits[0]).toMatchObject({
      snippet: 'El código cambia.',
      step: 0,
    });
    expect(searchManual('mismo wi', index, tasks)?.groups[0]?.hits[0]?.step).toBe(1);
    expect(searchManual('escribis', index, tasks)?.groups[0]?.hits[0]).toMatchObject({
      snippet: 'No escribís nada.',
      step: 0,
    });
  });

  it('lo que escribe cualquiera no rompe nada: sin expresiones regulares y cortado en 60 letras', () => {
    const hostile = ['(a+)+$', '[', '\\', '.*', 'a'.repeat(10_000)];
    const started = performance.now();
    for (const query of hostile) {
      expect(() => searchManual(query, index, tasks)).not.toThrow();
      expect(
        marks('Poné la huella.', query)
          .map((piece) => piece.text)
          .join(''),
      ).toBe('Poné la huella.');
    }
    expect(performance.now() - started).toBeLessThan(50);
    expect(searchManual(`huella${' '.repeat(60)}xyz`, index, tasks)?.groups).toHaveLength(1);
  });

  it('lo que coincide con el título va primero; si solo coincide el título, muestra la aclaración o el primer paso', () => {
    const found = searchManual('entrar', index, tasks);
    expect(found?.groups[0]?.hits.map((hit) => [hit.task, hit.snippet])).toEqual([
      ['phone', 'No escribís nada.'],
      ['google', 'Elegí tu cuenta.'],
    ]);
    const cuenta = searchManual('google cuenta', index, tasks);
    expect(cuenta?.groups[0]?.hits[0]?.snippet).toBe('Elegí tu cuenta.');
    expect(searchManual('celular nada', index, tasks)?.groups[0]?.hits[0]?.snippet).toBe(
      'No escribís nada.',
    );
  });

  it('con dos tareas, la que coincide en el título va primero', () => {
    expect(searchManual('el', index, tasks)?.groups[0]?.hits.map((hit) => hit.task)).toEqual([
      'phone',
      'google',
    ]);
  });

  it('una tarea del buscador que el índice ya no tiene (una versión vieja) lleva al primer paso', () => {
    const old = [{ chapter: 'sign-in', task: 'vieja', title: 'Vieja', texts: ['Algo viejo.'] }];
    expect(searchManual('viejo', index, old)?.groups[0]?.hits[0]?.step).toBe(0);
  });

  it('los capítulos que faltan cuyo nombre coincide, también en producción; nada, sin grupos', () => {
    expect(searchManual('vender', index, tasks)).toEqual({
      groups: [],
      soon: [index.chapters[1]],
    });
    expect(searchManual('nada parecido', index, tasks)).toEqual({ groups: [], soon: [] });
  });

  it('marca lo buscado en el texto original, con sus tildes', () => {
    expect(marks('Tocá «Escanear código»', 'toca codigo')).toEqual([
      { text: 'Tocá', marked: true },
      { text: ' «Escanear ', marked: false },
      { text: 'código', marked: true },
      { text: '»', marked: false },
    ]);
  });
});

describe('el estado del manual', () => {
  const start = startState(index, 'computer', true);

  it('arranca en la primera tarea del dispositivo; sin tareas, en ninguna', () => {
    expect(start).toMatchObject({ device: 'computer', chapter: 'sign-in', task: 'phone', step: 0 });
    expect(firstTask({ version: 'v', chapters: [] }, 'phone')).toBeUndefined();
    expect(tasksOf(index, 'nada', 'computer')).toEqual([]);
    const [signIn, , stock] = index.chapters;
    expect(
      firstTask({ version: 'v', chapters: [stock, signIn] as typeof index.chapters }, 'phone'),
    ).toEqual({
      chapter: 'sign-in',
      task: 'offline',
    });
    expect(tasksOf(index, 'sales', 'computer')).toEqual([]);
  });

  it('pasa de paso y de tarea, y vuelve a la anterior en su último paso', () => {
    const second = reduce(start, { type: 'next' }, index);
    expect(second).toMatchObject({ step: 1, direction: 1 });
    const google = reduce(reduce(second, { type: 'next' }, index), { type: 'next' }, index);
    expect(google).toMatchObject({ task: 'google', step: 0, sheet: true });
    expect(reduce(google, { type: 'previous' }, index)).toMatchObject({ task: 'phone', step: 2 });
    expect(reduce(start, { type: 'previous' }, index)).toBe(start);
  });

  it('después de la última tarea, en el celular cierra la hoja', () => {
    const last = reduce(
      start,
      { type: 'openTask', chapter: 'sign-in', task: 'google', step: 1 },
      index,
    );
    expect(reduce(last, { type: 'next' }, index)).toMatchObject({ sheet: false, task: 'google' });
  });

  it('elegir otro dispositivo vuelve al principio de ese manual', () => {
    const phone = reduce(
      { ...start, allSteps: true },
      { type: 'chooseDevice', device: 'phone', first: true },
      index,
    );
    expect(phone).toMatchObject({ device: 'phone', task: 'offline', step: 0, allSteps: false });
  });

  it('abrir una tarea que no es del dispositivo no hace nada; sin tarea, pasar tampoco', () => {
    expect(reduce(start, { type: 'openTask', chapter: 'sign-in', task: 'offline' }, index)).toBe(
      start,
    );
    const none = { ...start, task: 'nada' };
    expect(reduce(none, { type: 'next' }, index)).toBe(none);
  });

  it('el paso elegido, el clip, «Todos los pasos» y la hoja', () => {
    expect(reduce(start, { type: 'goToStep', step: 2 }, index)).toMatchObject({
      step: 2,
      direction: 1,
    });
    const back = reduce({ ...start, step: 2 }, { type: 'goToStep', step: 0 }, index);
    expect(back.direction).toBe(-1);
    expect(reduce(start, { type: 'playClip' }, index).clip).toBe(true);
    const all = reduce(start, { type: 'openAllSteps' }, index);
    expect(all).toMatchObject({ allSteps: true, allFrom: 'phone' });
    const fromList = reduce(all, { type: 'openAllSteps', chapter: 'sign-in' }, index);
    expect(fromList.allFrom).toBeUndefined();
    // Desde la lista, de otro capítulo: el paso a paso queda en la primera tarea de ese capítulo.
    const other = reduce({ ...start, step: 2 }, { type: 'openAllSteps', chapter: 'stock' }, index);
    expect(other).toMatchObject({ chapter: 'stock', task: 'count', step: 0, allSteps: true });
    const { task: _, ...noTask } = start;
    expect(reduce(noTask, { type: 'openAllSteps' }, index)).toBe(noTask);
    expect(reduce(all, { type: 'closeAllSteps' }, index).allSteps).toBe(false);
    expect(reduce({ ...all, sheet: true }, { type: 'closeSheet' }, index)).toMatchObject({
      sheet: false,
      allSteps: false,
    });
  });
});
