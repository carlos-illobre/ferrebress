// Subir un archivo con su avance (08 · R4.9): fetch no dice cuánto se mandó, así que va con
// XMLHttpRequest. El archivo viaja como cuerpo crudo (`application/octet-stream`), al único camino
// del servidor que lo acepta (http.upload). Lleva las mismas cabeceras que cualquier pedido y lo que
// vuelve se lee igual que en api.ts. Cancelar corta la subida: no queda nada (R4.11).
import { type ApiResult, requestHeaders, settle } from './api.ts';

export type Sent = (sent: number, total: number) => void;

const headersOf = (raw: string) =>
  new Headers(
    raw
      .trim()
      .split(/[\r\n]+/)
      .filter((line) => line.includes(':'))
      .map((line) => {
        const at = line.indexOf(':');
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()] as [string, string];
      }),
  );

export function upload<T>(
  path: string,
  file: Blob,
  onSent: Sent,
  signal?: AbortSignal,
): Promise<ApiResult<T> | 'cancelled'> {
  return new Promise((resolve) => {
    const request = new XMLHttpRequest();
    request.open('POST', path);
    for (const [name, value] of Object.entries(requestHeaders(path, true)))
      request.setRequestHeader(name, value);
    request.setRequestHeader('Content-Type', 'application/octet-stream');
    request.upload.onprogress = (event) => onSent(event.loaded, event.total || file.size);
    request.onload = () =>
      void settle<T>(
        new Response(request.responseText, {
          status: request.status,
          headers: headersOf(request.getAllResponseHeaders()),
        }),
      ).then(resolve);
    request.onerror = () => void settle<T>(undefined).then(resolve);
    request.onabort = () => resolve('cancelled');
    signal?.addEventListener('abort', () => request.abort());
    request.send(file);
  });
}
