// Punto de entrada de los controles propios de pnpm check. Queda fuera de la cobertura
// (vitest.config.ts): solo elige el control y sale con su resultado; los controles se prueban.
// El del arranque arma antes la aplicación con Vite, en una carpeta temporal.
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findHeavyBoot } from './boot-size.ts';
import { findBrokenLinks } from './doc-links.ts';
import { findLongFiles } from './file-sizes.ts';
import { findCrowdedFolders } from './folder-sizes.ts';
import { findFilesWithoutHeader } from './header-comments.ts';

const root = process.cwd();
const checks: Record<string, () => string[]> = {
  links: () => findBrokenLinks(root, ['.']),
  sizes: () => [...findLongFiles(root), ...findCrowdedFolders(root)],
  headers: () => findFilesWithoutHeader(root),
  boot: () => {
    const dist = join(mkdtempSync(join(tmpdir(), 'ferrebress-boot-')), 'app');
    const vite = join(root, 'src/app/node_modules/vite/bin/vite.js');
    execFileSync(process.execPath, [vite, 'build', '--outDir', dist], {
      cwd: join(root, 'src/app'),
      stdio: 'ignore',
    });
    return findHeavyBoot(dist);
  },
};

const problems = checks[process.argv[2] ?? '']?.() ?? [`control desconocido: ${process.argv[2]}`];
for (const problem of problems) console.error(problem);
process.exitCode = problems.length > 0 ? 1 : 0;
