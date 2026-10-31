// El lector del manual (diseño del manual, §§ 2 y 10): lo que arma con un manual de prueba, y lo que
// frena en la lista de capítulos.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, expect, it } from 'vitest';
import { manualIcons } from '../../src/app/modules/manual/icons.ts';
import type { Chapter, ManualIndex, SearchTask } from '../../src/shared/contracts/manual.ts';
import { base, build, chapter, json, problemsOf, readme } from './manual-test-kit.ts';
import { serveManual } from './serve.ts';

describe('buildManual', () => {
  it('arma el índice en el orden de la lista, el capítulo, el buscador y los medios usados', () => {
    const { files, problems } = build(base());
    expect(problems).toEqual([]);
    expect([...files.keys()].sort()).toEqual([
      'index.json',
      'media/desktop-entrance.webp',
      'media/phone-entrance.webp',
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
        { text: 'Elegí tu cuenta.', icon: 'log-in', capture: { scene: 'desktop-entrance' } },
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

  it('frena un paso sin captura: cada paso muestra la pantalla de la aplicación', () => {
    const plain = chapter.replace(/ {3}Captura: .*\n/, '');
    expect(build({ ...base(), 'sign-in.md': plain }).problems).toEqual([
      'docs/manual/sign-in.md:15: el paso no tiene captura',
    ]);
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
      'docs/manual/README.md:8: al final va «sign-in.md» o «→ <capítulo>: <tarea> (<dispositivo>), …»',
      'docs/manual/README.md:9: el capítulo «sign-in» está dos veces',
      'docs/manual/README.md:11: al final va «y.md» o «→ <capítulo>: <tarea> (<dispositivo>), …»',
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

describe('el manual en el servidor de desarrollo', () => {
  const files = () => new Map([['index.json', Buffer.from('{}')]]);
  const ask = (url: string) => {
    const response = {
      statusCode: 0,
      headers: {} as Record<string, string>,
      body: undefined as unknown,
    };
    let passed = false;
    serveManual(files)(
      { url } as IncomingMessage,
      {
        setHeader: (name: string, value: string) => {
          response.headers[name] = value;
        },
        end: (body: unknown) => {
          response.body = body;
        },
        set statusCode(code: number) {
          response.statusCode = code;
        },
      } as unknown as ServerResponse,
      () => {
        passed = true;
      },
    );
    return { ...response, passed };
  };

  it('da lo armado por nombre, sin guardarse; la página /manual sigue de largo', () => {
    expect(ask('/manual/index.json?x=1')).toMatchObject({
      statusCode: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
    expect(ask('/manual').passed).toBe(true);
    expect(ask('/manual?d=phone').passed).toBe(true);
    expect(serveManual(files)({} as IncomingMessage, {} as ServerResponse, () => undefined)).toBe(
      undefined,
    );
  });

  it('nada fuera de lo armado: ni .. ni %2e%2e', () => {
    for (const url of [
      '/manual/../.env',
      '/manual/%2e%2e/package.json',
      '/manual/..%2f..%2fpackage.json',
    ])
      expect(ask(url)).toMatchObject({ statusCode: 404, passed: false });
  });
});
