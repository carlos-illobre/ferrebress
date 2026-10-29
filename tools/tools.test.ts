import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bootFiles, findHeavyBoot, maxBootBytes } from './checks/boot-size.ts';
import { findBrokenLinks } from './checks/doc-links.ts';
import { findLongFiles, maxLinesPerFile } from './checks/file-sizes.ts';
import { findCrowdedFolders, maxFilesPerFolder } from './checks/folder-sizes.ts';
import { findFilesWithoutHeader } from './checks/header-comments.ts';
import { findRawHtml } from './checks/raw-html.ts';

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

describe('findHeavyBoot', () => {
  const page =
    '<script type="module" src="/assets/main.js"></script><link rel="stylesheet" href="/assets/main.css"><link rel="modulepreload" href="/assets/main.js"><link rel="icon" href="/icons/i.png">';

  it('cuenta los scripts y estilos que la página carga de entrada, una vez cada uno', () => {
    expect(bootFiles(page)).toEqual(['assets/main.js', 'assets/main.css']);
  });

  it('avisa si lo de entrada pasa el máximo con gzip, y si no, nada', () => {
    const light = project({ 'index.html': page, 'assets/main.js': 'x', 'assets/main.css': 'y' });
    expect(findHeavyBoot(light)).toEqual([]);
    // Bytes al azar: gzip casi no los achica.
    const noise = randomBytes(maxBootBytes * 2).toString('base64');
    const heavy = project({ 'index.html': page, 'assets/main.js': noise, 'assets/main.css': '' });
    expect(findHeavyBoot(heavy)[0]).toMatch(/El arranque pesa .* KB con gzip \(máximo 60\.0 KB\)/);
  });
});

describe('findRawHtml', () => {
  it('avisa HTML armado con texto y estilos puestos en el HTML, salvo en las pruebas', () => {
    const root = project({
      'src/app/a.ts': 'el.innerHTML = x;\nok();\nel.setAttribute("style", "left:0");',
      'src/app/b.tsx': "box.insertAdjacentHTML('beforeend', x); el.style.setProperty('--x', '1');",
      'src/app/c.test.tsx': 'document.body.innerHTML = html;',
      'src/app/d.ts': 'el.setAttribute("aria-label", "x"); document.writeln',
    });
    expect(findRawHtml(root).sort()).toEqual([
      'src/app/a.ts:1: no se arma HTML con texto ni estilos en el HTML',
      'src/app/a.ts:3: no se arma HTML con texto ni estilos en el HTML',
      'src/app/b.tsx:1: no se arma HTML con texto ni estilos en el HTML',
    ]);
  });
});
