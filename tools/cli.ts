// Punto de entrada de los controles propios de pnpm check. Queda fuera de la cobertura
// (vitest.config.ts): solo elige el control y sale con su resultado; los controles se prueban.
import { findBrokenLinks } from './doc-links.ts';
import { findLongFiles } from './file-sizes.ts';

const root = process.cwd();
const checks: Record<string, () => string[]> = {
  links: () => findBrokenLinks(root, ['.']),
  sizes: () => findLongFiles(root),
};

const problems = checks[process.argv[2] ?? '']?.() ?? [`control desconocido: ${process.argv[2]}`];
for (const problem of problems) console.error(problem);
process.exitCode = problems.length > 0 ? 1 : 0;
