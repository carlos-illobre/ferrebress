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

// Guarda la página y su esqueleto. Si la página es de otra versión, borra lo guardado de la anterior;
// si es la misma, lo guardado al usarla (las imágenes, las letras, las pantallas) queda.
async function keep(box: Box, fetcher: Fetch, page: Response): Promise<void> {
  const skeleton = skeletonOf(await page.clone().text());
  const before = await box.match(shell);
  const same = before !== undefined && skeletonOf(await before.text()).join() === skeleton.join();
  await box.put(shell, page);
  for (const path of skeleton)
    if (!(await box.match(path))) await box.put(path, await fetcher(path));
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

export async function page(request: Request, box: Box, fetcher: Fetch): Promise<Response> {
  try {
    const fresh = await fetcher(request);
    if (isPage(fresh)) await keep(box, fetcher, fresh.clone());
    return fresh;
  } catch {
    return (await box.match(shell)) ?? Response.error();
  }
}

export async function asset(request: Request, box: Box, fetcher: Fetch): Promise<Response> {
  const kept = await box.match(request);
  if (kept) return kept;
  const fresh = await fetcher(request);
  if (fresh.ok) await box.put(request, fresh.clone());
  return fresh;
}
