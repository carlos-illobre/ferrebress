// El control de que la vista solo muestre (ADR-019).
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findLogicInViews } from './checks/view-logic.ts';

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'ferrebress-views-'));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

describe('findLogicInViews', () => {
  it('avisa una vista que escucha teclas o usa document, y un modelo que escucha teclas', () => {
    const root = project({
      'src/app/views/basic/a/A.tsx': '<input onKeyDown={go} />',
      'src/app/views/basic/a/B.tsx': 'document.title = "x";',
      'src/app/views/basic/a/C.tsx': 'export const C = () => null;',
      'src/app/views/basic/a/a-kit.tsx': 'document.querySelector("x");',
      'src/app/views/basic/a/A.test.tsx': 'setTimeout(go);',
      'src/app/modules/a/state.ts': "addEventListener('keydown', go); setTimeout(go);",
      'src/app/modules/a/shortcuts/a.ts': "addEventListener('keydown', go);",
    });
    expect(findLogicInViews(root, [])).toEqual([
      'src/app/views/basic/a/A.tsx: escucha teclas (la vista solo muestra, ADR-019)',
      'src/app/views/basic/a/B.tsx: usa fetch, temporizadores, localStorage, history o document (la vista solo muestra, ADR-019)',
      'src/app/modules/a/state.ts: escucha teclas (la vista solo muestra, ADR-019)',
    ]);
  });

  it('lo pendiente no falla, pero lo pendiente que ya está limpio o no existe, sí', () => {
    const root = project({
      'src/app/views/basic/a/A.tsx': '<input onKeyDown={go} />',
      'src/app/views/basic/a/C.tsx': 'export const C = () => null;',
    });
    expect(
      findLogicInViews(root, [
        'src/app/views/basic/a/A.tsx',
        'src/app/views/basic/a/C.tsx',
        'src/app/views/basic/a/Gone.tsx',
      ]),
    ).toEqual([
      'src/app/views/basic/a/C.tsx: ya está separado; sacalo de la lista de pendientes',
      'src/app/views/basic/a/Gone.tsx: no existe; sacalo de la lista de pendientes',
    ]);
  });

  it('en una vista, cada estado dice con «// vista:» por qué es de cómo se ve', () => {
    const root = project({
      'src/app/views/basic/a/A.tsx': [
        'const [a] = useState(1);',
        '// vista: el panel abierto',
        'const b = useRef(null);',
        'const c = useRef(null);',
        'const [d] = useState(2); // vista: la animación',
        'const e = 1;',
        'const f = useRef(null);',
      ].join('\n'),
      'src/app/modules/a/state.ts': 'const [a] = useState(1);',
    });
    expect(findLogicInViews(root, [])).toEqual([
      'src/app/views/basic/a/A.tsx: renglón 1: estado sin «// vista:» que diga por qué (la vista solo muestra, ADR-019)',
      'src/app/views/basic/a/A.tsx: renglón 7: estado sin «// vista:» que diga por qué (la vista solo muestra, ADR-019)',
    ]);
  });
});
