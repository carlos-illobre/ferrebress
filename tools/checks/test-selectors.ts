// Que las pruebas busquen como la persona (ADR-019): por rol, nombre y texto, nunca por clase ni por
// selectores de CSS. Solo los conductores de cada pantalla (los kits, en la carpeta de su vista)
// saben cómo está armado el HTML; las pruebas de las piezas de ui/ sí miran sus clases. Mientras
// dure T134, `pending` dice qué pruebas todavía buscan por el HTML: esas no fallan, y si una ya quedó
// limpia hay que sacarla de la lista, así solo se achica.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, readText } from '../files.ts';

const byHtml =
  /\bquerySelector(All)?(<[^>]*>)?\(|\bclassList\.contains\(|\bgetElementsByClassName\(|\.closest\(/;

export function findHtmlInTests(root: string, pending: readonly string[]): string[] {
  const folder = 'src/app';
  if (!existsSync(join(root, folder))) return [];
  const tests = listFiles(root, folder, ['.ts', '.tsx']).filter(
    (path) => /\.test\.tsx?$/.test(path) && !path.includes('/views/basic/ui/'),
  );
  const dirty = tests.filter((path) => byHtml.test(readText(root, path)));
  return [
    ...dirty
      .filter((path) => !pending.includes(path))
      .map((path) => `${path}: busca por el HTML; que lo haga su kit (ADR-019)`),
    ...pending
      .filter((path) => !dirty.includes(path))
      .map((path) => `${path}: ya no busca por el HTML o no existe; sacala de la lista`),
  ];
}

// Las pruebas que todavía buscan por el HTML (T134).
export const pendingTests = [
  'src/app/modules/administration/administration-edges.test.tsx',
  'src/app/modules/administration/administration-shortcuts.test.tsx',
  'src/app/modules/administration/administration.test.tsx',
  'src/app/modules/audit-log/audit-filters.test.tsx',
  'src/app/modules/audit-log/audit-log.test.tsx',
  'src/app/modules/audit-log/live.test.tsx',
  'src/app/modules/audit-log/tape.test.tsx',
  'src/app/modules/device-settings/mine-here.test.tsx',
  'src/app/modules/device-settings/mine.test.tsx',
  'src/app/modules/frame/frame.test.tsx',
  'src/app/modules/frame/menu-letters.test.tsx',
  'src/app/modules/frame/more-crumb.test.tsx',
  'src/app/modules/frame/notices/notices.test.tsx',
  'src/app/modules/frame/phone.test.tsx',
  'src/app/modules/manual/manual-keyboard.test.tsx',
  'src/app/modules/manual/manual-phone.test.tsx',
  'src/app/modules/manual/manual-screen.test.tsx',
  'src/app/modules/sign-in/entrance.test.tsx',
  'src/app/modules/sign-in/google-slot.test.tsx',
  'src/app/modules/sign-in/shortcuts/sign-in-keys.test.tsx',
  'src/app/modules/users/users-roles-confirm.test.tsx',
  'src/app/modules/users/users-roles-guard.test.tsx',
  'src/app/views/basic/device-link/pairing.test.tsx',
  'src/app/views/basic/device-link/screens.test.tsx',
  'src/app/views/basic/device-link/sides.test.tsx',
  'src/app/views/basic/manual/Glyph/glyph.test.tsx',
];
