// El peso del arranque de la aplicación (diseño de 01, § 10): lo que la página carga de entrada
// (sus scripts, estilos y lo que precarga), comprimido con gzip, tiene que quedar por debajo del
// máximo. Lo demás (las pantallas, la cámara, Google) se baja recién cuando se usa.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

export const maxBootBytes = 60 * 1024;

// Los archivos de /assets que nombra la página armada.
export const bootFiles = (page: string): string[] => [
  ...new Set(
    [...page.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1] as string),
  ),
];

export function findHeavyBoot(dist: string): string[] {
  const page = readFileSync(join(dist, 'index.html'), 'utf8');
  const bytes = [page, ...bootFiles(page).map((file) => readFileSync(join(dist, file)))].reduce(
    (total, content) => total + gzipSync(content).length,
    0,
  );
  if (bytes <= maxBootBytes) return [];
  const kb = (value: number) => `${(value / 1024).toFixed(1)} KB`;
  return [`El arranque pesa ${kb(bytes)} con gzip (máximo ${kb(maxBootBytes)})`];
}
