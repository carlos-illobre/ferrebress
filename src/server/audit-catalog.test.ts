// Cada tipo de acción que anota el servidor está en el catálogo de Quién hizo qué (diseño de 05,
// § 4): así ninguno se muestra como «Otra acción». Recorre el código del servidor buscando lo que se
// anota.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { catalog } from '@ferrebress/shared/audit-log/index';
import { isPermission } from '@ferrebress/shared/contracts/permissions';
import { describe, expect, it } from 'vitest';

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sources(join(dir, entry.name))
      : entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')
        ? [join(dir, entry.name)]
        : [],
  );

describe('el catálogo y lo que anota el servidor', () => {
  it('cada tipo que se anota está en el catálogo', () => {
    const recorded = new Set<string>();
    for (const file of sources(join(import.meta.dirname))) {
      const code = readFileSync(file, 'utf8');
      // Un permiso que aparece en la misma línea no es una acción.
      for (const match of code.matchAll(
        /(?:record\(c, |type: |const type = [^;]*?|answer\([^;]*?|\? )'([a-z-]+\.[a-z.-]+|sign-out)'/g,
      ))
        if (!isPermission(match[1])) recorded.add(match[1] as string);
    }
    expect(recorded.size).toBeGreaterThan(28);
    expect([...recorded].filter((type) => !(type in catalog))).toEqual([]);
  });
});
