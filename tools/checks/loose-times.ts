// Que ninguna hora se escriba fuera de src/app/platform/time.ts (diseño de 04, § 4): ahí se elige el
// formato de la persona y la zona del negocio. Una hora escrita por su lado tendría la zona del
// dispositivo o no seguiría el formato elegido. Las pruebas pueden.
import { listFiles, readText } from '../files.ts';
import { isTest } from '../source-code.ts';

const home = 'src/app/platform/time.ts';
const forbidden = /\b(hour\s*:|(hourCycle|hour12|toLocaleTimeString|getHours|getUTCHours)\b)/;

export function findLooseTimes(root: string): string[] {
  return listFiles(root, 'src/app', ['.ts', '.tsx'])
    .filter((path) => !isTest(path) && path !== home)
    .flatMap((path) =>
      readText(root, path)
        .split('\n')
        .flatMap((line, index) =>
          forbidden.test(line)
            ? [`${path}:${index + 1}: las horas se escriben con platform/time.ts`]
            : [],
        ),
    );
}
