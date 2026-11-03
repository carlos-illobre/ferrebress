// Lo que hace el service worker (diseño de 01, «La versión nueva»), aparte de sus eventos para
// probarlo. Guarda solo el esqueleto: la página y lo que ella carga de entrada; el resto, recién
// cuando se usa. La página se pide siempre primero a la red, así llega cada versión nueva (00 · R5);
// sin conexión, abre la guardada (00 · R3.6). Nunca guarda ni contesta nada de /api.
import { product } from '@ferrebress/shared/contracts/product';

export type Box = Pick<Cache, 'match' | 'put' | 'keys' | 'delete'>;
export type Fetch = (request: Request | string) => Promise<Response>;

export const shell = '/';
export const boxName = product.id;

export type Kind = 'page' | 'asset' | 'skip';

// Qué es cada pedido: la página, un archivo de la aplicación o algo que no se toca.
export function kindOf(request: Request, origin: string): Kind {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== origin || url.pathname.startsWith('/api/'))
    return 'skip';
  // La página de la aplicación; el marco del botón de Google no se guarda.
  if (request.mode === 'navigate') return request.destination === 'document' ? 'page' : 'skip';
  return url.pathname.startsWith('/assets/') ? 'asset' : 'skip';
}

// Los archivos que la página carga de entrada: su esqueleto.
export function skeletonOf(page: string): string[] {
  return [...page.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((found) => found[1] as string);
}

// Guarda la página y su esqueleto, todo junto: si un archivo no llega (un error en medio de un
// despliegue), sigue la versión guardada y se vuelve a probar la próxima vez, así nunca queda una
// página sin sus archivos ni un error guardado. Los que faltan se piden a la vez. Si la página es de
// otra versión, borra lo guardado de la anterior; si es la misma, lo guardado al usarla (las
// imágenes, las letras, las pantallas) queda.
async function keep(box: Box, fetcher: Fetch, page: Response): Promise<void> {
  const skeleton = skeletonOf(await page.clone().text());
  const kept = await Promise.all(skeleton.map((path) => box.match(path)));
  const missing = skeleton.filter((_, at) => !kept[at]);
  const fetched = await Promise.all(missing.map((path) => fetcher(path)));
  if (!fetched.every((response) => response.ok)) return;
  const before = await box.match(shell);
  const same = before !== undefined && skeletonOf(await before.text()).join() === skeleton.join();
  await Promise.all([
    box.put(shell, page),
    ...missing.map((path, at) => box.put(path, fetched[at] as Response)),
  ]);
  if (same) return;
  for (const request of await box.keys()) {
    const { pathname } = new URL(request.url);
    if (pathname !== shell && !skeleton.includes(pathname)) await box.delete(request);
  }
}

// Solo se guarda una página de verdad: un error o una respuesta que no es HTML (un proxy, una
// página de la red del lugar) no reemplaza la guardada (revisión de seguridad, 34).
const isPage = (response: Response) =>
  response.ok && (response.headers.get('content-type') ?? '').startsWith('text/html');

export async function install(box: Box, fetcher: Fetch): Promise<void> {
  const fresh = await fetcher(shell);
  if (isPage(fresh)) await keep(box, fetcher, fresh);
}

// La página nueva se muestra apenas llega; guardarla con su esqueleto sigue después (`later`), sin
// demorarla. Sin conexión, la guardada.
export async function page(
  request: Request,
  box: Box,
  fetcher: Fetch,
  later: (work: Promise<unknown>) => void,
): Promise<Response> {
  const fresh = await fetcher(request).catch(() => undefined);
  if (!fresh) return (await box.match(shell)) ?? Response.error();
  if (isPage(fresh)) later(keep(box, fetcher, fresh.clone()).catch(() => undefined));
  return fresh;
}

export async function asset(request: Request, box: Box, fetcher: Fetch): Promise<Response> {
  const kept = await box.match(request);
  if (kept) return kept;
  const fresh = await fetcher(request);
  if (fresh.ok) await box.put(request, fresh.clone());
  return fresh;
}
