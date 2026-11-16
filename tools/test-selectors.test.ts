// El control de que las pruebas busquen como la persona (ADR-019).
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findHtmlInTests } from './checks/test-selectors.ts';

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'ferrebress-tests-'));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

describe('findHtmlInTests', () => {
  it('avisa una prueba que busca por el HTML, salvo las de ui/ y los kits', () => {
    const root = project({
      'src/app/modules/a/a.test.tsx': "document.querySelector('.x');",
      'src/app/modules/a/b.test.tsx': "screen.getByRole('button');",
      'src/app/views/basic/ui/x/x.test.tsx': "el.classList.contains('on');",
      'src/app/views/basic/a/kit.tsx': "document.querySelector('.x');",
    });
    expect(findHtmlInTests(root, [])).toEqual([
      'src/app/modules/a/a.test.tsx: busca por el HTML; que lo haga su kit (ADR-019)',
    ]);
  });

  it('lo pendiente no falla; lo pendiente ya limpio o que no existe, sí; sin aplicación, nada', () => {
    const root = project({
      'src/app/modules/a/a.test.tsx': "document.querySelector('.x');",
      'src/app/modules/a/b.test.tsx': "screen.getByRole('button');",
    });
    expect(
      findHtmlInTests(root, ['src/app/modules/a/a.test.tsx', 'src/app/modules/a/b.test.tsx']),
    ).toEqual([
      'src/app/modules/a/b.test.tsx: ya no busca por el HTML o no existe; sacala de la lista',
    ]);
    expect(findHtmlInTests(project({}), [])).toEqual([]);
  });
});
