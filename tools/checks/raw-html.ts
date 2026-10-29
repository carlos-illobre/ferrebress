// Que la aplicación nunca arme HTML con texto ni ponga estilos en el HTML (revisión de seguridad del
// manual, 1): todo se dibuja con Preact, y las posiciones se ponen por CSSOM, que la política de
// contenido permite sin 'unsafe-inline'. Las pruebas sí pueden armar HTML para probar.
import { listFiles, readText } from '../files.ts';
import { isTest } from '../source-code.ts';

const forbidden =
  /\b(innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b|setAttribute\(\s*['"]style['"]/;

export function findRawHtml(root: string): string[] {
  return listFiles(root, 'src/app', ['.ts', '.tsx'])
    .filter((path) => !isTest(path))
    .flatMap((path) =>
      readText(root, path)
        .split('\n')
        .flatMap((line, index) =>
          forbidden.test(line)
            ? [`${path}:${index + 1}: no se arma HTML con texto ni estilos en el HTML`]
            : [],
        ),
    );
}
