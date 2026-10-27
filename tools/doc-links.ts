import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { listFiles, readText } from './files.ts';

const link = /\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
const isExternal = (target: string) => /^[a-z]+:/.test(target);

// Los enlaces relativos de los Markdown que apuntan a un archivo que no existe.
export function findBrokenLinks(root: string, dirs: string[]): string[] {
  return dirs
    .flatMap((dir) => listFiles(root, dir, ['.md']))
    .flatMap((path) =>
      [...readText(root, path).matchAll(link)]
        .map(([, target]) => target as string)
        .filter((target) => !isExternal(target) && !existsSync(join(root, dirname(path), target)))
        .map((target) => `${path}: ${target}`),
    );
}
