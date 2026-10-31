// El lector del manual (diseño del manual, § 2): lo que frena el armado en un capítulo, sus tareas,
// sus destinos y sus medios.
import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildManual, maxBytes } from './build.ts';
import {
  base,
  build,
  chapter,
  icons,
  list,
  manual,
  problemsOf,
  readme,
  scene,
  webm,
  webp,
} from './manual-test-kit.ts';

describe('buildManual, lo que frena', () => {
  it('frena con un capítulo fuera de la lista, uno que no existe o un título distinto', () => {
    expect(problemsOf({ 'extra.md': '# Extra\n' })).toEqual([
      'docs/manual/extra.md: no está en la lista de README.md',
    ]);
    expect(
      build({ ...base(), 'README.md': readme('- sales · Vender · shopping-cart · sales.md') })
        .problems,
    ).toContain('docs/manual/sales.md: no existe o no es un archivo común');
    expect(problemsOf({ 'sign-in.md': chapter.replace('# Entrar', '# Ingresar') })).toEqual([
      'docs/manual/sign-in.md:1: el título tiene que ser «Entrar», como en la lista',
    ]);
  });

  it('frena con renglones del capítulo que no tienen la forma', () => {
    const broken = [
      'Entrar',
      '- Tablet: no existe.',
      '1. Paso sin tarea.',
      '> Consejo sin tarea.',
      '   Ícono: log-in',
      '## Tarea',
      'texto suelto',
      '1. Uno.',
      '   Captura: sin-punto',
      '3. Tres.',
      '- Id: tarde',
      '2. <b>Dos</b>.',
      '4. Tres &amp; más.',
      '   Captura: escena · punto · rótulo · de más',
      '5.  ',
    ].join('\n');
    expect(problemsOf({ 'sign-in.md': broken })).toEqual(
      expect.arrayContaining([
        'docs/manual/sign-in.md:1: el capítulo empieza con «# <nombre>»',
        'docs/manual/sign-in.md:2: la introducción es «- Computadora: …» o «- Celular: …»',
        'docs/manual/sign-in.md:3: esto va dentro de una tarea («## …»)',
        'docs/manual/sign-in.md:4: esto va dentro de una tarea («## …»)',
        'docs/manual/sign-in.md:5: «Ícono» va debajo de un paso',
        'docs/manual/sign-in.md:7: renglón que no tiene la forma del manual',
        'docs/manual/sign-in.md:9: la captura es «escena · punto · rótulo»',
        'docs/manual/sign-in.md:10: este paso tendría que ser el 2',
        'docs/manual/sign-in.md:11: las claves van antes de los pasos',
        'docs/manual/sign-in.md:12: este paso tendría que ser el 3',
        'docs/manual/sign-in.md:12: el texto no puede tener < ni >',
        'docs/manual/sign-in.md:13: el texto no puede tener entidades de HTML (&…;)',
        'docs/manual/sign-in.md:14: la captura es «escena · punto · rótulo»',
        'docs/manual/sign-in.md:15: el texto está vacío',
        'docs/manual/sign-in.md:6: a la tarea le falta Id, Dispositivo, Ícono',
        'docs/manual/sign-in.md:1: falta la introducción de Computadora',
      ]),
    );
  });

  it('frena con claves de la tarea que no cierran', () => {
    const task = (keys: string, steps = '1. Uno.') =>
      `# Entrar\n\n- Computadora: a.\n- Celular: b.\n\n## T\n\n${keys}\n\n${steps}\n`;
    const keys = (extra: string) =>
      `- Id: google\n- Dispositivo: computadora\n- Ícono: log-in\n${extra}`;
    const check = (text: string) => build({ ...base(), 'sign-in.md': text }).problems;
    expect(
      check(
        task(
          '- Id: Google\n- Dispositivo: tablet\n- Ícono: nada\n- Marca: sin barra\n- Color: rojo\n- Id: otra',
          '',
        ),
      ),
    ).toEqual(
      expect.arrayContaining([
        'docs/manual/sign-in.md:12: clave desconocida: «Color»',
        'docs/manual/sign-in.md:13: la clave «Id» está dos veces',
        'docs/manual/sign-in.md:6: la tarea no tiene pasos',
        'docs/manual/sign-in.md:6: el título de la tarea es una pregunta: «¿…?»',
        'docs/manual/sign-in.md:8: el id va en inglés, con guiones',
        'docs/manual/sign-in.md:9: el dispositivo es «computadora» o «celular»',
        'docs/manual/sign-in.md:11: la marca es «entera / corta»',
        'docs/manual/sign-in.md:10: el ícono «nada» no está en el manual',
      ]),
    );
    expect(
      check(
        task(
          keys('- Clip: otro'),
          '1. Uno.\n   Ícono: nada\n2. Dos.\n   Captura: otra · qr · X\n3. Tres.\n   Captura: desktop-entrance · nada · X',
        ),
      ),
    ).toEqual(
      expect.arrayContaining([
        'docs/manual/sign-in.md:11: no existe el clip «otro»',
        'docs/manual/sign-in.md:14: un paso lleva su captura, no un ícono',
        'docs/manual/sign-in.md:13: el paso no tiene captura',
        'docs/manual/sign-in.md:16: no existe la escena «otra»',
        'docs/manual/sign-in.md:18: no existe el punto «nada» en «desktop-entrance»',
      ]),
    );
    const twice = `${chapter}\n## Otra vez\n\n- Id: google\n- Dispositivo: computadora\n- Ícono: log-in\n\n1. Uno.\n`;
    expect(check(twice)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^docs\/manual\/sign-in\.md:\d+: el id «google» se repite en ese dispositivo$/,
        ),
      ]),
    );
  });

  it('frena con un destino que no existe, de otro dispositivo o dos del mismo', () => {
    const goTo = (target: string) =>
      problemsOf({
        'README.md': readme(
          `- sign-in · Entrar · log-in · sign-in.md\n- offline · Sin conexión · wifi-off · ${target}`,
        ),
      });
    expect(goTo('→ sales: google (computadora)')).toEqual([
      'docs/manual/README.md:6: «sales» no es un capítulo escrito',
    ]);
    expect(goTo('→ sign-in: nada (computadora), finger (computadora)')).toEqual([
      'docs/manual/README.md:6: no existe la tarea «nada» de Computadora en «sign-in»',
      'docs/manual/README.md:6: no existe la tarea «finger» de Computadora en «sign-in»',
      'docs/manual/README.md:6: lleva a dos tareas de Computadora',
    ]);
    expect(goTo('→ sign-in: google (tablet)')).toEqual([
      'docs/manual/README.md:6: al final va «offline.md» o «→ <capítulo>: <tarea> (<dispositivo>), …»',
    ]);
  });

  it('frena con medios que no van: nombre, tipo, contenido, tope, enlace, escena rota o sin usar', () => {
    const dir = manual({
      ...base(),
      'media/Mal.webp': webp(),
      'media/foto.png': webp(),
      'media/disfrazado.webp': Buffer.from('<html>no es una imagen</html>'),
      'media/pesada.webp': webp(91 * 1024),
      'media/rota.json': '{"device":"tablet"}',
      'media/no-json.json': '{ esto no es json }',
      'media/sin-captura.json': scene('phone'),
      'media/sola.webp': webp(),
      'media/clip-sin-cuadro.webm': webm(),
      'media/fuera-de-rango.json': scene('computer', { qr: [101, 0] }),
    });
    symlinkSync(join(dir, 'README.md'), join(dir, 'media', 'enlace.webp'));
    mkdirSync(join(dir, 'media', 'carpeta.webp'));
    expect(buildManual(dir, 'v1', icons).problems.sort()).toEqual(
      [
        'docs/manual/media/Mal.webp: nombre o tipo que no va',
        'docs/manual/media/foto.png: nombre o tipo que no va',
        'docs/manual/media/disfrazado.webp: su contenido no es lo que dice su nombre',
        'docs/manual/media/pesada.webp: pesa 92 KB (tope 90 KB)',
        'docs/manual/media/rota.json: la escena no tiene la forma esperada',
        'docs/manual/media/no-json.json: la escena no tiene la forma esperada',
        'docs/manual/media/fuera-de-rango.json: la escena no tiene la forma esperada',
        'docs/manual/media/sin-captura.json: falta su captura sin-captura.webp',
        'docs/manual/media/clip-sin-cuadro.webm: falta su último cuadro clip-sin-cuadro.end.webp',
        'docs/manual/media/enlace.webp: no es un archivo común',
        'docs/manual/media/carpeta.webp: no es un archivo común',
        'docs/manual/media/sola.webp: nadie lo usa',
        'docs/manual/media/clip-sin-cuadro.webm: nadie lo usa',
      ].sort(),
    );
  });

  it('frena con una captura con metadatos, una que no es la del programa o media/ como enlace', () => {
    const exif = Buffer.concat([
      Buffer.from('RIFF0000WEBP'),
      Buffer.from('EXIF'),
      Buffer.from([4, 0, 0, 0]),
      Buffer.from('GPS!'),
    ]);
    expect(problemsOf({ 'media/desktop-entrance.webp': exif })).toEqual([
      'docs/manual/media/desktop-entrance.webp: lleva metadatos (EXIF o XMP): sacala con pnpm manual:media',
      'docs/manual/media/desktop-entrance.json: falta su captura desktop-entrance.webp',
    ]);
    expect(problemsOf({ 'media/desktop-entrance.webp': webp(22) })).toEqual([
      'docs/manual/media/desktop-entrance.webp: no es la que sacó el programa: sacala con pnpm manual:media',
    ]);
    const { media: _, ...rest } = base();
    const other = manual(base());
    const dir = manual(rest);
    rmSync(join(dir, 'media'), { recursive: true, force: true });
    symlinkSync(join(other, 'media'), join(dir, 'media'));
    expect(buildManual(dir, 'v1', icons).problems).toContain(
      'docs/manual/media: la carpeta del manual o la de medios es un enlace',
    );
  });

  it('el nombre de un capítulo es solo texto, y el archivo es siempre <id>.md', () => {
    const named = (line: string) =>
      problemsOf({
        'README.md': readme(list.replace('- sign-in · Entrar · log-in · sign-in.md', line)),
      });
    expect(named('- sign-in · Entrar <b>ya</b> · log-in · sign-in.md')).toContain(
      'docs/manual/README.md:5: el texto no puede tener < ni >',
    );
    expect(named('- sign-in · Entrar·ya · log-in · sign-in.md')).toContain(
      'docs/manual/README.md:5: el nombre no puede tener «·»',
    );
    expect(named('- sign-in · Entrar &amp; salir · log-in · sign-in.md')).toContain(
      'docs/manual/README.md:5: el texto no puede tener entidades de HTML (&…;)',
    );
    for (const file of ['../../.env', '/etc/passwd'])
      expect(named(`- sign-in · Entrar · log-in · ${file}`)).toContain(
        'docs/manual/README.md:5: al final va «sign-in.md» o «→ <capítulo>: <tarea> (<dispositivo>), …»',
      );
  });

  it('frena con un README.md que es un enlace o un archivo armado pasado de tope', () => {
    const dir = manual({ 'sign-in.md': chapter, 'otro.md': readme(list) });
    symlinkSync(join(dir, 'otro.md'), join(dir, 'README.md'));
    expect(buildManual(dir, 'v1', icons).problems).toEqual([
      'docs/manual/README.md: no existe o no es un archivo común',
    ]);
    const long = 'x'.repeat(maxBytes.chapter);
    expect(problemsOf({ 'sign-in.md': chapter.replace('Poné el dedo.', long) })).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^\/manual\/sign-in\.json: pesa \d+ bytes \(tope 16384\)$/),
      ]),
    );
    rmSync(dir, { recursive: true });
  });
});
