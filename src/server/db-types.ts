// Escribe los tipos de las tablas (`pnpm db:types`) o controla que estén al día con las migraciones
// (`pnpm db:types:check`, en pnpm check), según ADR-018. Queda fuera de la cobertura
// (vitest.config.ts): solo elige y sale con el resultado; table-types.ts se prueba.
import { findStaleTableTypes, writeTableTypes } from './table-types.ts';

const root = new URL('../..', import.meta.url).pathname;
const write = process.argv[2] === '--write';
if (write) await writeTableTypes(root);
const problems = write ? [] : await findStaleTableTypes(root);
for (const problem of problems) console.error(problem);
process.exitCode = problems.length > 0 ? 1 : 0;
