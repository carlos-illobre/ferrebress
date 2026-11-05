// Que el estado de las pantallas viaje al otro dispositivo salvo que diga por qué no (diseño de 03,
// § 5.1): en los módulos de la aplicación, cada `useState` lleva en el mismo renglón o en el de
// arriba un comentario `// local:` con el motivo; lo que se espeja usa `useMirrored`. La entrada
// (`sign-in`) es toda del dispositivo y no se mira. Las pruebas tampoco.
import { listFiles, readText } from '../files.ts';
import { isTest } from '../source-code.ts';

const local = /\/\/ local:/;

export function findUnmarkedState(root: string): string[] {
  return listFiles(root, 'src/app/modules', ['.ts', '.tsx'])
    .filter((path) => !isTest(path) && !path.includes('modules/sign-in/'))
    .flatMap((path) => {
      const lines = readText(root, path).split('\n');
      return lines.flatMap((line, index) =>
        /\buseState\b[(<]/.test(line) && !local.test(line) && !local.test(lines[index - 1] ?? '')
          ? [
              `${path}:${index + 1}: useState sin «// local:»: espejalo con useMirrored o decí por qué no`,
            ]
          : [],
      );
    });
}
