// Lo que comparten las pruebas del lector del manual: un manual de prueba con su capítulo, sus
// medios mínimos (con los primeros bytes de cada tipo) y cómo armarlo.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildManual } from './build.ts';
import { sha256 } from './media.ts';

export const icons = new Set(['log-in', 'shopping-cart', 'wifi-off', 'fingerprint', 'qr-code']);
export const webp = (size = 20) => Buffer.concat([Buffer.from('RIFF0000WEBP'), Buffer.alloc(size)]);
export const webm = () => Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(20)]);
export const scene = (
  device = 'computer',
  points: unknown = { qr: [67, 33], google: [78, 58.5] },
) =>
  JSON.stringify({ device, width: 1100, height: 619, points, hash: 'abc', file: sha256(webp()) });

export const readme = (lines: string) => `# El manual\n\n## Los capítulos, en orden\n\n${lines}\n`;
export const list = [
  '- sign-in · Entrar · log-in · sign-in.md',
  '- sales · Vender · shopping-cart',
  '- offline · Trabajar sin conexión · wifi-off · → sign-in: google (computadora), finger (celular)',
].join('\n');

export const chapter = `# Entrar

- Computadora: Entrás con el celular.
- Celular: Entrás con la huella.

## Entrar con Google

- Id: google
- Dispositivo: computadora
- Ícono: log-in
- Marca: La forma más rápida / La más rápida
- Clip: phone-to-computer
- Aclaración: Si no tenés el celular.

1. Tocá «Continuar con Google».
   Captura: desktop-entrance · google · Continuar con Google
2. Elegí tu cuenta.
   Captura: desktop-entrance · qr · El código

> Solo entran las cuentas autorizadas.

## Entrar con la huella

- Id: finger
- Dispositivo: celular
- Ícono: fingerprint

1. Poné el dedo.
   Captura: phone-entrance · finger · Ingresar con huella
`;

export type Files = Record<string, string | Buffer>;

export const base = (): Files => ({
  'README.md': readme(list),
  'sign-in.md': chapter,
  'media/desktop-entrance.webp': webp(),
  'media/desktop-entrance.json': scene(),
  'media/phone-entrance.webp': webp(),
  'media/phone-entrance.json': scene('phone', { finger: [50, 60] }),
  'media/phone-to-computer.webm': webm(),
  'media/phone-to-computer.end.webp': webp(),
});

export function manual(files: Files): string {
  const dir = mkdtempSync(join(tmpdir(), 'ferrebress-manual-'));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(join(dir, dirname(path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

export const build = (files: Files) => buildManual(manual(files), 'v1', icons);
export const json = <T>(files: Map<string, Buffer>, name: string) =>
  JSON.parse((files.get(name) as Buffer).toString()) as T;
export const problemsOf = (changes: Files) => build({ ...base(), ...changes }).problems;
