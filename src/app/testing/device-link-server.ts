// El servidor del vínculo, de mentira, para dos dispositivos en una prueba (diseño de 03, § 4 y § 7):
// el tema de cada lado, presentarlos con un intento, pasar la señal y el respaldo, la confirmación con
// la huella y las sesiones, desconectar y reconectar. Hace lo mismo que el de verdad con lo que la
// aplicación ve; sus reglas se prueban en el servidor.
import type { PairingView, Side } from '@ferrebress/shared/contracts/device-link';
import { fingerprintOf } from '@ferrebress/shared/peer/candidates';
import type { TopicHandler } from '../platform/realtime/demand.ts';
import type { ApiResult } from '../platform/server/api.ts';

const other = (side: Side): Side => (side === 'phone' ? 'computer' : 'phone');
const later = (run: () => void) => setTimeout(run, 0);
type Body = Record<string, unknown> | undefined;

type World = ReturnType<typeof createWorld>;

function createWorld() {
  return {
    paired: true,
    paused: false,
    id: 'v'.repeat(36),
    attempts: 0,
    listening: new Map<Side, TopicHandler>(),
    fingerprints: new Map<Side, string>(),
    open: new Map<Side, boolean>([
      ['phone', true],
      ['computer', true],
    ]),
    online: new Map<Side, boolean>([
      ['phone', true],
      ['computer', true],
    ]),
    calls: [] as string[],
  };
}

const viewOf = (world: World, side: Side): PairingView => ({
  id: world.id,
  side,
  other: { label: side === 'phone' ? 'Computadora' : 'Celular' },
  since: 0,
  lastMirrored: 0,
  paused: world.paused,
});
const publish = (world: World, side: Side, data: unknown) =>
  later(() => world.listening.get(side)?.onEvent(data));

// Escuchar el tema de un lado: si el otro ya escucha, los presenta con un intento nuevo.
function want(world: World, side: Side, handler: TopicHandler) {
  world.listening.set(side, handler);
  if (!world.listening.has(other(side))) publish(world, side, { present: false });
  else {
    world.attempts += 1;
    const attempt = world.attempts.toString(16).padStart(8, '0');
    publish(world, side, { present: true, attempt });
    publish(world, other(side), { present: true, attempt });
  }
  return () => {
    world.listening.delete(side);
    publish(world, other(side), { present: false });
  };
}

function setPaused(world: World, side: Side, paused: boolean) {
  world.paused = paused;
  publish(world, other(side), { pairing: viewOf(world, other(side)) });
  return { pairing: viewOf(world, side) };
}

type Route = (world: World, side: Side, body: Body, query: URLSearchParams) => unknown;
const routes: Record<string, Route> = {
  check(world, side, _body, query) {
    if (!world.paired) return {};
    const fp = query.get('fp');
    if (fp === null) return { pairing: viewOf(world, side) };
    const ok = world.open.get(other(side)) && world.fingerprints.get(other(side)) === fp;
    return { pairing: viewOf(world, side), peer: ok ? 'ok' : 'gone' };
  },
  signal(world, side, body) {
    world.fingerprints.set(side, fingerprintOf(String(body?.sdp)) as string);
    publish(world, other(side), { signal: body });
    return { ok: true };
  },
  relay(world, side, body) {
    if (!world.listening.has(other(side))) return { error: 'peer-gone' };
    publish(world, other(side), { relay: body?.messages });
    return { ok: true };
  },
  pause: (world, side) => setPaused(world, side, true),
  resume: (world, side) => (world.paired ? setPaused(world, side, false) : { error: 'not-paired' }),
  report: () => ({ ok: true }),
};

export function createLinkServer() {
  const world = createWorld();
  // Lo que hace `api()` de un dispositivo contra este servidor.
  const api =
    (side: Side) =>
    async <T>(path: string, body?: unknown): Promise<ApiResult<T>> => {
      await Promise.resolve();
      const url = new URL(path, 'http://x');
      const name = url.pathname.replace('/api/device-link/', '');
      world.calls.push(`${side}:${name}`);
      if (!world.online.get(side)) return { ok: false, error: 'offline' };
      const route = routes[name] as Route;
      const answer = route(world, side, body as Body, url.searchParams) as { error?: string };
      if (answer?.error) return { ok: false, error: answer.error } as ApiResult<T>;
      return { ok: true, data: answer as T };
    };

  return {
    world,
    view: (side: Side) => viewOf(world, side),
    api,
    want: (side: Side) => (_token: string, handler: TopicHandler) => want(world, side, handler),
    // Lo que el servidor manda por el tema de un lado, tal cual (para probar lo que no debería llegar).
    push: (side: Side, data: unknown) => publish(world, side, data),
  };
}
