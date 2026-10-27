// Recorrer y leer los archivos del repositorio para los controles propios de pnpm check.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const skipped = new Set(['node_modules', 'dist', 'coverage', '.git']);

// Todos los archivos debajo de `dir` que terminan en alguna de `extensions`, con su ruta
// relativa a `root`. No entra a las carpetas de dependencias ni de lo construido.
export function listFiles(root: string, dir: string, extensions: string[]): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory())
      return skipped.has(entry.name) ? [] : listFiles(root, path, extensions);
    return extensions.some((ext) => entry.name.endsWith(ext)) ? [path] : [];
  });
}

export const readText = (root: string, path: string): string =>
  readFileSync(join(root, path), 'utf8');
