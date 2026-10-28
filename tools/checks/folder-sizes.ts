// El límite de archivos por carpeta del código (constitución, XII): pasado el límite, los
// archivos se agrupan por concepto en subcarpetas. Las pruebas no cuentan.
import { dirname } from 'node:path';
import { isTest, listSourceCode } from '../source-code.ts';

export const maxFilesPerFolder = 20;

export function findCrowdedFolders(root: string): string[] {
  const counts = new Map<string, number>();
  for (const path of listSourceCode(root).filter((file) => !isTest(file))) {
    counts.set(dirname(path), (counts.get(dirname(path)) ?? 0) + 1);
  }
  return [...counts]
    .filter(([, count]) => count > maxFilesPerFolder)
    .map(
      ([folder, count]) =>
        `${folder}: ${count} archivos (máximo ${maxFilesPerFolder}): agrupalos por concepto`,
    );
}
