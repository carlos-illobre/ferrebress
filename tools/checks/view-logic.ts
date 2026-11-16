// Que la vista solo muestre (ADR-019): en views/ no se escuchan teclas ni se usa fetch,
// temporizadores, localStorage, history ni document; en modules/, tampoco se escuchan teclas. Las
// teclas son de las capas del teclado; lo demás, de los modelos. Los kits y las pruebas no cuentan.
// Mientras dure T134, `pending` dice qué archivos todavía no se separaron: esos no fallan, pero si
// uno ya quedó limpio hay que sacarlo de la lista, así solo se achica.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, readText } from '../files.ts';
import { isTest } from '../source-code.ts';

const keys = /\bkeydown\b|\bonKeyDown\b/;
const globals =
  /\bfetch\(|\bsetTimeout\(|\bsetInterval\(|\blocalStorage\b|\bhistory\.|\bdocument\./;

const what = (path: string, text: string): string[] => [
  ...(keys.test(text) ? ['escucha teclas'] : []),
  ...(path.includes('/views/') && globals.test(text)
    ? ['usa fetch, temporizadores, localStorage, history o document']
    : []),
];

export function findLogicInViews(root: string, pending: readonly string[]): string[] {
  const files = ['src/app/views', 'src/app/modules']
    .filter((folder) => existsSync(join(root, folder)))
    .flatMap((folder) => listFiles(root, folder, ['.ts', '.tsx']))
    .filter((path) => !isTest(path) && !/kit\.tsx?$/.test(path) && !path.includes('/shortcuts/'));
  const problems = files.flatMap((path) => {
    const found = what(path, readText(root, path));
    if (pending.includes(path)) return [];
    return found.map((problem) => `${path}: ${problem} (la vista solo muestra, ADR-019)`);
  });
  const clean = pending.filter(
    (path) => files.includes(path) && what(path, readText(root, path)).length === 0,
  );
  return [
    ...problems,
    ...clean.map((path) => `${path}: ya está separado; sacalo de la lista de pendientes`),
    ...pending
      .filter((path) => !files.includes(path))
      .map((path) => `${path}: no existe; sacalo de la lista de pendientes`),
  ];
}

// Lo que falta separar. Quién tiene el vínculo en cada pestaña mira la actividad de la persona
// (también las teclas): es de la capa del vínculo y sale de los módulos con T138.
export const pendingViews = ['src/app/modules/device-link/tabs.ts'];
