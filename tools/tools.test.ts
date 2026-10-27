import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findBrokenLinks } from './doc-links.ts';
import { findLongFiles, maxLinesPerFile } from './file-sizes.ts';
import { findCrowdedFolders, maxFilesPerFolder } from './folder-sizes.ts';
import { findFilesWithoutHeader } from './header-comments.ts';

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

describe('findCrowdedFolders', () => {
  it('avisa las carpetas de código con más archivos que el máximo, sin contar las pruebas', () => {
    const files: Record<string, string> = { 'docs/a.md': '' };
    for (let i = 0; i <= maxFilesPerFolder; i++) files[`src/big/f${i}.ts`] = '';
    for (let i = 0; i < maxFilesPerFolder; i++) {
      files[`src/ok/f${i}.ts`] = '';
      files[`src/ok/f${i}.test.ts`] = '';
    }
    expect(findCrowdedFolders(project(files))).toEqual([
      `src/big: ${maxFilesPerFolder + 1} archivos (máximo ${maxFilesPerFolder}): agrupalos por concepto`,
    ]);
  });
});

describe('findFilesWithoutHeader', () => {
  it('avisa el código que no empieza con un comentario; las pruebas y la documentación no', () => {
    const root = project({
      'vitest.config.ts': '// configura las pruebas\nexport {};',
      'package.json': '{}',
      'src/a.ts': '// se encarga de a\nexport {};',
      'src/b.ts': 'export {};',
      'src/b.test.ts': 'export {};',
      'src/empty.ts': '',
      'src/c.css': '/* los colores */',
      'deploy/x.sh': '#!/bin/bash\n# despliega\necho',
      'deploy/server.Dockerfile': '# syntax=docker/dockerfile:1\nFROM node',
      'deploy/page.html': '<!doctype html>\n<!-- la página vacía -->',
      'docs/sin.md': 'nada',
    });
    expect(findFilesWithoutHeader(root)).toEqual([
      'src/b.ts: falta el comentario que dice de qué se encarga',
      'src/empty.ts: falta el comentario que dice de qué se encarga',
      'deploy/server.Dockerfile: falta el comentario que dice de qué se encarga',
    ]);
  });
});
