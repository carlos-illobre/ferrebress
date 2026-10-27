// Un servidor de mentira para las pruebas de la aplicación: contesta por ruta lo que cada prueba le
// pida y anota lo que le mandaron. Reemplaza a fetch mientras dura la prueba.
import { vi } from 'vitest';

// 'offline': sin conexión; 'waiting': el servidor no contesta nunca.
export type Reply = { status?: number; body?: unknown; stream?: string } | 'offline' | 'waiting';

export type Sent = { path: string; body: unknown };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body ?? { ok: true }), {
    status,
    headers: { 'X-Ferrebress': 'v=app-test; t=1700000000000; e=testing' },
  });

function answer(reply: Reply): Promise<Response> | Response {
  if (reply === 'offline') throw new TypeError('Failed to fetch');
  if (reply === 'waiting') return new Promise<Response>(() => {});
  if (reply.stream !== undefined) return new Response(reply.stream);
  return json(reply.status ?? 200, reply.body);
}

// Cada ruta contesta con su lista de respuestas, en orden; la última se repite.
export function fakeServer(routes: Record<string, Reply | Reply[]>) {
  const sent: Sent[] = [];
  const left = new Map(Object.entries(routes).map(([path, reply]) => [path, [reply].flat()]));
  const fetch = vi.fn(async (path: string, init?: RequestInit) => {
    sent.push({ path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const replies = left.get(path) ?? [{ status: 404, body: { error: 'not-found' } }];
    const reply = (replies.length > 1 ? replies.shift() : replies[0]) as Reply;
    return answer(reply);
  });
  vi.stubGlobal('fetch', fetch);
  return { sent, bodies: (path: string) => sent.filter((s) => s.path === path).map((s) => s.body) };
}
