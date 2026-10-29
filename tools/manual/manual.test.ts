// El lector del manual (diseño del manual, §§ 2 y 10): lo que arma con un manual de prueba, y lo que
// frena en la lista de capítulos.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { manualIcons } from '../../src/app/modules/manual/icons.ts';
import type { Chapter, ManualIndex, SearchTask } from '../../src/shared/contracts/manual.ts';
import {
  base,
  build,
  chapter,
  json,
  list,
  manual,
  problemsOf,
  readme,
  scene,
  webm,
  webp,
} from './manual-test-kit.ts';

describe('buildManual', () => {
  it('arma el índice en el orden de la lista, el capítulo, el buscador y los medios usados', () => {
    const { files, problems } = build(base());
    expect(problems).toEqual([]);
    expect([...files.keys()].sort()).toEqual([
      'index.json',
      'media/desktop-entrance.webp',
      'media/phone-to-computer.end.webp',
      'media/phone-to-computer.webm',
      'search-computer.json',
      'search-phone.json',
      'sign-in.json',
    ]);
    const index = json<ManualIndex>(files, 'index.json');
    expect(index.version).toBe('v1');
    expect(index.chapters.map((entry) => entry.id)).toEqual(['sign-in', 'sales', 'offline']);
    expect(index.chapters[0]?.tasks).toEqual([
      {
        id: 'google',
        device: 'computer',
        title: 'Entrar con Google',
        icon: 'log-in',
        tag: { long: 'La forma más rápida', short: 'La más rápida' },
        clip: 'phone-to-computer',
        steps: 2,
      },
      {
        id: 'finger',
        device: 'phone',
        title: 'Entrar con la huella',
        icon: 'fingerprint',
        steps: 1,
      },
    ]);
    expect(index.chapters[1]).toEqual({ id: 'sales', name: 'Vender', icon: 'shopping-cart' });
    expect(index.chapters[2]?.goesTo).toEqual({
      chapter: 'sign-in',
      tasks: { computer: 'google', phone: 'finger' },
    });
    const signIn = json<Chapter>(files, 'sign-in.json');
    expect(signIn.intro).toEqual({
      computer: 'Entrás con el celular.',
      phone: 'Entrás con la huella.',
    });
    expect(signIn.tasks[0]).toMatchObject({
      note: 'Si no tenés el celular.',
      clip: 'phone-to-computer',
      tips: ['Solo entran las cuentas autorizadas.'],
      steps: [
        {
          text: 'Tocá «Continuar con Google».',
          icon: 'log-in',
          capture: {
            scene: 'desktop-entrance',
            device: 'computer',
            width: 1100,
            height: 619,
            point: [78, 58.5],
            label: 'Continuar con Google',
          },
        },
        { text: 'Elegí tu cuenta.', icon: 'fingerprint' },
      ],
    });
    expect(json<SearchTask[]>(files, 'search-computer.json')).toEqual([
      {
        chapter: 'sign-in',
        task: 'google',
        title: 'Entrar con Google',
        note: 'Si no tenés el celular.',
        texts: [
          'Tocá «Continuar con Google».',
          'Elegí tu cuenta.',
          'Solo entran las cuentas autorizadas.',
        ],
      },
    ]);
    expect(json<SearchTask[]>(files, 'search-phone.json')).toEqual([
      {
        chapter: 'sign-in',
        task: 'finger',
        title: 'Entrar con la huella',
        texts: ['Poné el dedo.'],
      },
    ]);
  });

  it('sin media/, un capítulo sin capturas igual se arma', () => {
    const plain = chapter
      .replace(/ {3}Captura: .*\n/, '')
      .replace('- Clip: phone-to-computer\n', '');
    expect(build({ 'README.md': readme(list), 'sign-in.md': plain }).problems).toEqual([]);
  });

  it('frena sin README.md, sin la sección de la lista o con un renglón mal escrito', () => {
    expect(build({ 'sign-in.md': chapter }).problems).toEqual([
      'docs/manual/README.md: no existe o no es un archivo común',
    ]);
    expect(problemsOf({ 'README.md': '# El manual\n' })).toContain(
      'docs/manual/README.md:1: falta la sección «## Los capítulos, en orden»',
    );
    const bad = [
      'sign-in · Entrar · log-in · sign-in.md',
      '- Entrar · log-in',
      '- sign-in · Entrar · log-in · otro.md',
      '- sign-in · Entrar · log-in · sign-in.md',
      '- x · X · nada',
      '- y · Y · log-in · → sign-in: Mal',
      '- z · Z · log-in · a · b',
      '## Otra sección',
      '- después · no · cuenta',
    ].join('\n');
    expect(
      problemsOf({ 'README.md': readme(`- sign-in · Entrar · log-in · sign-in.md\n${bad}`) }),
    ).toEqual([
      'docs/manual/README.md:6: cada capítulo va en un renglón «- …»',
      'docs/manual/README.md:7: el renglón tiene que ser «id · nombre · ícono», con el archivo o el destino al final',
      'docs/manual/README.md:8: al final va «sign-in.md» o «→ <capítulo>: <tarea> (<dispositivo>), …», no «otro.md»',
      'docs/manual/README.md:9: el capítulo «sign-in» está dos veces',
      'docs/manual/README.md:11: al final va «y.md» o «→ <capítulo>: <tarea> (<dispositivo>), …», no «→ sign-in: Mal»',
      'docs/manual/README.md:12: el renglón tiene que ser «id · nombre · ícono», con el archivo o el destino al final',
      'docs/manual/README.md:10: el ícono «nada» no está en el manual',
    ]);
  });
});

describe('manualIcons', () => {
  it('cada ícono del manual tiene su dibujo, con las formas de Lucide', () => {
    const tags = ['path', 'circle', 'line', 'polyline', 'polygon', 'rect'];
    for (const shapes of Object.values(manualIcons)) {
      expect(shapes.length).toBeGreaterThan(0);
      for (const [tag] of shapes) expect(tags).toContain(tag);
    }
  });
});
