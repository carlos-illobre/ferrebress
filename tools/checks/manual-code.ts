// El código del manual va aparte (diseño del manual, § 5; 00 · E39): sale en `manual/app-*.js` y
// `manual/app-*.css`, que el service worker no guarda y que no entra en el arranque, y no pasa de su
// tope con gzip. Si cambia la carpeta de la pantalla y Vite lo deja en `assets/`, esto frena.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const maxManualCodeBytes = 20 * 1024;

// Una clase que solo tiene la pantalla del manual.
const manualMark = 'manual-page';

export function findLooseManual(dist: string): string[] {
  const code = readdirSync(join(dist, 'manual')).filter((file) => /^app-.+\.(js|css)$/.test(file));
  const problems = ['js', 'css']
    .filter((kind) => !code.some((file) => file.endsWith(`.${kind}`)))
    .map((kind) => `Falta el código del manual en manual/app-*.${kind}`);
  const loose = readdirSync(join(dist, 'assets')).filter(
    (file) =>
      /\.(js|css)$/.test(file) &&
      readFileSync(join(dist, 'assets', file), 'utf8').includes(manualMark),
  );
  problems.push(...loose.map((file) => `El código del manual quedó en assets/${file}`));
  const bytes = code.reduce(
    (total, file) => total + gzipSync(readFileSync(join(dist, 'manual', file))).length,
    0,
  );
  if (bytes > maxManualCodeBytes)
    problems.push(
      `El código del manual pesa ${(bytes / 1024).toFixed(1)} KB con gzip (máximo ${maxManualCodeBytes / 1024} KB)`,
    );
  return problems;
}
