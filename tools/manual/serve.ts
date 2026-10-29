// El manual en el servidor de desarrollo (diseño del manual, § 2): lo de /manual/… sale de lo armado
// en la memoria, buscado por nombre (así `..` o `%2e%2e` no llegan a ningún archivo), sin guardarse
// (`no-store`). La página /manual, con o sin lo de después del ?, sigue de largo: es la aplicación.
import type { IncomingMessage, ServerResponse } from 'node:http';

export const manualPrefix = '/manual/';

export function serveManual(files: () => Map<string, Buffer>) {
  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const [path] = (request.url ?? '').split('?') as [string];
    if (!path.startsWith(manualPrefix)) return next();
    const file = files().get(path.slice(manualPrefix.length));
    response.statusCode = file ? 200 : 404;
    response.setHeader('Cache-Control', 'no-store');
    response.end(file);
  };
}
