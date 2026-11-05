// El control del estado local de las pantallas (diseño de 03, § 5.1).
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findUnmarkedState } from './checks/local-state.ts';

function project(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'ferrebress-local-'));
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

describe('findUnmarkedState', () => {
  it('avisa un useState sin «// local:», salvo en la entrada y en las pruebas', () => {
    const root = project({
      'src/app/modules/users/a.tsx': [
        'const [a] = useState(1);',
        '// local: el foco es del dispositivo',
        'const [b] = useState(2);',
        'const [c] = useState<number>(3); // local: la cámara',
        "import { useState } from 'preact/hooks';",
      ].join('\n'),
      'src/app/modules/sign-in/b.tsx': 'const [a] = useState(1);',
      'src/app/modules/users/c.test.tsx': 'const [a] = useState(1);',
    });
    expect(findUnmarkedState(root)).toEqual([
      'src/app/modules/users/a.tsx:1: useState sin «// local:»: espejalo con useMirrored o decí por qué no',
    ]);
  });
});
