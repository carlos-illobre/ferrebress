import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findBrokenLinks } from './doc-links.ts';
import { findLongFiles, maxLinesPerFile } from './file-sizes.ts';

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'ferrebress-tools-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, dirname(path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe('findBrokenLinks', () => {
  it('avisa solo los enlaces relativos a archivos que no existen', () => {
    const root = project({
      'docs/a.md': '[bien](b.md) [con ancla](b.md#x) [afuera](https://x.org) [mal](c.md)',
      'docs/b.md': '',
      'docs/notes.txt': '[no es markdown](nada.md)',
      'node_modules/x/README.md': '[roto](nada.md)',
    });
    expect(findBrokenLinks(root, ['.'])).toEqual(['docs/a.md: c.md']);
  });
});

describe('findLongFiles', () => {
  it('avisa los archivos de código que pasan el máximo de líneas', () => {
    const long = 'x\n'.repeat(maxLinesPerFile);
    const root = project({ 'src/long.ts': long, 'src/short.ts': 'x', 'tools/a.css': 'x' });
    expect(findLongFiles(root)).toEqual([
      `src/long.ts: ${maxLinesPerFile + 1} líneas (máximo ${maxLinesPerFile})`,
    ]);
  });
});
