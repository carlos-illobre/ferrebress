import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, readText } from './files.ts';

export const maxLinesPerFile = 250;
const codeFolders = ['src', 'tools', 'tests'];

// Los archivos de código de más de `maxLinesPerFile` líneas (ADR-016).
export function findLongFiles(root: string): string[] {
  return codeFolders
    .filter((dir) => existsSync(join(root, dir)))
    .flatMap((dir) => listFiles(root, dir, ['.ts', '.tsx', '.css']))
    .map((path) => ({ path, lines: readText(root, path).split('\n').length }))
    .filter(({ lines }) => lines > maxLinesPerFile)
    .map(({ path, lines }) => `${path}: ${lines} líneas (máximo ${maxLinesPerFile})`);
}
