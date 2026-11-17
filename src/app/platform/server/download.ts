// Bajar un archivo del servidor (08 · R4.4, E40): con las cabeceras de la aplicación, como cualquier
// pedido, y con el nombre que dice el servidor en `Content-Disposition` (el de UTF-8 si viene). Lo que
// no es un archivo (un error en JSON, sin conexión) se lee como cualquier respuesta (settle).
import { type ApiResult, online, readServerHeader, requestHeaders, settle } from './api.ts';

export type Fetched = { blob: Blob; name: string };

// El nombre de `attachment; filename="..."; filename*=UTF-8''...`; sin ninguno, el de reserva.
export function fileNameOf(disposition: string | null, fallback: string): string {
  const utf8 = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (utf8) return decodeURIComponent(utf8);
  return disposition?.match(/filename="([^"]+)"/i)?.[1] ?? fallback;
}

export async function fetchFile(path: string, fallback: string): Promise<ApiResult<Fetched>> {
  const response = await fetch(path, { headers: requestHeaders(path, false) }).catch(
    () => undefined,
  );
  if (!response?.ok || !response.headers.get('Content-Disposition')) return settle(response);
  await readServerHeader(response);
  online.set(true);
  const name = fileNameOf(response.headers.get('Content-Disposition'), fallback);
  const blob = await response.blob().catch(() => undefined);
  return blob ? { ok: true, data: { blob, name } } : settle(undefined);
}
