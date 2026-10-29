// Las capturas y los clips de docs/manual/media/ (diseño del manual, §§ 2 y 3): cada escena es su
// WebP y su JSON con los puntos; cada clip, su WebM y su último cuadro. Solo acepta archivos comunes
// (no enlaces), con nombres comprobados, del tipo que dice su nombre y dentro de su tope.
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Device } from '../../src/shared/contracts/manual.ts';
import { isName, type Problems } from './text.ts';

export type Scene = {
  device: Device;
  width: number;
  height: number;
  points: Record<string, [number, number]>;
  hash: string;
};

export type Media = { scenes: Map<string, Scene>; clips: Set<string>; files: Map<string, Buffer> };

const kb = 1024;
const kinds = [
  { suffix: '.end.webp', max: 90 * kb, magic: isWebp },
  { suffix: '.webp', max: 90 * kb, magic: isWebp },
  {
    suffix: '.webm',
    max: 1536 * kb,
    magic: (bytes: Buffer) => bytes.readUInt32BE(0) === 0x1a45dfa3,
  },
  { suffix: '.json', max: 4 * kb, magic: (bytes: Buffer) => bytes[0] === 0x7b },
];

function isWebp(bytes: Buffer): boolean {
  return bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP';
}

const percent = (value: unknown) => typeof value === 'number' && value >= 0 && value <= 100;
const isPoint = (value: unknown) =>
  Array.isArray(value) && value.length === 2 && value.every(percent);

// El JSON de una escena, comprobado campo por campo.
function sceneOf(bytes: Buffer): Scene | undefined {
  try {
    const scene = JSON.parse(bytes.toString('utf8')) as Scene;
    const sizes = [scene.width, scene.height].every((size) => Number.isInteger(size) && size > 0);
    const points = Object.entries(scene.points ?? {});
    const valid =
      (scene.device === 'computer' || scene.device === 'phone') &&
      sizes &&
      typeof scene.hash === 'string' &&
      points.length > 0 &&
      points.every(([name, point]) => isName(name) && isPoint(point));
    return valid ? scene : undefined;
  } catch {
    return undefined;
  }
}

// Los bytes del archivo si es común, del tipo y dentro del tope de su clase; si no, el problema.
function bytesOf(
  dir: string,
  file: string,
): { bytes: Buffer; suffix: string; name: string } | string {
  const kind = kinds.find((one) => file.endsWith(one.suffix));
  const name = kind ? file.slice(0, -kind.suffix.length) : '';
  if (!kind || !isName(name)) return 'nombre o tipo que no va';
  const stat = lstatSync(join(dir, file));
  if (!stat.isFile()) return 'no es un archivo común';
  if (stat.size > kind.max)
    return `pesa ${Math.ceil(stat.size / kb)} KB (tope ${kind.max / kb} KB)`;
  const bytes = readFileSync(join(dir, file));
  if (bytes.length < 12 || !kind.magic(bytes)) return 'su contenido no es lo que dice su nombre';
  return { bytes, suffix: kind.suffix, name };
}

function readOne(dir: string, file: string, media: Media, problems: Problems): void {
  const read = bytesOf(dir, file);
  const bad = (message: string) => problems.push(`docs/manual/media/${file}: ${message}`);
  if (typeof read === 'string') return void bad(read);
  if (read.suffix !== '.json') {
    if (read.suffix === '.webm') media.clips.add(read.name);
    media.files.set(file, read.bytes);
    return;
  }
  const scene = sceneOf(read.bytes);
  if (scene) media.scenes.set(read.name, scene);
  else bad('la escena no tiene la forma esperada');
}

export function readMedia(manualDir: string, problems: Problems): Media {
  const media: Media = { scenes: new Map(), clips: new Set(), files: new Map() };
  const dir = join(manualDir, 'media');
  let files: string[] = [];
  try {
    files = readdirSync(dir).sort();
  } catch {
    return media;
  }
  for (const file of files) readOne(dir, file, media, problems);
  for (const scene of media.scenes.keys())
    if (!media.files.has(`${scene}.webp`))
      problems.push(`docs/manual/media/${scene}.json: falta su captura ${scene}.webp`);
  for (const clip of media.clips)
    if (!media.files.has(`${clip}.end.webp`))
      problems.push(`docs/manual/media/${clip}.webm: falta su último cuadro ${clip}.end.webp`);
  return media;
}
