// Antes de las pruebas del servidor, una sola vez: crea una base PGlite vacía y la deja en un
// archivo, para que cada archivo de pruebas arranque la suya desde ahí (testing/setup.ts) en lugar
// de crearla de cero. Lo corre Vitest fuera de las pruebas (vitest.config.ts, globalSetup). PGlite
// se crea en otro proceso: en el de Vitest no termina bien.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    pgliteTemplate: string;
  }
}

const script = `
import { writeFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
await db.waitReady;
await db.query('select 1');
const dump = await db.dumpDataDir('none');
writeFileSync(process.argv[1], Buffer.from(await dump.arrayBuffer()));
process.exit(0);
`;

// biome-ignore lint/style/noDefaultExport: Vitest toma el arranque común (globalSetup) de la exportación por omisión.
export default function setup(project: TestProject) {
  const dir = mkdtempSync(join(tmpdir(), 'ferrebress-pglite-'));
  const path = join(dir, 'template.tar');
  execFileSync(process.execPath, ['--input-type=module', '-e', script, path], {
    cwd: import.meta.dirname,
    stdio: 'inherit',
  });
  project.provide('pgliteTemplate', path);
  return () => rmSync(dir, { recursive: true, force: true });
}
